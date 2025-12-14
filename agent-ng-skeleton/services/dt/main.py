from fastapi import FastAPI
    from datetime import datetime
    from typing import List
    from pydantic import BaseModel
    from ng_common.models import *
    import os

    app = FastAPI(title="NanoGrid Dt Service")

    @app.get("/health")
    def health():
        return {"service":"dt","status":"ok","ts": datetime.utcnow().isoformat()}


from fastapi import Body
ASSETS = {}
CONSTRAINTS = {}

@app.post("/assets", response_model=Asset)
def create_asset(a: Asset):
    ASSETS[a.assetId] = a.model_dump()
    return a

@app.patch("/assets/{asset_id}/state")
def patch_state(asset_id: str, s: AssetState):
    return {"ok": True, "assetId": asset_id, "state": s.model_dump()}

@app.get("/topology/{siteId}")
def topology(siteId: str):
    nodes = [v for v in ASSETS.values() if v["siteId"] == siteId]
    return {"siteId": siteId, "nodes": nodes, "edges": []}

@app.post("/constraints")
def update_constraints(payload: dict = Body(...)):
    site = payload.get("siteId","default")
    CONSTRAINTS[site] = payload
    return {"ok": True}

