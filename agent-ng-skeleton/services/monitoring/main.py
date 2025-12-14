from fastapi import FastAPI
    from datetime import datetime
    from typing import List
    from pydantic import BaseModel
    from ng_common.models import *
    import os

    app = FastAPI(title="NanoGrid Monitoring Service")

    @app.get("/health")
    def health():
        return {"service":"monitoring","status":"ok","ts": datetime.utcnow().isoformat()}


from fastapi import Body
from statistics import mean

TELEMETRY = []

@app.post("/ingest")
def ingest(payload: dict = Body(...)):
    TELEMETRY.append(payload)
    return {"ok": True}

@app.get("/kpis", response_model=KPIResponse)
def kpis(siteId: str, window: str = "PT1H"):
    # Dummy values
    return KPIResponse(window=window, energy_kwh=123.0, cost=4567.0, carbon_kg=89.0)

