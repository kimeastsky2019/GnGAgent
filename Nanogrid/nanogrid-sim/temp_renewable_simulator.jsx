import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * Renewable Matching Simulator (Client-side)
 * - Language: English UI
 * - UX: clearer grouping, units, presets, validation, nicer charts
 */

// ===== Utilities =====
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toFixed = (n) => (typeof n === "number" ? Number(n.toFixed(3)) : n);
const nf = (n) => (typeof n === "number" ? n.toLocaleString() : n);

// ===== Small UI primitives =====
function Panel({ title, subtitle, children }) {
  return (
    <div className="border rounded-2xl p-4 shadow-sm bg-white/60">
      <div className="mb-3">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, unit, min, max, step = 1 }) {
  const handle = (v) => {
    const num = Number(v);
    if (Number.isNaN(num)) return onChange(0);
    // guard and clamp
    const clamped = clamp(num, min ?? -Infinity, max ?? Infinity);
    onChange(clamped);
  };
  return (
    <label className="text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-700">{label}</span>
        {unit && <span className="text-gray-400 text-xs">{unit}</span>}
      </div>
      <input
        className="w-full border rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handle(e.target.value)}
      />
      {(min !== undefined || max !== undefined) && (
        <div className="text-[11px] text-gray-400 mt-1">{min !== undefined ? `min ${min}` : ""}{min!==undefined && max!==undefined? " · ":""}{max !== undefined ? `max ${max}` : ""}</div>
      )}
    </label>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border rounded-2xl p-4 shadow-sm bg-white/60">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      {children}
    </div>
  );
}

// ===== KPI Grid =====
function KPIGrid({ kpi }) {
  if (!kpi) return null;
  const entries = [
    ["demand_kwh", "Total Demand (kWh)"],
    ["onsite_gen_kwh", "On-site Generation (kWh)"],
    ["onsite_used_kwh", "On-site Used (kWh)"],
    ["import_kwh", "Grid Import (kWh)"],
    ["export_kwh", "Grid Export (kWh)"],
    ["discharge_kwh", "Battery Discharge (kWh)"],
    ["match_rate", "Match Rate"],
    ["self_consumption", "Self-Consumption"],
    ["self_sufficiency", "Self-Sufficiency"],
    ["curtail_ratio", "Curtailment Ratio"],
  ];
  return (
    <div>
      <div className="grid lg:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-3">
        {entries.map(([key, label]) => (
          <div key={key} className="border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">
              {typeof kpi[key] === "number"
                ? key.includes("rate") || key.includes("ratio")
                  ? `${(kpi[key] * 100).toFixed(1)}%`
                  : nf(kpi[key])
                : kpi[key]}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-gray-400 mt-2">Match Rate = On-site supply used / Total demand; Self-Consumption = On-site used / On-site generation.</div>
    </div>
  );
}

// ===== Timeseries Chart =====
function TimeseriesChart({ data, series }) {
  const kwFmt = (v) => (v == null ? "" : `${Number(v).toFixed(1)} k` + ("W"));
  const idxFmt = (v) => `t${v}`;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fontSize: 11 }} tickFormatter={idxFmt} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={kwFmt} />
          <Tooltip formatter={(v)=>Number(v).toFixed(2)} labelFormatter={(l)=>`Step ${l}`} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} dot={false} strokeWidth={1.8} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RenewableMatchingSimulator() {
  // ===== Inputs =====
  const [params, setParams] = useState({
    horizonHours: 24 * 7, // simulation horizon (hours)
    stepMinutes: 15, // time step (minutes)
  });

  // ===== Assets State =====
  // Demand assets: kind, magnitude (kW or % for noise), api, note
  const [demandAssets, setDemandAssets] = useState([
    { id: 1, name: "Baseload", kind: "Base", magnitude: 80, unit: "kW", api: "", note: "Base load" },
    { id: 2, name: "Morning Peak", kind: "Morning Peak", magnitude: 30, unit: "kW", api: "", note: "Morning Peak Add-on" },
    { id: 3, name: "Evening Peak", kind: "Evening Peak", magnitude: 40, unit: "kW", api: "", note: "Evening Peak Add-on" },
    { id: 4, name: "Load Noise", kind: "Noise", magnitude: 5, unit: "%", api: "", note: "Noise" },
  ]);

  // Supply assets: type(PV/Wind/CHP/Battery), capacity, api, battery manual fields when type==Battery
  const [supplyAssets, setSupplyAssets] = useState([
    { id: 101, name: "PV Array A", type: "PV", capacity: 120, unit: "kWdc", api: "" },
    {
      id: 150,
      name: "Battery A",
      type: "Battery",
      capacityKwh: 300,
      pchgKw: 100,
      pdisKw: 100,
      rtEff: 92,
      socMinPct: 10,
      socMaxPct: 90,
      api: "",
    },
  ]);

  // ===== Helpers to mutate assets =====
  const addDemand = () =>
    setDemandAssets((a) => [
      ...a,
      { id: Date.now(), name: "New Demand", kind: "Device", magnitude: 1, unit: "kW", api: "", note: "" },
    ]);
  const removeDemand = (id) => setDemandAssets((a) => a.filter((x) => x.id !== id));
  const updateDemand = (id, patch) =>
    setDemandAssets((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addSupply = (type = "PV") =>
    setSupplyAssets((a) => [
      ...a,
      type === "Battery"
        ? {
            id: Date.now(),
            name: `Battery ${a.filter((x) => x.type === "Battery").length + 1}`,
            type: "Battery",
            capacityKwh: 100,
            pchgKw: 50,
            pdisKw: 50,
            rtEff: 92,
            socMinPct: 10,
            socMaxPct: 90,
            api: "",
          }
        : { id: Date.now(), name: `${type} ${a.filter((x) => x.type === type).length + 1}`, type, capacity: 50, unit: type === "PV" ? "kWdc" : "kW", api: "" },
    ]);
  const removeSupply = (id) => setSupplyAssets((a) => a.filter((x) => x.id !== id));
  const updateSupply = (id, patch) =>
    setSupplyAssets((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  // ===== Derived counts/steps =====
  const steps = useMemo(() => Math.floor((params.horizonHours * 60) / params.stepMinutes || 15), [params]);
  const deltaH = useMemo(() => (params.stepMinutes || 15) / 60, [params]);

  // ===== Synthetic Load from Demand Assets =====
  const synthLoad = useMemo(() => {
    const base = demandAssets.filter((d) => d.kind === "Base" || d.kind === "Baseload" || d.kind === "HVAC" || d.kind === "Device").reduce((s, d) => s + (d.unit === "%" ? 0 : Number(d.magnitude || 0)), 0);
    const morningAmp = demandAssets.filter((d) => d.kind === "Morning Peak").reduce((s, d) => s + Number(d.magnitude || 0), 0);
    const eveningAmp = demandAssets.filter((d) => d.kind === "Evening Peak").reduce((s, d) => s + Number(d.magnitude || 0), 0);
    // Combine noise (take max % among noise assets)
    const noisePct = demandAssets.filter((d) => d.kind === "Noise").reduce((m, d) => Math.max(m, Number(d.magnitude || 0)), 0);

    const arr = [];
    for (let i = 0; i < steps; i++) {
      const tH = i * deltaH;
      const hour = Math.floor(tH % 24);
      let val = base;
      if (hour >= 7 && hour <= 10) val += morningAmp * Math.sin(((hour - 7) / 3) * Math.PI);
      if (hour >= 18 && hour <= 22) val += eveningAmp * Math.sin(((hour - 18) / 4) * Math.PI);
      const day = Math.floor(tH / 24) % 7;
      if (day === 6 || day === 0) val *= 0.9; // weekend reduction
      const noise = 1 + (Math.random() * 2 - 1) * (noisePct / 100);
      arr.push(Math.max(0, val * noise));
    }
    return arr;
  }, [demandAssets, steps, deltaH]);

  // ===== Synthetic Supply from Supply Assets =====
  const synthPV = useMemo(() => {
    const totalPV = supplyAssets.filter((s) => s.type === "PV").reduce((s, x) => s + Number(x.capacity || 0), 0);
    const arr = [];
    for (let i = 0; i < steps; i++) {
      const tH = i * deltaH;
      const hour = tH % 24;
      let cf = 0;
      if (hour >= 6 && hour <= 18) {
        const x = (hour - 6) / 12;
        cf = Math.sin(Math.PI * x);
      }
      // simple day-to-day weather variance using a smooth function
      const day = Math.floor(tH / 24);
      const dailyWeather = 1 - 0.15 * (0.5 - Math.sin(day * 1.3) * 0.5);
      arr.push(Math.max(0, totalPV * cf * dailyWeather));
    }
    return arr;
  }, [supplyAssets, steps, deltaH]);

  const synthWind = useMemo(() => {
    const totalWind = supplyAssets.filter((s) => s.type === "Wind").reduce((s, x) => s + Number(x.capacity || 0), 0);
    const arr = [];
    for (let i = 0; i < steps; i++) {
      const tH = i * deltaH;
      // diurnal + random variation proxy
      const hour = tH % 24;
      const diurnal = 0.6 + 0.4 * Math.sin(((hour + 6) / 24) * 2 * Math.PI);
      const noise = 0.85 + 0.3 * Math.sin(i * 0.3);
      arr.push(Math.max(0, totalWind * diurnal * noise));
    }
    return arr;
  }, [supplyAssets, steps, deltaH]);

  const synthCHP = useMemo(() => {
    const totalCHP = supplyAssets.filter((s) => s.type === "CHP").reduce((s, x) => s + Number(x.capacity || 0), 0);
    // simple constant available output (can be constrained via dispatch later)
    return Array.from({ length: steps }, () => totalCHP);
  }, [supplyAssets, steps]);

  // Aggregate supply
  const supplyCombined = useMemo(() => {
    return synthPV.map((pv, i) => pv + (synthWind[i] || 0) + (synthCHP[i] || 0));
  }, [synthPV, synthWind, synthCHP]);

  // Battery aggregation (sum specs)
  const battAgg = useMemo(() => {
    const bats = supplyAssets.filter((s) => s.type === "Battery");
    if (bats.length === 0) return null;
    const capacityKwh = bats.reduce((s, b) => s + Number(b.capacityKwh || 0), 0);
    const pchgKw = bats.reduce((s, b) => s + Number(b.pchgKw || 0), 0);
    const pdisKw = bats.reduce((s, b) => s + Number(b.pdisKw || 0), 0);
    const rtEff = bats.length > 0 ? bats.reduce((s, b) => s + Number(b.rtEff || 90), 0) / bats.length : 90;
    const socMinPct = Math.min(...bats.map((b) => Number(b.socMinPct ?? 10)));
    const socMaxPct = Math.max(...bats.map((b) => Number(b.socMaxPct ?? 90)));
    return { capacityKwh, pchgKw, pdisKw, rtEff, socMinPct, socMaxPct };
  }, [supplyAssets]);

  // ===== Dispatch Heuristic =====
  const result = useMemo(() => {
    const D = synthLoad;
    const S = supplyCombined;
    const n = D.length;

    // Battery params
    const eta_rt = clamp((battAgg?.rtEff ?? 92) / 100, 0.5, 1.0);
    const eta_c = Math.sqrt(eta_rt);
    const eta_d = Math.sqrt(eta_rt);
    const C = battAgg?.capacityKwh ?? 0;
    const socMin = ((battAgg?.socMinPct ?? 10) / 100) * C;
    const socMax = ((battAgg?.socMaxPct ?? 90) / 100) * C;
    const pchgMax = battAgg?.pchgKw ?? 0;
    const pdisMax = battAgg?.pdisKw ?? 0;

    const ts = [];
    let soc = socMin; // start at min
    let eDemand = 0,
      eOnsiteUsed = 0,
      eOnsiteGen = 0;
    let sumImport = 0,
      sumExport = 0,
      sumCurtail = 0;
    let sumDischarge = 0;

    for (let i = 0; i < n; i++) {
      const load = D[i];
      const gen = S[i];
      eDemand += load * deltaH;
      eOnsiteGen += gen * deltaH;

      const direct = Math.min(load, gen);
      let surplus = gen - direct;
      let residualLoad = load - direct;

      // charge with surplus
      let pchg = Math.min(surplus, pchgMax);
      const room = C > 0 ? (socMax - soc) / (eta_c * deltaH) : 0;
      pchg = Math.max(0, Math.min(pchg, room));
      soc = soc + eta_c * pchg * deltaH;
      surplus = surplus - pchg;

      // discharge if needed
      let pdis = Math.min(residualLoad, pdisMax);
      const available = C > 0 ? ((soc - socMin) * eta_d) / deltaH : 0;
      pdis = Math.max(0, Math.min(pdis, available));
      soc = soc - (pdis / eta_d) * deltaH;
      residualLoad = residualLoad - pdis;

      const gridImport = Math.max(0, residualLoad);
      const gridExport = Math.max(0, surplus);
      const curtail = 0;

      sumImport += gridImport * deltaH;
      sumExport += gridExport * deltaH;
      sumCurtail += curtail * deltaH;
      eOnsiteUsed += (direct + pdis) * deltaH;
      sumDischarge += pdis * deltaH;

      ts.push({ ts: i, load, pv: synthPV[i] || 0, wind: synthWind[i] || 0, chp: synthCHP[i] || 0, gen, soc, import: gridImport, export: gridExport, pchg, pdis });
    }

    const matchRate = eDemand > 0 ? eOnsiteUsed / eDemand : 0;
    const selfConsumption = eOnsiteGen > 0 ? eOnsiteUsed / eOnsiteGen : 0;
    const selfSufficiency = matchRate;
    const curtPct = eOnsiteGen > 0 ? sumCurtail / eOnsiteGen : 0;

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
    };

    return { ts, kpi };
  }, [synthLoad, supplyCombined, battAgg, deltaH, synthPV, synthWind, synthCHP]);

  // ===== UI =====
  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Renewable Matching Simulator</h2>
          <div className="text-sm text-gray-500">Build demand & supply as assets. KPIs and charts update instantly.</div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-xl px-3 py-2 text-sm bg-white/80"
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__") return;
              if (v === "Residential") {
                setDemandAssets([
                  { id: 1, name: "Baseload", kind: "Base", magnitude: 12, unit: "kW", api: "", note: "Base load" },
                  { id: 2, name: "Morning Peak", kind: "Morning Peak", magnitude: 3, unit: "kW", api: "", note: "Morning" },
                  { id: 3, name: "Evening Peak", kind: "Evening Peak", magnitude: 6, unit: "kW", api: "", note: "Evening" },
                  { id: 4, name: "Noise", kind: "Noise", magnitude: 5, unit: "%", api: "", note: "Noise" },
                ]);
                setSupplyAssets([{ id: 101, name: "PV", type: "PV", capacity: 10, unit: "kWdc", api: "" }, { id: 150, name: "Battery", type: "Battery", capacityKwh: 20, pchgKw: 7, pdisKw: 7, rtEff: 92, socMinPct: 10, socMaxPct: 90, api: "" }]);
              } else if (v === "Commercial") {
                setDemandAssets([
                  { id: 1, name: "Baseload", kind: "Base", magnitude: 80, unit: "kW", api: "", note: "Base load" },
                  { id: 2, name: "Morning Peak", kind: "Morning Peak", magnitude: 25, unit: "kW", api: "", note: "Morning" },
                  { id: 3, name: "Evening Peak", kind: "Evening Peak", magnitude: 35, unit: "kW", api: "", note: "Evening" },
                  { id: 4, name: "Noise", kind: "Noise", magnitude: 5, unit: "%", api: "", note: "Noise" },
                ]);
                setSupplyAssets([{ id: 101, name: "PV", type: "PV", capacity: 120, unit: "kWdc", api: "" }, { id: 150, name: "Battery", type: "Battery", capacityKwh: 300, pchgKw: 100, pdisKw: 100, rtEff: 92, socMinPct: 10, socMaxPct: 90, api: "" }]);
              } else if (v === "Industrial") {
                setDemandAssets([
                  { id: 1, name: "Baseload", kind: "Base", magnitude: 300, unit: "kW", api: "", note: "Base load" },
                  { id: 2, name: "Morning Peak", kind: "Morning Peak", magnitude: 60, unit: "kW", api: "", note: "Morning" },
                  { id: 3, name: "Evening Peak", kind: "Evening Peak", magnitude: 40, unit: "kW", api: "", note: "Evening" },
                  { id: 4, name: "Noise", kind: "Noise", magnitude: 5, unit: "%", api: "", note: "Noise" },
                ]);
                setSupplyAssets([
                  { id: 101, name: "PV", type: "PV", capacity: 500, unit: "kWdc", api: "" },
                  { id: 102, name: "Wind", type: "Wind", capacity: 300, unit: "kW", api: "" },
                  { id: 150, name: "Battery", type: "Battery", capacityKwh: 1000, pchgKw: 300, pdisKw: 300, rtEff: 92, socMinPct: 10, socMaxPct: 90, api: "" },
                ]);
              }
              e.target.value = "__";
            }}
            defaultValue="__"
            aria-label="Presets"
          >
            <option value="__" disabled>
              Presets
            </option>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Industrial</option>
          </select>
          <button className="border rounded-xl px-3 py-2 text-sm hover:bg-gray-50" onClick={() => window.location.reload()}>Reset</button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        <Panel title="Simulation" subtitle="Time horizon and resolution">
          <NumberField label="Horizon" value={params.horizonHours || 168} onChange={(v) => setParams((p) => ({ ...p, horizonHours: v }))} unit="hours" min={1} max={24 * 30} />
          <NumberField label="Timestep" value={params.stepMinutes || 15} onChange={(v) => setParams((p) => ({ ...p, stepMinutes: v }))} unit="minutes" min={1} max={60} />
        </Panel>

        {/* Demand Assets */}
        <Panel title="Demand Assets" subtitle="Type · API · Notes (Base, Morning, Evening, Noise)">
          <div className="flex gap-2 mb-2">
            <button className="border rounded-xl px-2 py-1 text-xs" onClick={addDemand}>Add Asset</button>
          </div>
          <div className="grid gap-3">
            {demandAssets.map((d) => (
              <div key={d.id} className="border rounded-xl p-3 bg-white/70">
                <div className="flex items-center justify-between">
                  <input className="text-sm font-medium bg-transparent" value={d.name} onChange={(e) => updateDemand(d.id, { name: e.target.value })} />
                  <button className="text-xs text-red-500" onClick={() => removeDemand(d.id)}>Remove</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <select className="border rounded-lg px-2 py-1 text-sm" value={d.kind} onChange={(e) => updateDemand(d.id, { kind: e.target.value })}>
                    <option>Base</option>
                    <option>Morning Peak</option>
                    <option>Evening Peak</option>
                    <option>Noise</option>
                    <option>Device</option>
                    <option>HVAC</option>
                    <option>Baseload</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input className="border rounded-lg px-2 py-1 text-sm w-full" type="number" value={d.magnitude} onChange={(e) => updateDemand(d.id, { magnitude: Number(e.target.value) })} />
                    <select className="border rounded-lg px-2 py-1 text-sm" value={d.unit} onChange={(e) => updateDemand(d.id, { unit: e.target.value })}>
                      <option>kW</option>
                      <option>%</option>
                    </select>
                  </div>
                  <input className="border rounded-lg px-2 py-1 text-sm" placeholder="API endpoint" value={d.api} onChange={(e) => updateDemand(d.id, { api: e.target.value })} />
                  <input className="border rounded-lg px-2 py-1 text-sm" placeholder="Notes" value={d.note} onChange={(e) => updateDemand(d.id, { note: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Supply Assets */}
        <Panel title="Supply Assets" subtitle="PV · Wind · CHP · Battery (Capacity · API · Manual Battery)">
          <div className="flex flex-wrap gap-2 mb-2">
            <button className="border rounded-xl px-2 py-1 text-xs" onClick={() => addSupply("PV")}>Add PV</button>
            <button className="border rounded-xl px-2 py-1 text-xs" onClick={() => addSupply("Wind")}>Add Wind</button>
            <button className="border rounded-xl px-2 py-1 text-xs" onClick={() => addSupply("CHP")}>Add CHP</button>
            <button className="border rounded-xl px-2 py-1 text-xs" onClick={() => addSupply("Battery")}>Add Battery</button>
          </div>
          <div className="grid gap-3">
            {supplyAssets.map((s) => (
              <div key={s.id} className="border rounded-xl p-3 bg-white/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">{s.type}</span>
                    <input className="text-sm font-medium bg-transparent" value={s.name} onChange={(e) => updateSupply(s.id, { name: e.target.value })} />
                  </div>
                  <button className="text-xs text-red-500" onClick={() => removeSupply(s.id)}>Remove</button>
                </div>

                {/* Common fields */}
                {s.type !== "Battery" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <input className="border rounded-lg px-2 py-1 text-sm w-full" type="number" value={s.capacity || 0} onChange={(e) => updateSupply(s.id, { capacity: Number(e.target.value) })} />
                      <select className="border rounded-lg px-2 py-1 text-sm" value={s.unit || (s.type === "PV" ? "kWdc" : "kW")} onChange={(e) => updateSupply(s.id, { unit: e.target.value })}>
                        <option>{s.type === "PV" ? "kWdc" : "kW"}</option>
                        <option>kW</option>
                      </select>
                    </div>
                    <input className="border rounded-lg px-2 py-1 text-sm" placeholder="API endpoint" value={s.api || ""} onChange={(e) => updateSupply(s.id, { api: e.target.value })} />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 grid-cols-2 gap-2 mt-2">
                    <NumberInline label="Capacity" unit="kWh" value={s.capacityKwh} onChange={(v) => updateSupply(s.id, { capacityKwh: v })} />
                    <NumberInline label="Max Charge" unit="kW" value={s.pchgKw} onChange={(v) => updateSupply(s.id, { pchgKw: v })} />
                    <NumberInline label="Max Discharge" unit="kW" value={s.pdisKw} onChange={(v) => updateSupply(s.id, { pdisKw: v })} />
                    <NumberInline label="Round-trip Eff." unit="%" value={s.rtEff} onChange={(v) => updateSupply(s.id, { rtEff: v })} />
                    <NumberInline label="SOC Min" unit="%" value={s.socMinPct} onChange={(v) => updateSupply(s.id, { socMinPct: v })} />
                    <NumberInline label="SOC Max" unit="%" value={s.socMaxPct} onChange={(v) => updateSupply(s.id, { socMaxPct: v })} />
                    <input className="border rounded-lg px-2 py-1 text-sm md:col-span-3" placeholder="API endpoint" value={s.api || ""} onChange={(e) => updateSupply(s.id, { api: e.target.value })} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* KPIs */}
      <div className="mt-6">
        <KPIGrid kpi={result.kpi} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <ChartCard title="Load · PV · Wind · CHP · Import/Export (kW)">
          <TimeseriesChart
            data={result.ts}
            series={[
              { dataKey: "load", name: "Load" },
              { dataKey: "pv", name: "PV" },
              { dataKey: "wind", name: "Wind" },
              { dataKey: "chp", name: "CHP" },
              { dataKey: "import", name: "Import" },
              { dataKey: "export", name: "Export" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Battery SOC (kWh) · Charge/Discharge (kW)">
          <TimeseriesChart
            data={result.ts}
            series={[
              { dataKey: "soc", name: "SOC" },
              { dataKey: "pchg", name: "Pchg" },
              { dataKey: "pdis", name: "Pdis" },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

// Inline number control used in Battery cards
function NumberInline({ label, unit, value, onChange, min, max, step = 1 }) {
  return (
    <label className="text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-700">{label}</span>
        {unit && <span className="text-gray-400 text-xs">{unit}</span>}
      </div>
      <input
        className="w-full border rounded-xl px-2 py-1 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}


