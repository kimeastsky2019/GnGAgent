import React from 'react'

export default function KPIGrid({ kpi = {} }) {
  if (!kpi || Object.keys(kpi).length === 0) {
    return <div className="text-sm text-gray-500">KPI가 없습니다.</div>
  }
  const fmt = (v) => typeof v === 'number' ? v.toFixed(3) : String(v)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(kpi).map(([key, val]) => (
        <div key={key} className="border rounded-2xl p-4 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-gray-500">{key}</div>
          <div className="text-2xl font-semibold">{fmt(val)}</div>
        </div>
      ))}
    </div>
  )
}
