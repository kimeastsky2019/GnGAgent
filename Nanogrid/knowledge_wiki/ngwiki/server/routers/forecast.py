"""forecast-svc 프록시 (기획서 §3-3) — 프론트는 포털 API 하나만 본다."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Request

from ...config import load_config

cfg = load_config()
router = APIRouter()

TIMEOUT = httpx.Timeout(120.0, connect=5.0)  # 모델 학습이 섞이므로 넉넉히


async def _forward(method: str, path: str, request: Request) -> dict | list:
    url = f"{cfg.forecast_svc_url.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            if method == "GET":
                resp = await client.get(url, params=dict(request.query_params))
            else:
                body = await request.body()
                resp = await client.post(url, content=body,
                                         headers={"content-type": "application/json"})
    except httpx.HTTPError as e:
        raise HTTPException(502, f"forecast-svc 연결 실패: {e}") from e
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


@router.get("/models")
async def models(request: Request):
    return await _forward("GET", "/models", request)


@router.post("/run")
async def run(request: Request):
    return await _forward("POST", "/run", request)


@router.post("/select_best")
async def select_best(request: Request):
    return await _forward("POST", "/select_best", request)


@router.post("/publish_dayahead")
async def publish_dayahead(request: Request):
    return await _forward("POST", "/publish_dayahead", request)


@router.get("/experiments")
async def experiments(request: Request):
    return await _forward("GET", "/experiments", request)
