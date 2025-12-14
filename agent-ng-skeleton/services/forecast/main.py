from fastapi import FastAPI
    from datetime import datetime
    from typing import List
    from pydantic import BaseModel
    from ng_common.models import *
    import os

    app = FastAPI(title="NanoGrid Forecast Service")

    @app.get("/health")
    def health():
        return {"service":"forecast","status":"ok","ts": datetime.utcnow().isoformat()}


@app.post("/forecast/load", response_model=list[TimePoint])
def forecast_load(req: ForecastRequest):
    # Dummy: 24 points flat
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return [TimePoint(t=now, y=123.4).model_dump() for _ in range(24)]

@app.post("/forecast/pv", response_model=list[TimePoint])
def forecast_pv(req: ForecastRequest):
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return [TimePoint(t=now, y=62.1).model_dump() for _ in range(24)]

@app.post("/forecast/price", response_model=list[TimePoint])
def forecast_price(req: ForecastRequest):
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    return [TimePoint(t=now, y=110.0).model_dump() for _ in range(24)]

