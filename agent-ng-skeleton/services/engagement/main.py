from fastapi import FastAPI
    from datetime import datetime
    from typing import List
    from pydantic import BaseModel
    from ng_common.models import *
    import os

    app = FastAPI(title="NanoGrid Engagement Service")

    @app.get("/health")
    def health():
        return {"service":"engagement","status":"ok","ts": datetime.utcnow().isoformat()}


from uuid import uuid4
NUDGES = {}

@app.post("/nudges", response_model=Nudge)
def create_nudge(n: Nudge):
    nid = n.nudgeId or uuid4().hex[:8]
    nudge = n.model_copy(update={"nudgeId": nid})
    NUDGES[nid] = nudge.model_dump()
    return nudge

@app.post("/actions/confirm")
def confirm(nudgeId: str, accepted: bool):
    return {"nudgeId": nudgeId, "accepted": accepted}

