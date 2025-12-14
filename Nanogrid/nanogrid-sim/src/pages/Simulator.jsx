
import React, { useEffect, useMemo, useRef, useState } from 'react'
import KPIGrid from '../components/KPIGrid'
import TimeseriesChart from '../components/TimeseriesChart'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import { saveJSON, loadJSON, downloadBlob, toCSV } from '../lib/storage'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const toFixed = (n) => (typeof n === 'number' ? Number(n.toFixed(3)) : n)

const LS_KEY = 'ng.sim.params.v1'
const LS_DEMAND = 'ng.sim.demand.v1'

export default function Simulator() {
  const [params, setParams] = useState(() => loadJSON(LS_KEY, {
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
  }))
  useEffect(()=> saveJSON(LS_KEY, params), [params])

  const [demandCSV, setDemandCSV] = useState(()=> loadJSON(LS_DEMAND, null))
  useEffect(()=> saveJSON(LS_DEMAND, demandCSV), [demandCSV])

  const steps = useMemo(() => Math.floor((params.horizonHours * 60) / params.stepMinutes), [params])
  const deltaH = useMemo(() => params.stepMinutes / 60, [params])

  const synthLoad = useMemo(() => {
    if (demandCSV?.points?.length > 0) {
      const pts = demandCSV.points
      const arr = []
      for (let i=0; i<Math.min(steps, pts.length); i++) arr.push(Math.max(0, Number(pts[i].value)||0))
      while (arr.length < steps) arr.push(arr[arr.length-1]||0)
      return arr
    }
    const arr = []
    for (let i = 0; i < steps; i++) {
      const tH = i * deltaH
      const hour = Math.floor(tH % 24)
      let val = params.loadBaseKw
      if (hour >= 7 && hour <= 10) val += params.loadMorningPeakKw * Math.sin(((hour - 7) / 3) * Math.PI)
      if (hour >= 18 && hour <= 22) val += params.loadEveningPeakKw * Math.sin(((hour - 18) / 4) * Math.PI)
      const day = Math.floor(tH / 24) % 7
      if (day === 6 || day === 0) val *= 0.9
      const noise = 1 + (Math.random() * 2 - 1) * (params.loadNoisePct / 100)
      arr.push(Math.max(0, val * noise))
    }
    return arr
  }, [steps, deltaH, params, demandCSV])

  const synthPV = useMemo(() => {
    const arr = []
    for (let i = 0; i < steps; i++) {
      const tH = i * deltaH
      const hour = tH % 24
      let cf = 0
      if (hour >= 6 && hour <= 18) {
        const x = (hour - 6) / 12
        cf = Math.sin(Math.PI * x)
      }
      const day = Math.floor(tH / 24)
      const dailyWeather = 1 - (params.pvWeatherPct / 100) * (0.5 - Math.sin(day * 1.3) * 0.5)
      const pvKw = Math.max(0, params.pvKwDc * cf * dailyWeather)
      arr.push(pvKw)
    }
    return arr
  }, [steps, deltaH, params])

  const priceAtHour = (h) => {
    const inPeak1 = h >= params.peakStart && h < params.peakEnd
    const inPeak2 = h >= params.peak2Start && h < params.peak2End
    return (inPeak1 || inPeak2) ? params.pricePeak : params.priceOff
  }

  function runEngine(conf) {
    const D = synthLoad
    const S = synthPV.map(v => v * (conf.pvScale ?? 1))
    const n = D.length, dt = deltaH
    const hasBatt = (conf.battCapacityKwh ?? params.battCapacityKwh) > 0

    const eta_rt = clamp((conf.battRtEff ?? params.battRtEff)/100, 0.5, 1.0)
    const eta_c = Math.sqrt(eta_rt), eta_d = Math.sqrt(eta_rt)
    const C = conf.battCapacityKwh ?? params.battCapacityKwh
    const socMin = (conf.battSocMinPct ?? params.battSocMinPct) / 100 * C
    const socMax = (conf.battSocMaxPct ?? params.battSocMaxPct) / 100 * C
    const pchgMax = conf.battPchgKw ?? params.battPchgKw
    const pdisMax = conf.battPdisKw ?? params.battPdisKw

    const ts = []
    let soc = socMin
    let eDemand=0, eOnsiteUsed=0, eOnsiteGen=0, sumImport=0, sumExport=0, sumCurtail=0, sumDischarge=0
    let costImport=0, revenueExport=0, co2_kg=0

    for (let i=0;i<n;i++){
      const hour = Math.floor((i*dt) % 24)
      const price = priceAtHour(hour) // KRW/kWh
      const feedin = params.feedin       // KRW/kWh
      const co2factor = params.co2_g_per_kwh / 1000 // kg/kWh

      const load = D[i], pv = S[i]
      eDemand += load * dt
      eOnsiteGen += pv * dt

      const direct = Math.min(load, pv)
      let surplus = pv - direct
      let residualLoad = load - direct

      let pchg = 0, pdis = 0
      if (hasBatt) {
        // charge
        pchg = Math.min(surplus, pchgMax)
        const room = (socMax - soc) / (Math.max(eta_c,1e-6) * dt)
        pchg = Math.max(0, Math.min(pchg, room))
        soc = soc + eta_c * pchg * dt
        surplus = surplus - pchg

        // discharge
        pdis = Math.min(residualLoad, pdisMax)
        const avail = (soc - socMin) * Math.max(eta_d,1e-6) / dt
        pdis = Math.max(0, Math.min(pdis, avail))
        soc = soc - (pdis / Math.max(eta_d,1e-6)) * dt
        residualLoad = residualLoad - pdis
      }

      const gridImport = Math.max(0, residualLoad)
      const gridExport = Math.max(0, surplus)
      const curtail = 0

      sumImport += gridImport * dt
      sumExport += gridExport * dt
      sumCurtail += curtail * dt
      eOnsiteUsed += (direct + pdis) * dt
      sumDischarge += pdis * dt

      costImport += gridImport * dt * price
      revenueExport += gridExport * dt * feedin
      co2_kg += gridImport * dt * co2factor

      ts.push({
        ts: i,
        load, pv, soc, import: gridImport, export: gridExport, pchg, pdis, price
      })
    }

    const matchRate = eDemand > 0 ? (eOnsiteUsed / eDemand) : 0
    const selfConsumption = eOnsiteGen > 0 ? (eOnsiteUsed / eOnsiteGen) : 0
    const selfSufficiency = matchRate
    const curtPct = eOnsiteGen > 0 ? (sumCurtail / eOnsiteGen) : 0

    const kpi = {
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
    }

    return { ts, kpi }
  }

  // scenarios
  const scenarios = useMemo(() => {
    return [
      { key:'pv_only', name:'PV Only', conf: { pvScale: 1, battCapacityKwh: 0 } },
      { key:'pv_batt', name:'PV + Battery', conf: {} },
      { key:'mixed', name:'Mixed (PV120% + Batt150%)',
        conf: {
          pvScale: 1.2,
          battCapacityKwh: params.battCapacityKwh * 1.5,
          battPchgKw: params.battPchgKw * 1.2,
          battPdisKw: params.battPdisKw * 1.2
        } }
    ]
  }, [params])

  const runs = useMemo(() => {
    const out = {}
    scenarios.forEach(s => { out[s.key] = runEngine(s.conf) })
    return out
  }, [scenarios, synthLoad, synthPV, deltaH, params])

  // CSV upload handlers
  const onCSV = (file) => {
    if (!file) return
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data
        // expected columns: ts, load_kw OR value
        const points = rows.map((r, i) => ({
          ts: r.ts ?? i,
          value: r.load_kw ?? r.value ?? r.load ?? 0
        }))
        setDemandCSV({ points })
      }
    })
  }
  const clearCSV = () => setDemandCSV(null)

  // Exports
  const chartRef = useRef(null)
  const downloadKPIs = () => {
    const rows = Object.entries(runs).map(([k,v]) => ({ scenario: k, ...v.kpi }))
    const csv = toCSV(rows)
    downloadBlob('kpi_scenarios.csv', new Blob([csv], { type:'text/csv' }))
    downloadBlob('kpi_scenarios.json', new Blob([JSON.stringify(rows, null, 2)], { type:'application/json' }))
  }
  const downloadTimeseries = () => {
    const cur = runs['pv_batt'] || Object.values(runs)[0]
    const csv = toCSV(cur.ts)
    downloadBlob('timeseries_current.csv', new Blob([csv], { type:'text/csv' }))
    downloadBlob('timeseries_current.json', new Blob([JSON.stringify(cur.ts, null, 2)], { type:'application/json' }))
  }
  const downloadPNG = async () => {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current)
    canvas.toBlob((blob)=> downloadBlob('charts.png', blob))
  }

  const set = (patch) => setParams(p => ({ ...p, ...patch }))

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">수요–공급 매칭 시뮬레이터</h2>

      {/* Controls */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Panel title="범위">
          <Field label="기간(시간)" type="number" value={params.horizonHours} onChange={v=>set({horizonHours: Number(v)||1})}/>
          <Field label="스텝(분)" type="number" value={params.stepMinutes} onChange={v=>set({stepMinutes: Number(v)||15})}/>
        </Panel>
        <Panel title="부하(Load)">
          <Field label="CSV 업로드(ts,value|load_kw)" type="file" onFile={onCSV} />
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded-xl" onClick={clearCSV}>CSV 해제</button>
            <span className="text-xs text-gray-500">{demandCSV ? 'CSV 사용중' : '합성 부하 사용'}</span>
          </div>
          <Field label="평균 부하(kW)" type="number" value={params.loadBaseKw} onChange={v=>set({loadBaseKw:Number(v)||0})}/>
          <Field label="오전 피크(kW)" type="number" value={params.loadMorningPeakKw} onChange={v=>set({loadMorningPeakKw:Number(v)||0})}/>
          <Field label="저녁 피크(kW)" type="number" value={params.loadEveningPeakKw} onChange={v=>set({loadEveningPeakKw:Number(v)||0})}/>
          <Field label="노이즈(%)" type="number" value={params.loadNoisePct} onChange={v=>set({loadNoisePct:Number(v)||0})}/>
        </Panel>
        <Panel title="PV">
          <Field label="용량 kWdc" type="number" value={params.pvKwDc} onChange={v=>set({pvKwDc:Number(v)||0})}/>
          <Field label="날씨 변동(%)" type="number" value={params.pvWeatherPct} onChange={v=>set({pvWeatherPct:Number(v)||0})}/>
        </Panel>
        <Panel title="배터리">
          <Field label="용량(kWh)" type="number" value={params.battCapacityKwh} onChange={v=>set({battCapacityKwh:Number(v)||0})}/>
          <Field label="충전 최대(kW)" type="number" value={params.battPchgKw} onChange={v=>set({battPchgKw:Number(v)||0})}/>
          <Field label="방전 최대(kW)" type="number" value={params.battPdisKw} onChange={v=>set({battPdisKw:Number(v)||0})}/>
          <Field label="왕복 효율(%)" type="number" value={params.battRtEff} onChange={v=>set({battRtEff:Number(v)||0})}/>
          <Field label="SOC 최소(%)" type="number" value={params.battSocMinPct} onChange={v=>set({battSocMinPct:Number(v)||0})}/>
          <Field label="SOC 최대(%)" type="number" value={params.battSocMaxPct} onChange={v=>set({battSocMaxPct:Number(v)||0})}/>
        </Panel>
      </div>

      {/* Tariff / CO2 */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Panel title="요금(TOU)">
          <div className="grid grid-cols-2 gap-2">
            <Field label="피크 시작(시)" type="number" value={params.peakStart} onChange={v=>set({peakStart:Number(v)||0})}/>
            <Field label="피크 종료(시)" type="number" value={params.peakEnd} onChange={v=>set({peakEnd:Number(v)||0})}/>
            <Field label="피크2 시작" type="number" value={params.peak2Start} onChange={v=>set({peak2Start:Number(v)||0})}/>
            <Field label="피크2 종료" type="number" value={params.peak2End} onChange={v=>set({peak2End:Number(v)||0})}/>
            <Field label="피크 단가(₩/kWh)" type="number" value={params.pricePeak} onChange={v=>set({pricePeak:Number(v)||0})}/>
            <Field label="오프피크 단가" type="number" value={params.priceOff} onChange={v=>set({priceOff:Number(v)||0})}/>
            <Field label="수출단가(피딘)" type="number" value={params.feedin} onChange={v=>set({feedin:Number(v)||0})}/>
          </div>
        </Panel>
        <Panel title="배출계수">
          <Field label="Grid CO₂ (g/kWh)" type="number" value={params.co2_g_per_kwh} onChange={v=>set({co2_g_per_kwh:Number(v)||0})}/>
          <div className="text-xs text-gray-500 mt-2">※ 수입전력량 × 배출계수로 총 배출량(kg)을 계산합니다.</div>
        </Panel>
      </div>

      {/* KPI & Scenarios */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">시나리오 KPI 비교</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(runs).map(([key, v]) => (
            <div key={key} className="border rounded-2xl p-4 shadow-soft">
              <div className="text-sm text-gray-600 mb-2">{key}</div>
              <KPIGrid kpi={v.kpi} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6" ref={chartRef}>
        <div className="grid md:grid-cols-2 gap-4">
          <ChartCard title="수요·PV·수입/수출(kW) - PV+Battery">
            <TimeseriesChart
              data={runs['pv_batt']?.ts ?? []}
              series={[
                { dataKey: 'load', name: 'Load' },
                { dataKey: 'pv', name: 'PV' },
                { dataKey: 'import', name: 'Import' },
                { dataKey: 'export', name: 'Export' },
              ]}
            />
          </ChartCard>
          <ChartCard title="SOC / 충·방전 - PV+Battery">
            <TimeseriesChart
              data={runs['pv_batt']?.ts ?? []}
              series={[
                { dataKey: 'soc', name: 'SOC' },
                { dataKey: 'pchg', name: 'Pchg' },
                { dataKey: 'pdis', name: 'Pdis' },
              ]}
            />
          </ChartCard>
        </div>
      </div>

      {/* Exports */}
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={downloadKPIs}>KPI CSV/JSON 다운로드</button>
        <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={downloadTimeseries}>시계열 CSV/JSON 다운로드</button>
        <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={downloadPNG}>차트 PNG 캡처</button>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="border rounded-2xl p-4 shadow-soft">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className="grid gap-3">{children}</div>
    </div>
  )
}
function Field({ label, type='text', value, onChange, onFile }) {
  if (type === 'file') {
    return (
      <label className="text-sm">
        <div className="mb-1 text-gray-600">{label}</div>
        <input className="w-full" type="file" accept=".csv,text/csv"
          onChange={(e)=>onFile && onFile(e.target.files[0])} />
      </label>
    )
  }
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input
        className="w-full border rounded-xl px-3 py-2 bg-transparent"
        type={type}
        value={value}
        onChange={(e)=>onChange && onChange(e.target.value)}
      />
    </label>
  )
}
function ChartCard({ title, children }) {
  return (
    <div className="border rounded-2xl p-4 shadow-soft">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      {children}
    </div>
  )
}
