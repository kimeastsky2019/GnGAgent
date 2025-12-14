from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
from app.core.db import SessionLocal

router = APIRouter()


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{run_id}")
def get_results(run_id: int, db: Session = Depends(get_db)):
    """
    시뮬레이션 결과 조회
    """
    query = text("""
        SELECT r.sim_run_id, r.kpi_json, r.created_at, sr.status
        FROM ng.results r
        JOIN ng.sim_runs sr ON r.sim_run_id = sr.id
        WHERE r.sim_run_id = :run_id
    """)
    
    result = db.execute(query, {"run_id": run_id}).fetchone()
    
    if not result:
        # 시뮬레이션 실행이 존재하는지 확인
        sim_check = db.execute(
            text("SELECT id, status FROM ng.sim_runs WHERE id = :run_id"),
            {"run_id": run_id}
        ).fetchone()
        
        if not sim_check:
            raise HTTPException(status_code=404, detail=f"Simulation run {run_id} not found")
        
        if sim_check[1] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Simulation run {run_id} is not completed yet. Status: {sim_check[1]}"
            )
        
        raise HTTPException(status_code=404, detail=f"Results for simulation run {run_id} not found")
    
    # JSON 파싱
    kpi_json = result[1]
    if isinstance(kpi_json, str):
        kpi = json.loads(kpi_json)
    else:
        kpi = kpi_json
    
    return {
        "sim_run_id": result[0],
        "kpi": kpi,
        "created_at": result[2].isoformat() if result[2] else None,
        "status": result[3]
    }
