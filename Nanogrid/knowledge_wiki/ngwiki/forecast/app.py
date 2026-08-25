"""forecast-svc — 시계열 예측 HTTP 서비스 (기획서 §3-3).

엔드포인트:
  GET  /models                       사용 가능 모델 목록
  POST /run                          백테스트: 학습→예측→평가→실험이력 저장
  POST /select_best                  전 모델 백테스트 후 MAPE 순 랭킹
  POST /publish_dayahead             선택 모델로 내일 예측을 ng.forecasts 에 기록
  GET  /experiments                  실험 이력 (ng.forecast_experiments)

'MAPE ≤ 10%' 검증 실험을 반복 수행하는 실험실 — 결과가 곧 실증 증거.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ..config import load_config
from ..db import connect, query
from .models import MODEL_REGISTRY, SeriesPoint, metrics

cfg = load_config()
app = FastAPI(title="NanoGrid forecast-svc", version="0.1.0")

TARGETS = ("generation_kw", "consumption_kw", "temp_c")


class RunRequest(BaseModel):
    site_id: int = 1
    target: str = "consumption_kw"
    model: str = "seasonal_naive_24h"
    train_days: int = Field(14, ge=2, le=60)
    test_hours: int = Field(24, ge=1, le=168)
    step_min: int = 15
    save_experiment: bool = True


class SelectBestRequest(BaseModel):
    site_id: int = 1
    target: str = "consumption_kw"
    train_days: int = 14
    test_hours: int = 24


class PublishRequest(BaseModel):
    site_id: int = 1
    target: str = "consumption_kw"
    model: str = "seasonal_naive_24h"
    train_days: int = 14


def _load_series(site_id: int, target: str, start: datetime, end: datetime) -> list[SeriesPoint]:
    if target not in TARGETS:
        raise HTTPException(400, f"target 은 {TARGETS} 중 하나여야 합니다")
    rows = query(cfg.db_url, f"""
        SELECT ts, {target} AS v FROM ng.measurements
        WHERE site_id=%(sid)s AND ts >= %(s)s AND ts < %(e)s AND {target} IS NOT NULL
        ORDER BY ts
    """, {"sid": site_id, "s": start, "e": end})
    return [SeriesPoint(r["ts"], float(r["v"])) for r in rows]


def _backtest(req: RunRequest) -> dict:
    if req.model not in MODEL_REGISTRY:
        raise HTTPException(400, f"모델 없음: {req.model} — {list(MODEL_REGISTRY)}")
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    test_end = now
    test_start = test_end - timedelta(hours=req.test_hours)
    train_start = test_start - timedelta(days=req.train_days)

    train = _load_series(req.site_id, req.target, train_start, test_start)
    test = _load_series(req.site_id, req.target, test_start, test_end)
    if len(train) < 96 or len(test) < 4:
        raise HTTPException(422, f"데이터 부족 (train {len(train)} / test {len(test)}) — ingest 백필 확인")

    model = MODEL_REGISTRY[req.model](step_min=req.step_min)
    model.fit(train)
    pred = model.predict([p.ts for p in test])
    m = metrics([p.value for p in test], pred)

    return {
        "model": req.model, "target": req.target, "site_id": req.site_id,
        "train": {"start": train_start.isoformat(), "end": test_start.isoformat(), "n": len(train)},
        "test": {"start": test_start.isoformat(), "end": test_end.isoformat(), "n": len(test)},
        "metrics": m,
        "series": [
            {"ts": p.ts.isoformat(), "actual": p.value, "predicted": round(v, 3)}
            for p, v in zip(test, pred)
        ],
    }


def _save_experiment(result: dict, req: RunRequest) -> int:
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.forecast_experiments
                     (site_id, target, model, train_start, train_end, test_start, test_end,
                      horizon_min, metrics_json, params_json)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (req.site_id, req.target, req.model,
                 result["train"]["start"], result["train"]["end"],
                 result["test"]["start"], result["test"]["end"],
                 req.test_hours * 60, json.dumps(result["metrics"]),
                 json.dumps({"train_days": req.train_days, "step_min": req.step_min})))
            return cur.fetchone()["id"]
    finally:
        conn.close()


@app.get("/models")
def models():
    return [{"key": k, "label": v.label} for k, v in MODEL_REGISTRY.items()]


@app.post("/run")
def run(req: RunRequest):
    result = _backtest(req)
    if req.save_experiment:
        result["experiment_id"] = _save_experiment(result, req)
    return result


@app.post("/select_best")
def select_best(req: SelectBestRequest):
    ranked = []
    for key in MODEL_REGISTRY:
        r = RunRequest(site_id=req.site_id, target=req.target, model=key,
                       train_days=req.train_days, test_hours=req.test_hours)
        try:
            result = _backtest(r)
            result["experiment_id"] = _save_experiment(result, r)
            ranked.append({"model": key, "metrics": result["metrics"],
                           "experiment_id": result["experiment_id"]})
        except HTTPException:
            raise
    ranked.sort(key=lambda x: (x["metrics"]["mape_pct"] is None,
                               x["metrics"]["mape_pct"] or 0))
    return {"target": req.target, "ranking": ranked,
            "best": ranked[0]["model"] if ranked else None}


@app.post("/publish_dayahead")
def publish_dayahead(req: PublishRequest):
    """선택 모델로 내일 00:00~24:00 예측을 ng.forecasts 에 기록한다."""
    if req.model not in MODEL_REGISTRY:
        raise HTTPException(400, f"모델 없음: {req.model}")
    now = datetime.now(timezone.utc)
    train = _load_series(req.site_id, req.target,
                         now - timedelta(days=req.train_days), now)
    if len(train) < 96:
        raise HTTPException(422, "학습 데이터 부족")
    step = timedelta(minutes=15)
    start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    horizon = [start + i * step for i in range(96)]

    model = MODEL_REGISTRY[req.model](step_min=15)
    model.fit(train)
    values = model.predict(horizon)

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            for ts, v in zip(horizon, values):
                cur.execute(
                    """INSERT INTO ng.forecasts(site_id, ts, target, model, horizon_min, value)
                       VALUES (%s,%s,%s,%s,1440,%s)
                       ON CONFLICT (site_id, target, model, ts)
                       DO UPDATE SET value=EXCLUDED.value, created_at=now()""",
                    (req.site_id, ts, req.target, req.model, round(v, 3)))
    finally:
        conn.close()
    return {"published": len(horizon), "model": req.model, "target": req.target,
            "from": horizon[0].isoformat(), "to": horizon[-1].isoformat()}


@app.get("/experiments")
def experiments(site_id: int = 1, limit: int = 30):
    rows = query(cfg.db_url, """
        SELECT id, target, model, train_start, train_end, test_start, test_end,
               horizon_min, metrics_json, created_at
        FROM ng.forecast_experiments
        WHERE site_id=%s ORDER BY created_at DESC LIMIT %s""", (site_id, limit))
    return rows


@app.get("/")
def root():
    return {"ok": True, "service": "forecast-svc", "models": list(MODEL_REGISTRY)}
