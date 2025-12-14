
export interface SimParams {
    horizonHours: number;
    stepMinutes: number;
    loadBaseKw: number;
    loadMorningPeakKw: number;
    loadEveningPeakKw: number;
    loadNoisePct: number;
    pvKwDc: number;
    pvWeatherPct: number;
    battCapacityKwh: number;
    battPchgKw: number;
    battPdisKw: number;
    battRtEff: number;
    battSocMinPct: number;
    battSocMaxPct: number;
    peakStart: number;
    peakEnd: number;
    peak2Start: number;
    peak2End: number;
    pricePeak: number;
    priceOff: number;
    feedin: number;
    co2_g_per_kwh: number;
}

export interface TimeSeriesPoint {
    ts: number;
    load: number;
    pv: number;
    soc: number;
    import: number;
    export: number;
    pchg: number;
    pdis: number;
    price: number;
}

export interface KPI {
    demand_kwh: number;
    onsite_gen_kwh: number;
    onsite_used_kwh: number;
    import_kwh: number;
    export_kwh: number;
    discharge_kwh: number;
    match_rate: number;
    self_consumption: number;
    self_sufficiency: number;
    curtail_ratio: number;
    cost_import_krw: number;
    revenue_export_krw: number;
    net_cost_krw: number;
    emissions_kg: number;
}

export interface SimResult {
    ts: TimeSeriesPoint[];
    kpi: KPI;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const toFixed = (n: number) => Number(n.toFixed(3));

export const DEFAULT_PARAMS: SimParams = {
    horizonHours: 24 * 7,
    stepMinutes: 15,
    loadBaseKw: 80,
    loadMorningPeakKw: 30,
    loadEveningPeakKw: 40,
    loadNoisePct: 5,
    pvKwDc: 120,
    pvWeatherPct: 15,
    battCapacityKwh: 300,
    battPchgKw: 100,
    battPdisKw: 100,
    battRtEff: 92,
    battSocMinPct: 10,
    battSocMaxPct: 90,
    peakStart: 9, peakEnd: 12, peak2Start: 18, peak2End: 21,
    pricePeak: 220, priceOff: 110, feedin: 60, co2_g_per_kwh: 450,
};

export function generateSynthLoad(params: SimParams, steps: number, deltaH: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < steps; i++) {
        const tH = i * deltaH;
        const hour = Math.floor(tH % 24);
        let val = params.loadBaseKw;
        if (hour >= 7 && hour <= 10) val += params.loadMorningPeakKw * Math.sin(((hour - 7) / 3) * Math.PI);
        if (hour >= 18 && hour <= 22) val += params.loadEveningPeakKw * Math.sin(((hour - 18) / 4) * Math.PI);
        const day = Math.floor(tH / 24) % 7;
        if (day === 6 || day === 0) val *= 0.9;
        const noise = 1 + (Math.random() * 2 - 1) * (params.loadNoisePct / 100);
        arr.push(Math.max(0, val * noise));
    }
    return arr;
}

export function generateSynthPV(params: SimParams, steps: number, deltaH: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < steps; i++) {
        const tH = i * deltaH;
        const hour = tH % 24;
        let cf = 0;
        if (hour >= 6 && hour <= 18) {
            const x = (hour - 6) / 12;
            cf = Math.sin(Math.PI * x);
        }
        const day = Math.floor(tH / 24);
        const dailyWeather = 1 - (params.pvWeatherPct / 100) * (0.5 - Math.sin(day * 1.3) * 0.5);
        const pvKw = Math.max(0, params.pvKwDc * cf * dailyWeather);
        arr.push(pvKw);
    }
    return arr;
}

export function runSimulation(
    params: SimParams,
    customLoad?: number[],
    overrideConf?: Partial<SimParams>
): SimResult {
    const conf = { ...params, ...overrideConf };
    const steps = Math.floor((conf.horizonHours * 60) / conf.stepMinutes);
    const deltaH = conf.stepMinutes / 60;

    const D = customLoad && customLoad.length >= steps ? customLoad.slice(0, steps) : generateSynthLoad(conf, steps, deltaH);
    const S = generateSynthPV(conf, steps, deltaH);
    const n = D.length;

    const hasBatt = conf.battCapacityKwh > 0;
    const eta_rt = clamp(conf.battRtEff / 100, 0.5, 1.0);
    const eta_c = Math.sqrt(eta_rt);
    const eta_d = Math.sqrt(eta_rt);
    const C = conf.battCapacityKwh;
    const socMin = (conf.battSocMinPct / 100) * C;
    const socMax = (conf.battSocMaxPct / 100) * C;
    const pchgMax = conf.battPchgKw;
    const pdisMax = conf.battPdisKw;

    const ts: TimeSeriesPoint[] = [];
    let soc = socMin;
    let eDemand = 0, eOnsiteUsed = 0, eOnsiteGen = 0, sumImport = 0, sumExport = 0, sumCurtail = 0, sumDischarge = 0;
    let costImport = 0, revenueExport = 0, co2_kg = 0;

    const priceAtHour = (h: number) => {
        const inPeak1 = h >= conf.peakStart && h < conf.peakEnd;
        const inPeak2 = h >= conf.peak2Start && h < conf.peak2End;
        return (inPeak1 || inPeak2) ? conf.pricePeak : conf.priceOff;
    };

    for (let i = 0; i < n; i++) {
        const hour = Math.floor((i * deltaH) % 24);
        const price = priceAtHour(hour);
        const feedin = conf.feedin;
        const co2factor = conf.co2_g_per_kwh / 1000;

        const load = D[i];
        const pv = S[i];
        eDemand += load * deltaH;
        eOnsiteGen += pv * deltaH;

        const direct = Math.min(load, pv);
        let surplus = pv - direct;
        let residualLoad = load - direct;

        let pchg = 0, pdis = 0;
        if (hasBatt) {
            // charge
            pchg = Math.min(surplus, pchgMax);
            const room = (socMax - soc) / (Math.max(eta_c, 1e-6) * deltaH);
            pchg = Math.max(0, Math.min(pchg, room));
            soc = soc + eta_c * pchg * deltaH;
            surplus = surplus - pchg;

            // discharge
            pdis = Math.min(residualLoad, pdisMax);
            const avail = (soc - socMin) * Math.max(eta_d, 1e-6) / deltaH;
            pdis = Math.max(0, Math.min(pdis, avail));
            soc = soc - (pdis / Math.max(eta_d, 1e-6)) * deltaH;
            residualLoad = residualLoad - pdis;
        }

        const gridImport = Math.max(0, residualLoad);
        const gridExport = Math.max(0, surplus);
        const curtail = 0; // Simplified

        sumImport += gridImport * deltaH;
        sumExport += gridExport * deltaH;
        sumCurtail += curtail * deltaH;
        eOnsiteUsed += (direct + pdis) * deltaH;
        sumDischarge += pdis * deltaH;

        costImport += gridImport * deltaH * price;
        revenueExport += gridExport * deltaH * feedin;
        co2_kg += gridImport * deltaH * co2factor;

        ts.push({
            ts: i,
            load: toFixed(load),
            pv: toFixed(pv),
            soc: toFixed(soc),
            import: toFixed(gridImport),
            export: toFixed(gridExport),
            pchg: toFixed(pchg),
            pdis: toFixed(pdis),
            price: toFixed(price)
        });
    }

    const matchRate = eDemand > 0 ? (eOnsiteUsed / eDemand) : 0;
    const selfConsumption = eOnsiteGen > 0 ? (eOnsiteUsed / eOnsiteGen) : 0;
    const selfSufficiency = matchRate;
    const curtPct = eOnsiteGen > 0 ? (sumCurtail / eOnsiteGen) : 0;

    const kpi: KPI = {
        demand_kwh: toFixed(eDemand),
        onsite_gen_kwh: toFixed(eOnsiteGen),
        onsite_used_kwh: toFixed(eOnsiteUsed),
        import_kwh: toFixed(sumImport),
        export_kwh: toFixed(sumExport),
        discharge_kwh: toFixed(sumDischarge),
        match_rate: toFixed(matchRate),
        self_consumption: toFixed(selfConsumption),
        self_sufficiency: toFixed(selfSufficiency),
        curtail_ratio: toFixed(curtPct),
        cost_import_krw: toFixed(costImport),
        revenue_export_krw: toFixed(revenueExport),
        net_cost_krw: toFixed(costImport - revenueExport),
        emissions_kg: toFixed(co2_kg),
    };

    return { ts, kpi };
}
