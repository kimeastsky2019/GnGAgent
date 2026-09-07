"""Wiki 관리자 + 지식 데이터베이스 구축 현황.

- GET  /pipeline           지식DB 구축 현황: 계층별 카운트·최신 수집·문서화·품질
- GET  /status             관리자 화면: LLM 공급자, 최근 발행 문서, 실행 중 작업
- POST /regenerate         인사이트 재생성 (daily/weekly/events/all, force) — 백그라운드
- POST /publish_forecast   최적 모델로 day-ahead 예측 발행 (forecast-svc 경유)
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...config import load_config
from ...db import one, query

cfg = load_config()
router = APIRouter()

_job_lock = threading.Lock()
_job_state: dict = {"running": False, "task": None, "started_at": None, "finished_at": None,
                    "result": None, "error": None}


class RegenerateRequest(BaseModel):
    task: str = Field("all", pattern="^(daily|weekly|events|all)$")
    backfill_days: int = Field(3, ge=1, le=30)
    force: bool = False


class PublishRequest(BaseModel):
    target: str = "consumption_kw"
    model: str | None = None   # None 이면 최근 실험에서 MAPE 최소 모델


@router.get("/pipeline")
def pipeline():
    """지식 데이터베이스 구축 현황 — 수집→예측→문서화 각 계층의 상태."""
    counts = one(cfg.db_url, """
        SELECT (SELECT count(*) FROM ng.measurements)         AS measurements,
               (SELECT count(*) FROM ng.forecasts)            AS forecasts,
               (SELECT count(*) FROM ng.events)               AS events,
               (SELECT count(*) FROM ng.insight_docs)         AS insight_docs,
               (SELECT count(*) FROM ng.forecast_experiments) AS experiments,
               (SELECT count(*) FROM ng.ev_chargers)          AS ev_chargers,
               (SELECT count(*) FROM ng.gov_documents)        AS gov_documents,
               (SELECT count(*) FROM ng.gov_checklist)        AS gov_items
    """)
    latest = one(cfg.db_url, """
        SELECT (SELECT max(ts) FROM ng.measurements)          AS last_measurement,
               (SELECT max(created_at) FROM ng.forecasts)     AS last_forecast,
               (SELECT max(updated_at) FROM ng.insight_docs)  AS last_doc,
               (SELECT max(created_at) FROM ng.forecast_experiments) AS last_experiment
    """)
    quality = one(cfg.db_url, """
        SELECT count(*) AS n_24h,
               round(avg(generation_kw)::numeric, 2)  AS avg_gen_kw,
               round(avg(consumption_kw)::numeric, 2) AS avg_cons_kw
        FROM ng.measurements WHERE ts > now() - interval '24 hours'
    """)
    expected_24h = 96  # 15분 해상도
    n24 = int(quality["n_24h"] or 0)
    docs_by_type = query(cfg.db_url, """
        SELECT doc_type, count(*) AS n, max(period_start) AS latest
        FROM ng.insight_docs GROUP BY doc_type ORDER BY doc_type""")
    return {
        "counts": counts,
        "latest": latest,
        "quality_24h": {
            "points": n24, "expected": expected_24h,
            "missing_pct": round(max(0, expected_24h - n24) / expected_24h * 100, 1),
            "avg_gen_kw": quality["avg_gen_kw"], "avg_cons_kw": quality["avg_cons_kw"],
        },
        "docs_by_type": docs_by_type,
        "principle": "사실은 SQL이, 서술은 LLM이 — facts_json 원본이 모든 문서에 보존됩니다",
    }


@router.get("/status")
def status(lang: str = "ko"):
    title_col = "COALESCE(title_en, title) AS title" if lang == "en" else "title"
    recent = query(cfg.db_url, f"""
        SELECT doc_id, doc_type, {title_col}, llm_provider, llm_model, updated_at
        FROM ng.insight_docs ORDER BY updated_at DESC LIMIT 10""")
    return {
        "llm_provider": cfg.llm_provider,
        "llm_options": {k: v for k, v in cfg.llm_options.items() if "key" not in k.lower()},
        "job": dict(_job_state),
        "recent_docs": recent,
    }


def _run_regenerate(req: RegenerateRequest) -> None:
    from ...insight.worker import run_daily, run_events, run_weekly

    try:
        if req.task in ("daily", "all"):
            run_daily(cfg, backfill_days=req.backfill_days, force=req.force)
        if req.task in ("weekly", "all"):
            run_weekly(cfg, force=req.force)
        if req.task in ("events", "all"):
            run_events(cfg, force=req.force)
        _job_state.update(result="완료", error=None)
    except Exception as e:  # noqa: BLE001
        _job_state.update(result=None, error=str(e))
    finally:
        _job_state.update(running=False,
                          finished_at=datetime.now(timezone.utc).isoformat())


@router.post("/regenerate")
def regenerate(req: RegenerateRequest):
    with _job_lock:
        if _job_state["running"]:
            raise HTTPException(409, "이미 재생성 작업이 실행 중입니다")
        _job_state.update(running=True, task=req.task,
                          started_at=datetime.now(timezone.utc).isoformat(),
                          finished_at=None, result=None, error=None)
    threading.Thread(target=_run_regenerate, args=(req,), daemon=True).start()
    return {"started": True, "task": req.task, "force": req.force}


# ------------------------------------------------------------ 승인 게이트 --
# 기획안 v0.2 §4: 에이전트 산출물의 승인/반려. 결정 이력이 곧 감사 로그다.

class DecisionRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    note: str = Field("", max_length=1000)
    decided_by: str = "operator"


@router.get("/approvals")
def approvals(status: str = "pending", limit: int = 30):
    rows = query(cfg.db_url, """
        SELECT id, item_type, ref_id, title, summary, level, status,
               decided_by, decided_at, note, created_at
        FROM ng.approval_queue
        WHERE status = %s ORDER BY created_at DESC LIMIT %s""", (status, limit))
    counts = one(cfg.db_url, """
        SELECT count(*) FILTER (WHERE status='pending')  AS pending,
               count(*) FILTER (WHERE status='approved') AS approved,
               count(*) FILTER (WHERE status='rejected') AS rejected
        FROM ng.approval_queue""")
    return {"counts": counts, "items": rows}


@router.post("/approvals/{item_id}/decide")
def decide(item_id: int, req: DecisionRequest):
    from ...db import connect as _connect

    conn = _connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE ng.approval_queue
                   SET status=%s, decided_by=%s, decided_at=now(), note=%s
                   WHERE id=%s AND status='pending'
                   RETURNING item_type, ref_id""",
                (req.status, req.decided_by, req.note, item_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "대기 중인 항목이 아닙니다")
            # 연동 상태 반영 — 큐 결정이 원본 객체의 상태를 함께 바꾼다
            if row["item_type"] == "forecast_model_change" and req.status == "approved":
                # L2 파이프라인 (1차년도 파일럿): 승인 즉시 새 모델로 day-ahead 발행
                target, model = row["ref_id"].split(":", 1)
                try:
                    with httpx.Client(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
                        client.post(f"{cfg.forecast_svc_url.rstrip('/')}/publish_dayahead",
                                    json={"target": target, "model": model})
                except httpx.HTTPError:
                    pass  # 발행 실패해도 결정 기록은 유지 — 다음 제안 주기에 재시도
            if row["item_type"] == "training_pair":
                cur.execute(
                    """UPDATE ng.training_pairs
                       SET human_approval=%s, approved_by=%s, approved_at=now()
                       WHERE id=%s""",
                    (req.status, req.decided_by, int(row["ref_id"])))
            elif row["item_type"] == "golden_question":
                cur.execute(
                    "UPDATE ng.golden_questions SET status=%s WHERE id=%s",
                    ("approved" if req.status == "approved" else "retired",
                     int(row["ref_id"])))
    finally:
        conn.close()
    return {"id": item_id, "status": req.status}


# -------------------------------------------------------- 자동화율 계기판 --
# 1차년도 A트랙: "AI 직원" 체제의 증거 — 최근 7일 자동 수행 vs 인간 개입.

@router.get("/automation")
def automation(days: int = 7):
    auto = one(cfg.db_url, """
        SELECT
          (SELECT count(*) FROM ng.insight_docs WHERE updated_at > now() - make_interval(days => %(d)s)) AS insight_docs,
          (SELECT count(DISTINCT (target, model, date_trunc('day', created_at)))
             FROM ng.forecasts WHERE created_at > now() - make_interval(days => %(d)s)) AS forecast_publishes,
          (SELECT count(*) FROM ng.training_pairs WHERE created_at > now() - make_interval(days => %(d)s)) AS training_pairs,
          (SELECT count(*) FROM ng.ces_runs WHERE created_at > now() - make_interval(days => %(d)s)) AS ces_runs,
          (SELECT count(*) FROM ng.events WHERE ts > now() - make_interval(days => %(d)s)) AS events_detected
    """, {"d": days})
    human = one(cfg.db_url, """
        SELECT
          (SELECT count(*) FROM ng.approval_queue
             WHERE decided_at > now() - make_interval(days => %(d)s)) AS approvals_decided,
          (SELECT count(*) FROM ng.training_pairs
             WHERE approved_at > now() - make_interval(days => %(d)s)) AS pairs_reviewed
    """, {"d": days})
    auto_total = sum(int(v or 0) for v in auto.values())
    human_total = sum(int(v or 0) for v in human.values())
    rate = round(auto_total / (auto_total + human_total) * 100, 1) \
        if (auto_total + human_total) else None
    return {
        "days": days,
        "auto": auto, "auto_total": auto_total,
        "human": human, "human_total": human_total,
        "automation_rate_pct": rate,
        "note": "계측 v0 — 자동 수행 건수 / (자동 + 인간 개입). 1차년도 목표 55%",
    }


# ------------------------------------------- L2 파일럿: 예측 모델 교체 제안 --
# 에이전트가 전 모델 백테스트로 최적 모델을 찾고, 현재 발행 모델과 다르면
# L2 승인 항목을 만든다. 사람이 승인하면 decide() 가 새 모델로 발행한다.

class ProposeModelRequest(BaseModel):
    target: str = "consumption_kw"
    site_id: int = 1


@router.post("/automation/propose_model")
def propose_model(req: ProposeModelRequest):
    try:
        with httpx.Client(timeout=httpx.Timeout(300.0, connect=5.0)) as client:
            resp = client.post(f"{cfg.forecast_svc_url.rstrip('/')}/select_best",
                               json={"site_id": req.site_id, "target": req.target,
                                     "train_days": 14, "test_hours": 24})
    except httpx.HTTPError as e:
        raise HTTPException(502, f"forecast-svc 연결 실패: {e}") from e
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, resp.text)
    ranking = resp.json().get("ranking", [])
    if not ranking:
        raise HTTPException(422, "백테스트 결과 없음")
    best = ranking[0]

    current = one(cfg.db_url, """
        SELECT model FROM ng.forecasts
        WHERE site_id=%s AND target=%s ORDER BY created_at DESC LIMIT 1""",
        (req.site_id, req.target))
    current_model = current["model"] if current else None
    if current_model == best["model"]:
        return {"proposed": False, "reason": "현재 발행 모델이 이미 최적",
                "model": current_model, "mape": best["metrics"].get("mape_pct")}

    ref_id = f"{req.target}:{best['model']}"
    dup = one(cfg.db_url, """
        SELECT id FROM ng.approval_queue
        WHERE item_type='forecast_model_change' AND ref_id=%s AND status='pending'""",
        (ref_id,))
    if dup:
        return {"proposed": False, "reason": "동일 제안이 이미 승인 대기 중",
                "queue_id": dup["id"]}

    cur_mape = next((r["metrics"].get("mape_pct") for r in ranking
                     if r["model"] == current_model), None)
    from ...db import connect as _connect

    conn = _connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.approval_queue(item_type, ref_id, title, summary, level)
                   VALUES ('forecast_model_change', %s, %s, %s, 'L2') RETURNING id""",
                (ref_id,
                 f"예측 모델 교체 제안: {req.target} → {best['model']}",
                 f"현재 {current_model or '없음'} (MAPE {cur_mape}%) → 제안 {best['model']} "
                 f"(MAPE {best['metrics'].get('mape_pct')}%) · 14일 학습/24h 백테스트"))
            qid = cur.fetchone()["id"]
    finally:
        conn.close()
    return {"proposed": True, "queue_id": qid, "from": current_model,
            "to": best["model"], "mape": best["metrics"].get("mape_pct"),
            "note": "L2 — 인간 승인 시 새 모델로 day-ahead 발행"}


# ------------------------------------------------------------- 기기 관리 --
# 에너지 공급(supply)/수요(demand)/저장(storage) 기기 등록·삭제·토글.

class DeviceRequest(BaseModel):
    site_id: int = 1
    side: str = Field(..., pattern="^(supply|demand|storage)$")
    device_type: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    capacity_kw: float = Field(0, ge=0)
    api_id: int | None = None


@router.get("/devices")
def devices(site_id: int = 1):
    rows = query(cfg.db_url, """
        SELECT d.id, d.side, d.device_type, d.name, d.capacity_kw, d.enabled,
               d.api_id, a.name AS api_name, d.created_at
        FROM ng.devices d
        LEFT JOIN ng.api_registrations a ON a.id = d.api_id
        WHERE d.site_id=%s ORDER BY d.side, d.id""", (site_id,))
    groups: dict[str, list] = {"supply": [], "storage": [], "demand": []}
    for r in rows:
        groups.setdefault(r["side"], []).append(r)
    return {
        "groups": [{"side": s, "devices": ds} for s, ds in groups.items()],
        "totals": {
            s: round(sum(float(d["capacity_kw"]) for d in ds if d["enabled"]), 1)
            for s, ds in groups.items()
        },
    }


@router.post("/devices")
def add_device(req: DeviceRequest):
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.devices(site_id, side, device_type, name, capacity_kw, api_id)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
                (req.site_id, req.side, req.device_type, req.name, req.capacity_kw, req.api_id))
            return {"id": cur.fetchone()["id"]}
    finally:
        conn.close()


@router.post("/devices/{device_id}/toggle")
def toggle_device(device_id: int):
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE ng.devices SET enabled = NOT enabled WHERE id=%s RETURNING enabled",
                (device_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(404, "기기 없음")
            return {"id": device_id, "enabled": row["enabled"]}
    finally:
        conn.close()


@router.delete("/devices/{device_id}")
def delete_device(device_id: int):
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM ng.devices WHERE id=%s RETURNING id", (device_id,))
            if not cur.fetchone():
                raise HTTPException(404, "기기 없음")
    finally:
        conn.close()
    return {"deleted": device_id}


# --------------------------------------------------------------- API 등록 --
# 기기/기상/시장 데이터 소스 API 연결점. api_key 는 목록에서 마스킹된다.

class ApiRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    kind: str = Field("device", pattern="^(device|weather|market|other)$")
    base_url: str = Field(..., min_length=4, max_length=500)
    auth_type: str = Field("none", pattern="^(none|api_key|bearer)$")
    api_key: str = Field("", max_length=500)


def _mask(key: str) -> str:
    if not key:
        return ""
    return key[:4] + "…" if len(key) > 4 else "…"


@router.get("/apis")
def apis():
    rows = query(cfg.db_url, """
        SELECT id, name, kind, base_url, auth_type, api_key, enabled,
               last_check, last_status, created_at
        FROM ng.api_registrations ORDER BY id""")
    for r in rows:
        r["api_key"] = _mask(r["api_key"])
    return rows


@router.post("/apis")
def add_api(req: ApiRequest):
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.api_registrations(name, kind, base_url, auth_type, api_key)
                   VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                (req.name, req.kind, req.base_url, req.auth_type, req.api_key))
            return {"id": cur.fetchone()["id"]}
    finally:
        conn.close()


@router.post("/apis/{api_id}/test")
def test_api(api_id: int):
    """등록된 base_url 에 GET 을 보내 연결 상태를 기록한다."""
    row = one(cfg.db_url, "SELECT * FROM ng.api_registrations WHERE id=%s", (api_id,))
    if not row:
        raise HTTPException(404, "API 없음")
    headers = {}
    if row["auth_type"] == "api_key" and row["api_key"]:
        headers["X-API-Key"] = row["api_key"]
    elif row["auth_type"] == "bearer" and row["api_key"]:
        headers["Authorization"] = f"Bearer {row['api_key']}"
    try:
        with httpx.Client(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
            resp = client.get(row["base_url"], headers=headers)
        status = f"HTTP {resp.status_code}"
        ok = resp.status_code < 400
    except httpx.HTTPError as e:
        status, ok = f"연결 실패: {type(e).__name__}", False

    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE ng.api_registrations SET last_check=now(), last_status=%s WHERE id=%s",
                (status, api_id))
    finally:
        conn.close()
    return {"id": api_id, "ok": ok, "status": status}


@router.delete("/apis/{api_id}")
def delete_api(api_id: int):
    from ...db import connect

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE ng.devices SET api_id=NULL WHERE api_id=%s", (api_id,))
            cur.execute("DELETE FROM ng.api_registrations WHERE id=%s RETURNING id", (api_id,))
            if not cur.fetchone():
                raise HTTPException(404, "API 없음")
    finally:
        conn.close()
    return {"deleted": api_id}


@router.post("/publish_forecast")
def publish_forecast(req: PublishRequest):
    model = req.model
    if not model:
        best = one(cfg.db_url, """
            SELECT model FROM ng.forecast_experiments
            WHERE target=%s AND (metrics_json->>'mape_pct') IS NOT NULL
            ORDER BY (metrics_json->>'mape_pct')::numeric ASC, created_at DESC LIMIT 1""",
            (req.target,))
        if not best:
            raise HTTPException(422, "실험 이력이 없습니다 — 예측 랩에서 먼저 실험을 실행하세요")
        model = best["model"]
    try:
        with httpx.Client(timeout=httpx.Timeout(120.0, connect=5.0)) as client:
            resp = client.post(f"{cfg.forecast_svc_url.rstrip('/')}/publish_dayahead",
                               json={"target": req.target, "model": model})
    except httpx.HTTPError as e:
        raise HTTPException(502, f"forecast-svc 연결 실패: {e}") from e
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()
