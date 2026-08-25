"""나노그리드 모니터링 API (기획서 §3-2 /ng/monitor 의 데이터 경로)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ...config import load_config
from ...db import one, query

cfg = load_config()
router = APIRouter()


@router.get("/sites")
def sites():
    return query(cfg.db_url, "SELECT id, name, lat, lon, tz FROM ng.sites ORDER BY id")


@router.get("/kpi")
def kpi(site_id: int = 1):
    """상단 KPI 카드: 현재 스냅샷 + 금일 누계."""
    latest = one(cfg.db_url, """
        SELECT ts, generation_kw, consumption_kw, battery_soc_pct, battery_power_kw,
               grid_import_kw, grid_export_kw, temp_c, irradiance_wm2
        FROM ng.measurements WHERE site_id=%s ORDER BY ts DESC LIMIT 1""", (site_id,))
    if not latest:
        raise HTTPException(404, "측정 데이터 없음 — ingest 서비스 기동 확인")

    today = one(cfg.db_url, """
        SELECT round(sum(generation_kw)  * 0.25, 1) AS gen_kwh,
               round(sum(consumption_kw) * 0.25, 1) AS cons_kwh,
               round(sum(grid_import_kw) * 0.25, 1) AS import_kwh,
               round(sum(grid_export_kw) * 0.25, 1) AS export_kwh
        FROM ng.measurements
        WHERE site_id=%s AND ts >= date_trunc('day', now() AT TIME ZONE 'Asia/Seoul')
                                 AT TIME ZONE 'Asia/Seoul'""", (site_id,))
    gen = float(today["gen_kwh"] or 0)
    exp = float(today["export_kwh"] or 0)
    cons = float(today["cons_kwh"] or 0)
    imp = float(today["import_kwh"] or 0)
    return {
        "now": latest,
        "today": today,
        "self_consumption_pct": round((gen - exp) / gen * 100, 1) if gen > 0 else None,
        "self_sufficiency_pct": round((cons - imp) / cons * 100, 1) if cons > 0 else None,
    }


@router.get("/timeseries")
def timeseries(site_id: int = 1, hours: int = Query(24, ge=1, le=24 * 14),
               with_forecast: bool = True):
    """최근 N시간 실측 + day-ahead 예측 오버레이 (15초 폴링 대상)."""
    rows = query(cfg.db_url, """
        SELECT ts, generation_kw, consumption_kw, battery_soc_pct,
               grid_import_kw, grid_export_kw
        FROM ng.measurements
        WHERE site_id=%s AND ts > now() - make_interval(hours => %s)
        ORDER BY ts""", (site_id, hours))

    fc: dict[str, dict] = {}
    if with_forecast:
        frows = query(cfg.db_url, """
            SELECT DISTINCT ON (target, ts) ts, target, value
            FROM ng.forecasts
            WHERE site_id=%s AND ts > now() - make_interval(hours => %s)
              AND ts < now() + interval '24 hours'
            ORDER BY target, ts, created_at DESC""", (site_id, hours))
        for r in frows:
            key = r["ts"].isoformat()
            fc.setdefault(key, {})[r["target"]] = float(r["value"])

    points = []
    for r in rows:
        key = r["ts"].isoformat()
        points.append({
            "ts": key,
            "generation_kw": float(r["generation_kw"]),
            "consumption_kw": float(r["consumption_kw"]),
            "battery_soc_pct": float(r["battery_soc_pct"]) if r["battery_soc_pct"] is not None else None,
            "grid_import_kw": float(r["grid_import_kw"]),
            "grid_export_kw": float(r["grid_export_kw"]),
            "forecast_generation_kw": fc.get(key, {}).get("generation_kw"),
            "forecast_consumption_kw": fc.get(key, {}).get("consumption_kw"),
        })
    return {"site_id": site_id, "hours": hours, "points": points}


@router.get("/events")
def events(site_id: int = 1, limit: int = Query(20, le=100)):
    return query(cfg.db_url, """
        SELECT id, ts, event_type, severity, title, detail, acknowledged
        FROM ng.events WHERE site_id=%s ORDER BY ts DESC LIMIT %s""", (site_id, limit))


# --------------------------------------------------------------------- EV --
# 전기차 충전기 상태. P1 단계에선 조회 시점에 상태를 전진시키는 내장 시뮬레이션으로
# 채우고(15초 스로틀), P5에서 OCPP/실계측 수집기가 같은 테이블을 갱신하도록 교체한다.

import random as _random
from datetime import datetime as _dt, timezone as _tz


def _refresh_ev(site_id: int) -> None:
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT * FROM ng.ev_chargers
                           WHERE site_id=%s FOR UPDATE""", (site_id,))
            chargers = cur.fetchall()
            now = _dt.now(_tz.utc)
            for c in chargers:
                age = (now - c["updated_at"]).total_seconds()
                if age < 15:
                    continue
                rng = _random.Random(f"{c['id']}-{now.strftime('%Y%m%d%H%M')}")
                status, power, session = c["status"], float(c["power_kw"]), float(c["session_kwh"])
                today_kwh, today_n = float(c["today_kwh"]), int(c["today_sessions"])
                started = c["session_started_at"]
                hour = now.astimezone().hour
                busy = 0.55 if 8 <= hour <= 21 else 0.15   # 주간 이용률

                if status == "idle":
                    if rng.random() < busy * 0.3:
                        status, power = "charging", float(c["max_kw"]) * rng.uniform(0.7, 1.0)
                        session, started, today_n = 0.0, now, today_n + 1
                elif status == "charging":
                    session += power * age / 3600
                    today_kwh += power * age / 3600
                    if session > rng.uniform(15, 55):
                        status, power = "finishing", float(c["max_kw"]) * 0.1
                    elif rng.random() < 0.01:
                        status, power = "fault", 0.0
                elif status == "finishing":
                    session += power * age / 3600
                    today_kwh += power * age / 3600
                    if rng.random() < 0.5:
                        status, power, started = "idle", 0.0, None
                elif status == "fault" and rng.random() < 0.3:
                    status, power, started = "idle", 0.0, None

                cur.execute(
                    """UPDATE ng.ev_chargers SET status=%s, power_kw=%s, session_kwh=%s,
                         session_started_at=%s, today_kwh=%s, today_sessions=%s, updated_at=%s
                       WHERE id=%s""",
                    (status, round(power, 2), round(session, 2), started,
                     round(today_kwh, 2), today_n, now, c["id"]))
    finally:
        conn.close()


@router.get("/ev")
def ev_chargers(site_id: int = 1):
    """충전기별 상태 + 합계. 15초 스로틀 내장 시뮬레이션(P5에서 실계측 대체)."""
    try:
        _refresh_ev(site_id)
    except Exception:  # noqa: BLE001 — 조회는 갱신 실패와 무관하게 계속
        pass
    rows = query(cfg.db_url, """
        SELECT id, name, connector, max_kw, status, power_kw, session_kwh,
               session_started_at, today_kwh, today_sessions, updated_at
        FROM ng.ev_chargers WHERE site_id=%s ORDER BY id""", (site_id,))
    total_power = sum(float(r["power_kw"]) for r in rows)
    return {
        "chargers": rows,
        "summary": {
            "total": len(rows),
            "charging": sum(1 for r in rows if r["status"] == "charging"),
            "fault": sum(1 for r in rows if r["status"] == "fault"),
            "total_power_kw": round(total_power, 2),
            "today_kwh": round(sum(float(r["today_kwh"]) for r in rows), 1),
            "today_sessions": sum(int(r["today_sessions"]) for r in rows),
        },
    }
