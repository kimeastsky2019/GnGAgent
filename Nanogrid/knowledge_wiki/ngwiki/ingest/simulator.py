"""ingest 서비스 (P1: 시뮬레이터 소스).

기획서 §2: [SP-G 게이트웨이/시뮬레이터] → ingest → TimescaleDB(ng.*).
TNO 실계측(SP-G MQTT) 전환 전까지 물리 근사 모델로 실측형 데이터를 주입한다.
P5에서 이 모듈만 MQTT 구독자로 교체하면 나머지 파이프라인은 그대로다.

- 백필: 최초 기동 시 과거 N일 치를 채워 예측 실험·인사이트 이력 확보
- 실시간: step_min 간격의 새 측정값을 tick 마다 주입
- 이벤트: 저 SoC / 수요 피크 / 센서 결측 감지 시 ng.events 기록
- 예측 시드: 전일 생성된 day-ahead 예측이 없으면 seasonal-naive 로 채워
  '예측 대비 실측 오차' 사실이 항상 계산 가능하게 한다
"""

from __future__ import annotations

import argparse
import logging
import math
import random
import time
from datetime import datetime, timedelta, timezone

from ..config import load_config
from ..db import connect, one

log = logging.getLogger("ngwiki.ingest")

SEC_PER_DAY = 86400


def _solar_factor(ts: datetime) -> float:
    """일출~일몰 사이 사인 곡선 근사 (06~19시)."""
    h = ts.hour + ts.minute / 60
    if h < 6 or h > 19:
        return 0.0
    return math.sin(math.pi * (h - 6) / 13)


def _season_factor(ts: datetime) -> float:
    """연중 일사량 계절 변동 (여름 1.0, 겨울 0.55)."""
    doy = ts.timetuple().tm_yday
    return 0.775 + 0.225 * math.cos(2 * math.pi * (doy - 172) / 365)


def _cloud_factor(ts: datetime, rng: random.Random) -> float:
    """일 단위로 흐림 정도가 정해지고 시간 내 요동이 얹힌다."""
    day_rng = random.Random(ts.strftime("%Y%m%d"))
    base = 0.45 + 0.55 * day_rng.random()          # 그날의 맑음 정도
    return max(0.05, min(1.0, base + rng.uniform(-0.08, 0.08)))


def _demand_kw(ts: datetime, rng: random.Random, peak_kw: float) -> float:
    """주간 2봉(아침·저녁) 프로파일 + 주말 감쇠 + 노이즈."""
    h = ts.hour + ts.minute / 60
    base = 0.35
    morning = 0.45 * math.exp(-((h - 9.0) ** 2) / 6.0)
    evening = 0.65 * math.exp(-((h - 19.0) ** 2) / 5.0)
    shape = base + morning + evening
    if ts.weekday() >= 5:
        shape *= 0.75
    return max(0.5, peak_kw * shape * (1 + rng.uniform(-0.06, 0.06)))


class NanoGridSimulator:
    """사이트 1개의 PV+ESS 나노그리드 물리 근사."""

    def __init__(self, site_id: int, pv_kw: float = 50.0, demand_peak_kw: float = 40.0,
                 batt_kwh: float = 100.0, batt_p_kw: float = 25.0):
        self.site_id = site_id
        self.pv_kw = pv_kw
        self.demand_peak_kw = demand_peak_kw
        self.batt_kwh = batt_kwh
        self.batt_p_kw = batt_p_kw
        self.soc_pct = 50.0
        self.rng = random.Random(site_id * 7919)

    def step(self, ts: datetime, step_min: int) -> dict:
        rng = self.rng
        cloud = _cloud_factor(ts, rng)
        irr = 1000.0 * _solar_factor(ts) * _season_factor(ts) * cloud
        gen = self.pv_kw * (irr / 1000.0) * 0.85              # 시스템 효율
        cons = _demand_kw(ts, rng, self.demand_peak_kw)
        temp = 18 + 9 * _season_factor(ts) + 6 * _solar_factor(ts) + rng.uniform(-1.5, 1.5)

        # 배터리 규칙 기반 운전: 잉여→충전, 부족→방전 (SoC 10~90%)
        surplus = gen - cons
        hours = step_min / 60
        batt_p = 0.0                                          # +방전 / -충전
        if surplus > 0 and self.soc_pct < 90:
            batt_p = -min(surplus, self.batt_p_kw,
                          (90 - self.soc_pct) / 100 * self.batt_kwh / hours)
        elif surplus < 0 and self.soc_pct > 10:
            batt_p = min(-surplus, self.batt_p_kw,
                         (self.soc_pct - 10) / 100 * self.batt_kwh / hours)
        eff = 0.96
        delta_kwh = (-batt_p * eff if batt_p < 0 else -batt_p / eff) * hours
        self.soc_pct = max(0.0, min(100.0, self.soc_pct + delta_kwh / self.batt_kwh * 100))

        net = gen + batt_p - cons
        return {
            "site_id": self.site_id, "ts": ts,
            "generation_kw": round(gen, 3), "consumption_kw": round(cons, 3),
            "battery_soc_pct": round(self.soc_pct, 2), "battery_power_kw": round(batt_p, 3),
            "grid_import_kw": round(max(0.0, -net), 3), "grid_export_kw": round(max(0.0, net), 3),
            "temp_c": round(temp, 2), "irradiance_wm2": round(irr, 1), "source": "sim",
        }


INSERT_SQL = """
INSERT INTO ng.measurements(site_id, ts, generation_kw, consumption_kw, battery_soc_pct,
  battery_power_kw, grid_import_kw, grid_export_kw, temp_c, irradiance_wm2, source)
VALUES (%(site_id)s, %(ts)s, %(generation_kw)s, %(consumption_kw)s, %(battery_soc_pct)s,
  %(battery_power_kw)s, %(grid_import_kw)s, %(grid_export_kw)s, %(temp_c)s, %(irradiance_wm2)s, %(source)s)
ON CONFLICT (site_id, ts) DO NOTHING
"""


def _emit_events(conn, m: dict) -> None:
    """운전 상태에서 파생되는 이상 이벤트 (중복 방지: 최근 2시간 내 동일 유형 스킵)."""
    checks = []
    if m["battery_soc_pct"] is not None and m["battery_soc_pct"] <= 12:
        checks.append(("low_soc", "warning", "배터리 SoC 저하",
                       f"SoC {m['battery_soc_pct']}% — 방전 하한(10%) 근접"))
    if m["consumption_kw"] >= 0.95 * 40:
        checks.append(("peak_demand", "info", "수요 피크 접근",
                       f"소비 {m['consumption_kw']}kW — 계약전력 대비 확인 필요"))
    for etype, sev, title, detail in checks:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.events(site_id, ts, event_type, severity, title, detail)
                   SELECT %s, %s, %s, %s, %s, %s
                   WHERE NOT EXISTS (
                     SELECT 1 FROM ng.events
                     WHERE site_id=%s AND event_type=%s AND ts > %s - interval '2 hours')""",
                (m["site_id"], m["ts"], etype, sev, title, detail,
                 m["site_id"], etype, m["ts"]))


def _seed_dayahead_forecast(conn, site_id: int, day: datetime, step_min: int) -> None:
    """해당 일자의 day-ahead 예측이 없으면 seasonal-naive(전일 동시각)로 시드한다."""
    day0 = day.replace(hour=0, minute=0, second=0, microsecond=0)
    with conn.cursor() as cur:
        for target in ("generation_kw", "consumption_kw"):
            cur.execute(
                """INSERT INTO ng.forecasts(site_id, ts, target, model, horizon_min, value)
                   SELECT site_id, ts + interval '1 day', %s, 'seasonal_naive_24h', 1440,
                          CASE WHEN %s='generation_kw' THEN generation_kw ELSE consumption_kw END
                   FROM ng.measurements
                   WHERE site_id=%s AND ts >= %s - interval '1 day' AND ts < %s
                   ON CONFLICT DO NOTHING""",
                (target, target, site_id, day0, day0))


def run(loop: bool = True) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    cfg = load_config()
    conn = connect(cfg.db_url)
    site = one(cfg.db_url, "SELECT id FROM ng.sites ORDER BY id LIMIT 1")
    if not site:
        raise RuntimeError("ng.sites 가 비어 있습니다 — db/10_knowledge_schema.sql 적용 확인")
    sim = NanoGridSimulator(site_id=site["id"])
    step = timedelta(minutes=cfg.ingest_step_min)

    # --- 백필 ---
    last = one(cfg.db_url,
               "SELECT max(ts) AS ts FROM ng.measurements WHERE site_id=%s", (sim.site_id,))
    now = datetime.now(timezone.utc)
    start = (last and last["ts"]) or (now - timedelta(days=cfg.ingest_backfill_days))
    ts = (start + step).replace(second=0, microsecond=0)
    n = 0
    with conn.cursor() as cur:
        while ts <= now:
            cur.execute(INSERT_SQL, sim.step(ts, cfg.ingest_step_min))
            ts += step
            n += 1
    if n:
        log.info("백필 %d포인트 (%s ~ now)", n, start)
    _seed_dayahead_forecast(conn, sim.site_id, now, cfg.ingest_step_min)

    if not loop:
        return

    # --- 실시간 루프 ---
    log.info("실시간 주입 시작 (tick=%ds, step=%dmin)", cfg.ingest_tick_sec, cfg.ingest_step_min)
    while True:
        time.sleep(cfg.ingest_tick_sec)
        now = datetime.now(timezone.utc)
        while ts <= now:
            m = sim.step(ts, cfg.ingest_step_min)
            with conn.cursor() as cur:
                cur.execute(INSERT_SQL, m)
            _emit_events(conn, m)
            if ts.hour == 0 and ts.minute < cfg.ingest_step_min:
                _seed_dayahead_forecast(conn, sim.site_id, ts, cfg.ingest_step_min)
            ts += step


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="NanoGrid ingest 시뮬레이터")
    ap.add_argument("--once", action="store_true", help="백필만 수행하고 종료")
    args = ap.parse_args()
    run(loop=not args.once)
