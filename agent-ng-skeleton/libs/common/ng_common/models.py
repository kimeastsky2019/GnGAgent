from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class TimePoint(BaseModel):
    t: datetime
    y: float
    pi: Optional[List[float]] = None

class ForecastRequest(BaseModel):
    siteId: str
    horizon: str
    granularityMin: int
    features: dict = {}

class PlanConstraints(BaseModel):
    contractDemandKw: float | None = None
    ess: Optional[dict] = None
    hvac: Optional[dict] = None

class DRProgram(BaseModel):
    eventId: str
    start: datetime
    durMin: int
    price: float

class PlanOptimizeRequest(BaseModel):
    siteId: str
    horizon: str
    granularityMin: int
    forecasts: dict
    constraints: PlanConstraints
    programs: dict | None = None
    preferences: dict | None = None

class Setpoint(BaseModel):
    t: datetime
    essP: float | None = None
    hvacSet: float | None = None
    evKw: float | None = None

class PlanResponse(BaseModel):
    planId: str
    objective: dict
    setpoints: List[Setpoint]
    explanations: List[str] = []

class Asset(BaseModel):
    assetId: str
    type: Literal["METER","PV","ESS","EVSE","HVAC","LOAD"]
    siteId: str
    meta: dict = {}

class AssetState(BaseModel):
    assetId: str
    ts: datetime
    soc: float | None = None
    p: float | None = None
    temp: float | None = None
    on: Optional[bool] = None

class KPIResponse(BaseModel):
    window: str
    energy_kwh: float
    cost: float
    carbon_kg: float

class Nudge(BaseModel):
    nudgeId: str
    title: str
    message: str
    est_saving: float
    discomfort: float # 0~1
    rewards: dict = {}
