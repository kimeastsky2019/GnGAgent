from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
from app.models.schemas import Site
from app.core.db import SessionLocal

router = APIRouter()


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", status_code=201)
def create_site(site: Site, db: Session = Depends(get_db)):
    """사이트 생성"""
    try:
        meta_json = json.dumps(site.meta) if site.meta else "{}"
        
        query = text("""
            INSERT INTO ng.sites (name, lat, lon, tz, grid_tariff_id, meta)
            VALUES (:name, :lat, :lon, :tz, :grid_tariff_id, :meta::jsonb)
            RETURNING id
        """)
        
        result = db.execute(
            query,
            {
                "name": site.name,
                "lat": site.lat,
                "lon": site.lon,
                "tz": site.tz,
                "grid_tariff_id": site.grid_tariff_id,
                "meta": meta_json
            }
        )
        site_id = result.fetchone()[0]
        db.commit()
        
        return {"id": site_id, **site.model_dump()}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create site: {str(e)}")


@router.get("")
def list_sites(db: Session = Depends(get_db)):
    """사이트 목록 조회"""
    try:
        query = text("""
            SELECT id, name, lat, lon, tz, grid_tariff_id, meta
            FROM ng.sites
            ORDER BY id
        """)
        
        results = db.execute(query).fetchall()
        
        items = []
        for row in results:
            meta = row[6] if row[6] else {}
            if isinstance(meta, str):
                meta = json.loads(meta)
            
            items.append({
                "id": row[0],
                "name": row[1],
                "lat": float(row[2]),
                "lon": float(row[3]),
                "tz": row[4],
                "grid_tariff_id": row[5],
                "meta": meta
            })
        
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list sites: {str(e)}")


@router.get("/{site_id}")
def get_site(site_id: int, db: Session = Depends(get_db)):
    """사이트 조회"""
    try:
        query = text("""
            SELECT id, name, lat, lon, tz, grid_tariff_id, meta
            FROM ng.sites
            WHERE id = :site_id
        """)
        
        result = db.execute(query, {"site_id": site_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Site {site_id} not found")
        
        meta = result[6] if result[6] else {}
        if isinstance(meta, str):
            meta = json.loads(meta)
        
        return {
            "id": result[0],
            "name": result[1],
            "lat": float(result[2]),
            "lon": float(result[3]),
            "tz": result[4],
            "grid_tariff_id": result[5],
            "meta": meta
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get site: {str(e)}")
