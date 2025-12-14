from fastapi import FastAPI
    from datetime import datetime
    from typing import List
    from pydantic import BaseModel
    from ng_common.models import *
    import os

    app = FastAPI(title="NanoGrid Eop Service")

    @app.get("/health")
    def health():
        return {"service":"eop","status":"ok","ts": datetime.utcnow().isoformat()}


from uuid import uuid4
from fastapi import Body

@app.post("/plan/optimize", response_model=PlanResponse)
def optimize(req: PlanOptimizeRequest):
    # Dummy plan: simple DR-aware setpoints
    sp = []
    # Create two setpoints as example
    now = datetime.utcnow().replace(second=0, microsecond=0)
    sp.append(Setpoint(t=now, essP=150.0, hvacSet=25.0, evKw=0))
    sp.append(Setpoint(t=now, essP=200.0, hvacSet=25.5, evKw=0))
    plan = PlanResponse(
        planId=f"PLAN_{now.strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}",
        objective={"cost": 421300, "carbonKg": 182.4, "reward": 55000},
        setpoints=sp,
        explanations=["DR window: discharge ESS + relax HVAC setpoint"]
    )
    return plan

@app.post("/plan/apply")
def apply_plan(payload: dict = Body(...)):
    # In real impl: dispatch to BAS/EMS adapters
    return {"ok": True, "dispatched": True, "targets": ["ESS","HVAC"]}

