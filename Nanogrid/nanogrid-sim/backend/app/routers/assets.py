from fastapi import APIRouter
from typing import Literal, Optional, Any

router = APIRouter()

@router.post("", status_code=201)
def register_asset(payload: dict):
    # payload: {site_id, type, name, spec}
    return {"id": 1, **payload}
