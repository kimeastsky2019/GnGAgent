"""insight-worker — 주기 실행 진입점 (기획서 §2의 insight-worker 컨테이너).

동작:
- daily  : 어제(및 --backfill N 이면 과거 N일)의 일간 브리프 생성
- weekly : 일요일 기준 직전 7일 주간 리포트 생성
- events : warning/critical 이벤트별 이상 이벤트 노트 생성
- --loop : 위 3가지를 loop_interval_sec 마다 반복 확인 (사실 해시가 같으면 스킵 → 비용 예측 가능)

사용:
  python -m ngwiki.insight.worker daily --backfill 7
  python -m ngwiki.insight.worker all --loop
"""

from __future__ import annotations

import argparse
import logging
import time
from datetime import date, timedelta

from ..config import load_config
from ..db import query
from . import collector
from .generator import generate_doc

log = logging.getLogger("ngwiki.worker")


def _sites(cfg) -> list[int]:
    return [r["id"] for r in query(cfg.db_url, "SELECT id FROM ng.sites ORDER BY id")]


def run_daily(cfg, backfill_days: int = 1, force: bool = False) -> None:
    for site_id in _sites(cfg):
        for i in range(1, backfill_days + 1):
            day = date.today() - timedelta(days=i)
            facts = collector.collect_daily_facts(cfg.db_url, site_id, day)
            if not facts:
                continue
            generate_doc(cfg, f"daily/{day.isoformat()}", facts,
                         day, day + timedelta(days=1), force=force)


def run_weekly(cfg, force: bool = False) -> None:
    # 최근 완결 주(일요일 종료) 기준
    today = date.today()
    week_end = today - timedelta(days=today.weekday() + 1)  # 지난 일요일
    for site_id in _sites(cfg):
        facts = collector.collect_weekly_facts(cfg.db_url, site_id, week_end)
        if not facts:
            continue
        generate_doc(cfg, f"weekly/{facts['week']}", facts,
                     week_end - timedelta(days=6), week_end + timedelta(days=1), force=force)


def run_events(cfg, force: bool = False) -> None:
    rows = query(cfg.db_url, """
        SELECT e.id FROM ng.events e
        WHERE e.severity IN ('warning','critical')
          AND e.ts > now() - interval '7 days'
          AND NOT EXISTS (SELECT 1 FROM ng.insight_docs d WHERE d.doc_id = 'event/' || e.id)
        ORDER BY e.ts DESC LIMIT 20""")
    for r in rows:
        facts = collector.collect_event_facts(cfg.db_url, r["id"])
        if not facts:
            continue
        ev_ts = facts["event"]["ts"]
        generate_doc(cfg, f"event/{r['id']}", facts, ev_ts, ev_ts, force=force)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    ap = argparse.ArgumentParser(description="NanoGrid 인사이트 워커")
    ap.add_argument("task", choices=["daily", "weekly", "events", "all"], default="all", nargs="?")
    ap.add_argument("--backfill", type=int, default=1, help="daily 백필 일수")
    ap.add_argument("--force", action="store_true", help="facts 해시가 같아도 재생성")
    ap.add_argument("--loop", action="store_true", help="주기 실행 (loop_interval_sec)")
    args = ap.parse_args()
    cfg = load_config()

    def once() -> None:
        if args.task in ("daily", "all"):
            run_daily(cfg, backfill_days=args.backfill, force=args.force)
        if args.task in ("weekly", "all"):
            run_weekly(cfg, force=args.force)
        if args.task in ("events", "all"):
            run_events(cfg, force=args.force)

    once()
    while args.loop:
        time.sleep(cfg.loop_interval_sec)
        try:
            once()
        except Exception:  # noqa: BLE001 — 루프는 죽지 않는다
            log.exception("인사이트 생성 실패, 다음 주기에 재시도")


if __name__ == "__main__":
    main()
