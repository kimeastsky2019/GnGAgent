from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import json
from app.models.schemas import SimRunRequest
from app.core.db import SessionLocal
from app.core.sim_engine import run_simulation, generate_synthetic_demand, generate_synthetic_pv

router = APIRouter()


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", status_code=202)
def run_sim(req: SimRunRequest, db: Session = Depends(get_db)):
    """
    시뮬레이션 실행 요청
    """
    try:
        # 시간 파싱
        period_start = datetime.fromisoformat(req.period_start.replace('Z', '+00:00'))
        period_end = datetime.fromisoformat(req.period_end.replace('Z', '+00:00'))
        
        # 사이트 존재 확인
        site_check = db.execute(
            text("SELECT id FROM ng.sites WHERE id = :site_id"),
            {"site_id": req.site_id}
        ).fetchone()
        
        if not site_check:
            raise HTTPException(status_code=404, detail=f"Site {req.site_id} not found")
        
        # 시뮬레이션 파라미터 준비
        sim_params = req.params.copy() if req.params else {}
        
        # 수요 프로필 생성 (합성 또는 DB에서 로드)
        if req.demand_profile_id:
            # TODO: DB에서 수요 프로필 로드
            demand_profile = generate_synthetic_demand(period_start, period_end, req.step_minutes, sim_params)
        else:
            demand_profile = generate_synthetic_demand(period_start, period_end, req.step_minutes, sim_params)
        
        # PV 프로필 생성
        pv_profile = generate_synthetic_pv(period_start, period_end, req.step_minutes, sim_params)
        
        # 시뮬레이션 실행
        result = run_simulation(
            period_start=period_start,
            period_end=period_end,
            step_minutes=req.step_minutes,
            demand_profile=demand_profile,
            pv_profile=pv_profile,
            params=sim_params
        )
        
        # 시뮬레이션 실행 기록 저장
        params_json = json.dumps({
            "strategy": req.strategy,
            "demand_profile_id": req.demand_profile_id,
            **sim_params
        })
        
        # sim_runs 테이블에 삽입
        insert_query = text("""
            INSERT INTO ng.sim_runs (site_id, period_start, period_end, step_minutes, status, params_json, created_by, version)
            VALUES (:site_id, :period_start, :period_end, :step_minutes, :status, :params_json::jsonb, :created_by, :version)
            RETURNING id
        """)
        
        result_db = db.execute(
            insert_query,
            {
                "site_id": req.site_id,
                "period_start": period_start,
                "period_end": period_end,
                "step_minutes": req.step_minutes,
                "status": "completed",
                "params_json": params_json,
                "created_by": "api",
                "version": "v1"
            }
        )
        sim_run_id = result_db.fetchone()[0]
        
        # 결과 저장
        kpi_json = json.dumps(result["kpi"])
        result_insert = text("""
            INSERT INTO ng.results (sim_run_id, kpi_json)
            VALUES (:sim_run_id, :kpi_json::jsonb)
            ON CONFLICT (sim_run_id) DO UPDATE SET kpi_json = :kpi_json::jsonb
        """)
        
        db.execute(
            result_insert,
            {
                "sim_run_id": sim_run_id,
                "kpi_json": kpi_json
            }
        )
        
        # TODO: 시계열 데이터 저장 (grid_exchange, supply_timeseries, battery_timeseries)
        # 현재는 KPI만 저장하고 시계열 데이터는 나중에 추가 가능
        
        db.commit()
        
        return {
            "sim_run_id": sim_run_id,
            "status": "completed",
            "message": "Simulation completed successfully"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/{run_id}/status")
def status(run_id: int, db: Session = Depends(get_db)):
    """
    시뮬레이션 실행 상태 조회
    """
    query = text("""
        SELECT id, site_id, status, created_at
        FROM ng.sim_runs
        WHERE id = :run_id
    """)
    
    result = db.execute(query, {"run_id": run_id}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Simulation run {run_id} not found")
    
    return {
        "sim_run_id": result[0],
        "site_id": result[1],
        "status": result[2],
        "created_at": result[3].isoformat() if result[3] else None
    }
