from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import sites, assets, sim_runs, timeseries, results

app = FastAPI(
    title="NanoGrid Match Simulation API",
    version="0.1.0",
    description="""
    NanoGrid 수요-공급 매칭 시뮬레이션 API
    
    ## 주요 기능
    
    * **사이트 관리**: 시뮬레이션 대상 사이트 생성 및 조회
    * **시뮬레이션 실행**: 수요-공급 매칭 시뮬레이션 실행
    * **결과 조회**: 시뮬레이션 결과 및 KPI 조회
    * **시계열 데이터**: 시뮬레이션 시계열 데이터 조회
    
    ## API 문서
    
    * Swagger UI: `/docs`
    * ReDoc: `/redoc`
    * OpenAPI JSON: `/openapi.json`
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS 설정 - 프론트엔드와의 통합을 위해 필요
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite 개발 서버
        "http://localhost:3000",  # 대체 개발 서버
        "http://localhost:8080",  # 프론트엔드 프로덕션
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router, prefix="/sites", tags=["sites"])
app.include_router(assets.router, prefix="/assets", tags=["assets"])
app.include_router(sim_runs.router, prefix="/sim-runs", tags=["sim-runs"])
app.include_router(timeseries.router, prefix="/timeseries", tags=["timeseries"])
app.include_router(results.router, prefix="/results", tags=["results"])

@app.get("/")
def root():
    return {"ok": True, "service": "nanogrid-sim-api"}
