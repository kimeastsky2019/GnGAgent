import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

export default function TimeseriesChart({ data = [], series = [], height = 280 }) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.dataKey} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.6}/>
                <stop offset="95%" stopOpacity={0.05}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} strokeOpacity={0.9} fillOpacity={0.2} fill={`url(#g${i})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
