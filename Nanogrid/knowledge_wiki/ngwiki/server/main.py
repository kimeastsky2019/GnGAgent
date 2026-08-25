"""wiki-server — 통합 포털 API (기획서 §2).

프론트엔드(llmwiki 웹 또는 nanogrid_AI_management_system 대시보드)는 이 서버 하나만 본다.
- /api/ng/monitor* : TimescaleDB 실측·예측 조회 (모니터링 메뉴)
- /api/ng/forecast/* : forecast-svc 프록시 (예측 메뉴 — CORS·인증 일원화)
- /api/ng/wiki/*   : 인사이트 위키 트리/문서/검색

llmwiki 본체에 이식할 때는 이 라우터들을 server/app.py 에 include 하면 된다.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import load_config
from .routers import admin, forecast, gov, monitor, wiki

cfg = load_config()

app = FastAPI(
    title=f"{cfg.project_name} — Portal API",
    version="0.1.0",
    description="나노그리드 지식 데이터베이스 + AI 인사이트 위키 포털 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 데모 단계 — 운영 전환 시 도메인 지정
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(monitor.router, prefix="/api/ng", tags=["monitor"])
app.include_router(forecast.router, prefix="/api/ng/forecast", tags=["forecast"])
app.include_router(wiki.router, prefix="/api/ng/wiki", tags=["wiki"])
app.include_router(admin.router, prefix="/api/ng/admin", tags=["admin"])
app.include_router(gov.router, prefix="/api/ng/gov", tags=["ai-gov"])


@app.get("/")
def root():
    return {"ok": True, "service": "ng-knowledge-wiki", "portal": cfg.project_name}


@app.get("/api/ng/meta")
def meta():
    from ..db import one

    counts = one(cfg.db_url, """
        SELECT (SELECT count(*) FROM ng.measurements)          AS measurements,
               (SELECT count(*) FROM ng.forecasts)             AS forecasts,
               (SELECT count(*) FROM ng.events)                AS events,
               (SELECT count(*) FROM ng.insight_docs)          AS insight_docs,
               (SELECT count(*) FROM ng.forecast_experiments)  AS experiments
    """)
    return {"project": cfg.project_name, "llm_provider": cfg.llm_provider, "counts": counts}
