"""
기본 사이트 생성 스크립트
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import SessionLocal
from sqlalchemy import text
import json

def create_default_site():
    """기본 사이트 생성"""
    db = SessionLocal()
    try:
        # 기존 사이트 확인
        check_query = text("SELECT id FROM ng.sites WHERE name = 'Default Site'")
        existing = db.execute(check_query).fetchone()
        
        if existing:
            print(f"Default site already exists with id: {existing[0]}")
            return existing[0]
        
        # 기본 사이트 생성
        insert_query = text("""
            INSERT INTO ng.sites (name, lat, lon, tz, meta)
            VALUES (:name, :lat, :lon, :tz, :meta::jsonb)
            RETURNING id
        """)
        
        result = db.execute(
            insert_query,
            {
                "name": "Default Site",
                "lat": 37.5665,  # 서울
                "lon": 126.9780,
                "tz": "Asia/Seoul",
                "meta": json.dumps({})
            }
        )
        site_id = result.fetchone()[0]
        db.commit()
        
        print(f"Default site created with id: {site_id}")
        return site_id
        
    except Exception as e:
        db.rollback()
        print(f"Error creating default site: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_default_site()

