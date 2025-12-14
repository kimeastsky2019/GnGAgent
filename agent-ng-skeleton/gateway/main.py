from fastapi import FastAPI
import os, httpx
from datetime import datetime

app = FastAPI(title="NanoGrid Gateway")

DT = os.getenv("DT_URL","http://dt:8001")
EOP = os.getenv("EOP_URL","http://eop:8002")
FORECAST = os.getenv("FORECAST_URL","http://forecast:8003")
MON = os.getenv("MON_URL","http://monitoring:8004")
ENG = os.getenv("ENG_URL","http://engagement:8005")

@app.get("/health")
def health():
    return {"service":"gateway","status":"ok","ts": datetime.utcnow().isoformat()}

@app.get("/probe")
async def probe():
    async with httpx.AsyncClient(timeout=3) as client:
        r = await client.get(f"{DT}/health")
        return {"dt": r.json()}
