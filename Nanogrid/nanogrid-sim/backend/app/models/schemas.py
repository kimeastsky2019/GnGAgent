from pydantic import BaseModel, Field
from typing import Optional, Literal, Any

class Site(BaseModel):
    """사이트 정보"""
    id: Optional[int] = Field(None, description="사이트 ID (생성 시 자동 할당)")
    name: str = Field(..., description="사이트 이름")
    lat: float = Field(..., description="위도")
    lon: float = Field(..., description="경도")
    tz: str = Field(..., description="시간대 (예: Asia/Seoul)")
    grid_tariff_id: Optional[int] = Field(None, description="그리드 요금제 ID")
    meta: dict = Field(default_factory=dict, description="추가 메타데이터")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "서울 사무실",
                "lat": 37.5665,
                "lon": 126.9780,
                "tz": "Asia/Seoul",
                "meta": {}
            }
        }

class SimRunRequest(BaseModel):
    """시뮬레이션 실행 요청"""
    site_id: int = Field(..., description="사이트 ID")
    period_start: str = Field(..., description="시작 시간 (ISO 8601 형식, 예: 2025-01-01T00:00:00Z)")
    period_end: str = Field(..., description="종료 시간 (ISO 8601 형식, 예: 2025-01-07T23:59:59Z)")
    step_minutes: Literal[5,10,15,30,60] = Field(..., description="시뮬레이션 스텝 간격 (분)")
    demand_profile_id: Optional[int] = Field(None, description="수요 프로필 ID (없으면 합성 데이터 사용)")
    strategy: Optional[Literal["self_sufficiency","tariff_opt","peak_cut"]] = Field(
        "self_sufficiency",
        description="시뮬레이션 전략"
    )
    params: dict = Field(
        default_factory=dict,
        description="시뮬레이션 파라미터 (배터리, PV, 요금 등)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "site_id": 1,
                "period_start": "2025-01-01T00:00:00Z",
                "period_end": "2025-01-07T23:59:59Z",
                "step_minutes": 15,
                "strategy": "self_sufficiency",
                "params": {
                    "battCapacityKwh": 300,
                    "battPchgKw": 100,
                    "battPdisKw": 100,
                    "battRtEff": 92,
                    "pvKwDc": 120,
                    "pricePeak": 220,
                    "priceOff": 110,
                    "feedin": 60,
                    "co2_g_per_kwh": 450
                }
            }
        }
