"""사실 수집기 — llmwiki의 '파서' 자리를 대체한다 (기획서 §3-1).

TimescaleDB에서 기간별 통계를 **순수 SQL**로 산출해 facts(dict)를 만든다.
여기서 나온 수치만이 인사이트 문서에 실릴 수 있다. LLM은 수치를 만들지 않는다.
"""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from ..db import one, query

KST = timezone(timedelta(hours=9))


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=KST)
    return start, start + timedelta(days=1)


def _energy_stats(db: str, site_id: int, start: datetime, end: datetime,
                  step_min: int = 15) -> dict[str, Any] | None:
    row = one(db, """
        SELECT count(*) AS n,
               round((sum(generation_kw) * %(h)s)::numeric, 1)  AS gen_kwh,
               round((sum(consumption_kw) * %(h)s)::numeric, 1) AS cons_kwh,
               round((sum(grid_import_kw) * %(h)s)::numeric, 1) AS import_kwh,
               round((sum(grid_export_kw) * %(h)s)::numeric, 1) AS export_kwh,
               round(max(generation_kw), 2)  AS peak_gen_kw,
               round(max(consumption_kw), 2) AS peak_cons_kw,
               round(min(battery_soc_pct), 1) AS soc_min_pct,
               round(max(battery_soc_pct), 1) AS soc_max_pct,
               round(avg(battery_soc_pct), 1) AS soc_avg_pct,
               round((sum(CASE WHEN battery_power_kw < 0 THEN -battery_power_kw ELSE 0 END) * %(h)s)::numeric, 1) AS batt_charge_kwh,
               round((sum(CASE WHEN battery_power_kw > 0 THEN battery_power_kw ELSE 0 END) * %(h)s)::numeric, 1) AS batt_discharge_kwh
        FROM ng.measurements
        WHERE site_id = %(sid)s AND ts >= %(s)s AND ts < %(e)s
    """, {"sid": site_id, "s": start, "e": end, "h": step_min / 60})
    if not row or not row["n"]:
        return None

    peaks = {}
    for col, key in (("generation_kw", "peak_gen_at"), ("consumption_kw", "peak_cons_at")):
        r = one(db, f"""
            SELECT ts FROM ng.measurements
            WHERE site_id=%(sid)s AND ts >= %(s)s AND ts < %(e)s
            ORDER BY {col} DESC, ts LIMIT 1
        """, {"sid": site_id, "s": start, "e": end})
        peaks[key] = r["ts"].astimezone(KST).strftime("%H:%M") if r else None

    stats = {k: (float(v) if v is not None else None) for k, v in row.items()}
    stats["n"] = int(row["n"])
    stats.update(peaks)

    gen, exp = stats["gen_kwh"] or 0, stats["export_kwh"] or 0
    cons, imp = stats["cons_kwh"] or 0, stats["import_kwh"] or 0
    stats["self_consumption_pct"] = round((gen - exp) / gen * 100, 1) if gen > 0 else None
    stats["self_sufficiency_pct"] = round((cons - imp) / cons * 100, 1) if cons > 0 else None

    expected = int((end - start).total_seconds() // (step_min * 60))
    stats["expected_points"] = expected
    stats["missing_pct"] = round(max(0, expected - stats["n"]) / expected * 100, 1) if expected else 0.0
    return stats


def _forecast_accuracy(db: str, site_id: int, start: datetime, end: datetime) -> list[dict[str, Any]]:
    """예측 대비 실측 오차 (MAPE/RMSE) — 모델·타깃별."""
    rows = query(db, """
        SELECT f.target, f.model, count(*) AS n,
          round(avg(CASE WHEN m_val > 0.5 THEN abs(f.value - m_val) / m_val END) * 100, 2) AS mape_pct,
          round(sqrt(avg(power(f.value - m_val, 2)))::numeric, 3) AS rmse_kw,
          round(avg(abs(f.value - m_val))::numeric, 3) AS mae_kw
        FROM ng.forecasts f
        JOIN LATERAL (
          SELECT CASE WHEN f.target='generation_kw' THEN m.generation_kw
                      WHEN f.target='consumption_kw' THEN m.consumption_kw END AS m_val
          FROM ng.measurements m
          WHERE m.site_id = f.site_id AND m.ts = f.ts
        ) mm ON mm.m_val IS NOT NULL
        WHERE f.site_id=%(sid)s AND f.ts >= %(s)s AND f.ts < %(e)s
        GROUP BY f.target, f.model
        ORDER BY f.target, mape_pct NULLS LAST
    """, {"sid": site_id, "s": start, "e": end})
    out = []
    for r in rows:
        item: dict[str, Any] = {}
        for k, v in r.items():
            try:
                item[k] = float(v) if v is not None and k not in ("target", "model") else v
            except (TypeError, ValueError):
                item[k] = v
        out.append(item)
    return out


def _events(db: str, site_id: int, start: datetime, end: datetime) -> dict[str, Any]:
    rows = query(db, """
        SELECT id, ts, event_type, severity, title, detail
        FROM ng.events
        WHERE site_id=%(sid)s AND ts >= %(s)s AND ts < %(e)s
        ORDER BY ts
    """, {"sid": site_id, "s": start, "e": end})
    return {
        "count": len(rows),
        "by_severity": {
            sev: sum(1 for r in rows if r["severity"] == sev)
            for sev in ("critical", "warning", "info")
        },
        "items": [
            {"id": r["id"], "ts": r["ts"].astimezone(KST).strftime("%m-%d %H:%M"),
             "type": r["event_type"], "severity": r["severity"],
             "title": r["title"], "detail": r["detail"]}
            for r in rows[:20]
        ],
    }


def collect_daily_facts(db: str, site_id: int, day: date) -> dict[str, Any] | None:
    """일간 운영 브리프의 사실. 데이터가 없으면 None."""
    start, end = _day_bounds(day)
    today = _energy_stats(db, site_id, start, end)
    if not today:
        return None
    site = one(db, "SELECT name FROM ng.sites WHERE id=%s", (site_id,))

    prev = _energy_stats(db, site_id, start - timedelta(days=1), start)
    week = _energy_stats(db, site_id, start - timedelta(days=7), start)
    if week:
        for k in ("gen_kwh", "cons_kwh"):
            if week.get(k) is not None:
                week[k] = round(week[k] / 7, 1)

    def delta_pct(cur: float | None, base: float | None) -> float | None:
        if cur is None or not base:
            return None
        return round((cur - base) / base * 100, 1)

    return {
        "doc_type": "daily",
        "site": site["name"] if site else f"site-{site_id}",
        "site_id": site_id,
        "date": day.isoformat(),
        "weekday": ["월", "화", "수", "목", "금", "토", "일"][day.weekday()],
        "energy": today,
        "compare": {
            "gen_vs_prev_day_pct": delta_pct(today.get("gen_kwh"), prev and prev.get("gen_kwh")),
            "cons_vs_prev_day_pct": delta_pct(today.get("cons_kwh"), prev and prev.get("cons_kwh")),
            "gen_vs_7d_avg_pct": delta_pct(today.get("gen_kwh"), week and week.get("gen_kwh")),
            "cons_vs_7d_avg_pct": delta_pct(today.get("cons_kwh"), week and week.get("cons_kwh")),
        },
        "forecast_accuracy": _forecast_accuracy(db, site_id, start, end),
        "events": _events(db, site_id, start, end),
    }


def collect_weekly_facts(db: str, site_id: int, week_end: date) -> dict[str, Any] | None:
    """주간 성능 리포트의 사실 (week_end 포함 직전 7일). TNO 실증 증거물 원천."""
    end_dt = _day_bounds(week_end)[1]
    start_dt = end_dt - timedelta(days=7)
    total = _energy_stats(db, site_id, start_dt, end_dt)
    if not total:
        return None
    site = one(db, "SELECT name FROM ng.sites WHERE id=%s", (site_id,))

    daily = []
    for i in range(7):
        d = week_end - timedelta(days=6 - i)
        s = _energy_stats(db, site_id, *_day_bounds(d))
        if s:
            daily.append({"date": d.isoformat(), "gen_kwh": s["gen_kwh"], "cons_kwh": s["cons_kwh"],
                          "self_consumption_pct": s["self_consumption_pct"],
                          "self_sufficiency_pct": s["self_sufficiency_pct"],
                          "missing_pct": s["missing_pct"]})

    iso = week_end.isocalendar()
    return {
        "doc_type": "weekly",
        "site": site["name"] if site else f"site-{site_id}",
        "site_id": site_id,
        "week": f"{iso[0]}-W{iso[1]:02d}",
        "period": {"start": (week_end - timedelta(days=6)).isoformat(), "end": week_end.isoformat()},
        "totals": total,
        "daily": daily,
        "forecast_accuracy": _forecast_accuracy(db, site_id, start_dt, end_dt),
        "events": _events(db, site_id, start_dt, end_dt),
    }


def collect_event_facts(db: str, event_id: int) -> dict[str, Any] | None:
    """이상 이벤트 노트의 사실: 이벤트 자체 + 전후 1시간의 계측 요약."""
    ev = one(db, "SELECT * FROM ng.events WHERE id=%s", (event_id,))
    if not ev:
        return None
    site = one(db, "SELECT name FROM ng.sites WHERE id=%s", (ev["site_id"],))
    around = _energy_stats(db, ev["site_id"],
                           ev["ts"] - timedelta(hours=1), ev["ts"] + timedelta(hours=1))
    return {
        "doc_type": "event",
        "site": site["name"] if site else f"site-{ev['site_id']}",
        "site_id": ev["site_id"],
        "event": {
            "id": ev["id"],
            "ts": ev["ts"].astimezone(KST).strftime("%Y-%m-%d %H:%M"),
            "type": ev["event_type"], "severity": ev["severity"],
            "title": ev["title"], "detail": ev["detail"],
        },
        "context_1h": around,
    }
