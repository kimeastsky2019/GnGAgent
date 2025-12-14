"""
시뮬레이션 엔진: 수요-공급 매칭 시뮬레이션 로직
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
from decimal import Decimal


def clamp(value: float, min_val: float, max_val: float) -> float:
    """값을 범위 내로 제한"""
    return max(min_val, min(max_val, value))


def run_simulation(
    period_start: datetime,
    period_end: datetime,
    step_minutes: int,
    demand_profile: List[float],
    pv_profile: List[float],
    params: Dict[str, Any]
) -> Dict[str, Any]:
    """
    시뮬레이션 실행
    
    Args:
        period_start: 시작 시간
        period_end: 종료 시간
        step_minutes: 스텝 간격 (분)
        demand_profile: 수요 프로필 (kW)
        pv_profile: PV 발전 프로필 (kW)
        params: 시뮬레이션 파라미터
    
    Returns:
        시뮬레이션 결과 (timeseries, kpi)
    """
    delta_h = step_minutes / 60.0
    n = len(demand_profile)
    
    # 배터리 파라미터
    batt_capacity_kwh = params.get("battCapacityKwh", 0)
    batt_pchg_kw = params.get("battPchgKw", 0)
    batt_pdis_kw = params.get("battPdisKw", 0)
    batt_rt_eff = clamp(params.get("battRtEff", 92) / 100.0, 0.5, 1.0)
    batt_soc_min_pct = params.get("battSocMinPct", 10) / 100.0
    batt_soc_max_pct = params.get("battSocMaxPct", 90) / 100.0
    
    eta_c = (batt_rt_eff ** 0.5) if batt_rt_eff > 0 else 1.0
    eta_d = (batt_rt_eff ** 0.5) if batt_rt_eff > 0 else 1.0
    
    soc_min = batt_capacity_kwh * batt_soc_min_pct
    soc_max = batt_capacity_kwh * batt_soc_max_pct
    has_batt = batt_capacity_kwh > 0
    
    # 요금 파라미터
    price_peak = params.get("pricePeak", 220)
    price_off = params.get("priceOff", 110)
    feedin = params.get("feedin", 60)
    co2_g_per_kwh = params.get("co2_g_per_kwh", 450)
    peak_start = params.get("peakStart", 9)
    peak_end = params.get("peakEnd", 12)
    peak2_start = params.get("peak2Start", 18)
    peak2_end = params.get("peak2End", 21)
    
    def price_at_hour(hour: int) -> float:
        """시간대별 요금 계산"""
        in_peak1 = peak_start <= hour < peak_end
        in_peak2 = peak2_start <= hour < peak2_end
        return price_peak if (in_peak1 or in_peak2) else price_off
    
    # 초기화
    soc = soc_min
    e_demand = 0.0
    e_onsite_used = 0.0
    e_onsite_gen = 0.0
    sum_import = 0.0
    sum_export = 0.0
    sum_curtail = 0.0
    sum_discharge = 0.0
    cost_import = 0.0
    revenue_export = 0.0
    co2_kg = 0.0
    
    timeseries = []
    current_time = period_start
    
    for i in range(n):
        hour = current_time.hour
        price = price_at_hour(hour)
        co2_factor = co2_g_per_kwh / 1000.0  # kg/kWh
        
        load = demand_profile[i]
        pv = pv_profile[i]
        
        e_demand += load * delta_h
        e_onsite_gen += pv * delta_h
        
        # 직접 사용
        direct = min(load, pv)
        surplus = pv - direct
        residual_load = load - direct
        
        pchg = 0.0
        pdis = 0.0
        
        if has_batt:
            # 충전
            pchg = min(surplus, batt_pchg_kw)
            room = (soc_max - soc) / (max(eta_c, 1e-6) * delta_h) if eta_c > 0 else 0
            pchg = max(0.0, min(pchg, room))
            soc = soc + eta_c * pchg * delta_h
            surplus = surplus - pchg
            
            # 방전
            pdis = min(residual_load, batt_pdis_kw)
            avail = (soc - soc_min) * max(eta_d, 1e-6) / delta_h if eta_d > 0 else 0
            pdis = max(0.0, min(pdis, avail))
            soc = soc - (pdis / max(eta_d, 1e-6)) * delta_h
            residual_load = residual_load - pdis
        
        grid_import = max(0.0, residual_load)
        grid_export = max(0.0, surplus)
        curtail = 0.0
        
        sum_import += grid_import * delta_h
        sum_export += grid_export * delta_h
        sum_curtail += curtail * delta_h
        e_onsite_used += (direct + pdis) * delta_h
        sum_discharge += pdis * delta_h
        
        cost_import += grid_import * delta_h * price
        revenue_export += grid_export * delta_h * feedin
        co2_kg += grid_import * delta_h * co2_factor
        
        timeseries.append({
            "ts": current_time.isoformat(),
            "load": round(load, 3),
            "pv": round(pv, 3),
            "soc": round(soc, 3),
            "import": round(grid_import, 3),
            "export": round(grid_export, 3),
            "pchg": round(pchg, 3),
            "pdis": round(pdis, 3),
            "price": round(price, 2)
        })
        
        current_time += timedelta(minutes=step_minutes)
    
    # KPI 계산
    match_rate = (e_onsite_used / e_demand) if e_demand > 0 else 0.0
    self_consumption = (e_onsite_used / e_onsite_gen) if e_onsite_gen > 0 else 0.0
    self_sufficiency = match_rate
    curt_pct = (sum_curtail / e_onsite_gen) if e_onsite_gen > 0 else 0.0
    
    kpi = {
        "demand_kwh": round(e_demand, 3),
        "onsite_gen_kwh": round(e_onsite_gen, 3),
        "onsite_used_kwh": round(e_onsite_used, 3),
        "import_kwh": round(sum_import, 3),
        "export_kwh": round(sum_export, 3),
        "discharge_kwh": round(sum_discharge, 3),
        "match_rate": round(match_rate, 3),
        "self_consumption": round(self_consumption, 3),
        "self_sufficiency": round(self_sufficiency, 3),
        "curtail_ratio": round(curt_pct, 3),
        "cost_import_krw": round(cost_import, 2),
        "revenue_export_krw": round(revenue_export, 2),
        "net_cost_krw": round(cost_import - revenue_export, 2),
        "emissions_kg": round(co2_kg, 3),
    }
    
    return {
        "timeseries": timeseries,
        "kpi": kpi
    }


def generate_synthetic_demand(
    period_start: datetime,
    period_end: datetime,
    step_minutes: int,
    params: Dict[str, Any]
) -> List[float]:
    """합성 수요 프로필 생성"""
    import random
    
    delta_h = step_minutes / 60.0
    current_time = period_start
    demand = []
    
    load_base_kw = params.get("loadBaseKw", 80)
    load_morning_peak_kw = params.get("loadMorningPeakKw", 30)
    load_evening_peak_kw = params.get("loadEveningPeakKw", 40)
    load_noise_pct = params.get("loadNoisePct", 5) / 100.0
    
    while current_time < period_end:
        hour = current_time.hour
        day_of_week = current_time.weekday()
        
        val = load_base_kw
        
        # 오전 피크 (7-10시)
        if 7 <= hour <= 10:
            val += load_morning_peak_kw * (1 - abs((hour - 8.5) / 1.5))
        
        # 저녁 피크 (18-22시)
        if 18 <= hour <= 22:
            val += load_evening_peak_kw * (1 - abs((hour - 20) / 2))
        
        # 주말 감소
        if day_of_week in [5, 6]:  # 토, 일
            val *= 0.9
        
        # 노이즈 추가
        noise = 1 + (random.random() * 2 - 1) * load_noise_pct
        val = max(0.0, val * noise)
        
        demand.append(val)
        current_time += timedelta(minutes=step_minutes)
    
    return demand


def generate_synthetic_pv(
    period_start: datetime,
    period_end: datetime,
    step_minutes: int,
    params: Dict[str, Any]
) -> List[float]:
    """합성 PV 발전 프로필 생성"""
    import math
    
    delta_h = step_minutes / 60.0
    current_time = period_start
    pv = []
    
    pv_kw_dc = params.get("pvKwDc", 120)
    pv_weather_pct = params.get("pvWeatherPct", 15) / 100.0
    
    day_offset = 0
    
    while current_time < period_end:
        hour = current_time.hour + (current_time.minute / 60.0)
        day = (current_time - period_start).days
        
        # 일출/일몰 기반 발전 곡선 (6-18시)
        cf = 0.0
        if 6 <= hour <= 18:
            x = (hour - 6) / 12.0
            cf = math.sin(math.pi * x)
        
        # 날씨 변동 (일별)
        daily_weather = 1 - pv_weather_pct * (0.5 - math.sin(day * 1.3) * 0.5)
        pv_kw = max(0.0, pv_kw_dc * cf * daily_weather)
        
        pv.append(pv_kw)
        current_time += timedelta(minutes=step_minutes)
    
    return pv

