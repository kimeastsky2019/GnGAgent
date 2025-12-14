'use client';

import React, { useState, useMemo } from 'react';
import { DEFAULT_PARAMS, SimParams, runSimulation, SimResult } from '@/lib/simulator-engine';
import { ArrowRight, ArrowLeft, Upload, CheckCircle, BarChart2, Zap, Battery, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import Papa from 'papaparse';
import Image from 'next/image';
import ClimateCard from '@/components/dashboard/ClimateCard';

const STEPS = [
    { id: 1, title: 'Site & Period' },
    { id: 2, title: 'Climate' },
    { id: 3, title: 'Load Data' },
    { id: 4, title: 'PV & ESS' },
    { id: 5, title: 'Tariff & CO2' },
    { id: 6, title: 'Results' },
];

export default function SimulatorPage() {
    const [step, setStep] = useState(1);
    const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
    const [results, setResults] = useState<{ [key: string]: SimResult } | null>(null);
    const [customLoad, setCustomLoad] = useState<number[] | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleNext = () => {
        if (step < 6) setStep(step + 1);
        if (step === 5) runScenarios();
    };
    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as string[][];
                const numbers: number[] = [];

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (row.length === 0) continue;
                    const val = parseFloat(row[row.length - 1]);
                    if (!isNaN(val)) {
                        numbers.push(val);
                    }
                }

                if (numbers.length > 0) {
                    setCustomLoad(numbers);
                    console.log(`Loaded ${numbers.length} points`);
                }
            },
            header: false
        });
    };

    const runScenarios = () => {
        const r1 = runSimulation(params, customLoad || undefined, { battCapacityKwh: 0 });
        const r2 = runSimulation(params, customLoad || undefined);
        const r3 = runSimulation(params, customLoad || undefined, {
            pvKwDc: params.pvKwDc * 1.5,
            battCapacityKwh: params.battCapacityKwh * 1.5
        });

        setResults({
            'pv_only': r1,
            'pv_batt': r2,
            'mixed': r3
        });
    };

    return (
        <div className="relative min-h-screen -m-6 p-6 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-10"
                    priority
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Wizard Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        <Zap className="w-8 h-8 text-cyan-400" />
                        NanoGrid Simulator
                    </h1>
                    <div className="flex items-center justify-between relative px-4">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
                        {STEPS.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-950 px-4 rounded-xl border border-slate-900 z-10">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg",
                                    step >= s.id ? "bg-cyan-500 text-slate-950 shadow-cyan-500/25 scale-110" : "bg-slate-800 text-slate-500"
                                )}>
                                    {step > s.id ? <CheckCircle className="w-6 h-6" /> : s.id}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    step >= s.id ? "text-cyan-400" : "text-slate-600"
                                )}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wizard Content */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 min-h-[500px] shadow-2xl relative overflow-hidden">
                    {/* Decorative gradients */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

                    {step === 1 && (
                        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Let's start your project</h2>
                                <p className="text-slate-400">Define the basic parameters for your simulation.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Project Name" placeholder="e.g. Campus Building A" />
                                <Field label="Location" placeholder="Seoul, Korea" />
                                <Field label="Simulation Horizon (Hours)" type="number" value={params.horizonHours}
                                    onChange={v => setParams({ ...params, horizonHours: Number(v) })} />
                                <Field label="Time Step (Minutes)" type="number" value={params.stepMinutes}
                                    onChange={v => setParams({ ...params, stepMinutes: Number(v) })} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <ClimateCard />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Load Profile</h2>
                                <p className="text-slate-400">Upload your own data or generate a synthetic load profile.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Upload Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-cyan-400" /> Upload CSV
                                    </h3>
                                    <label className="block p-8 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                        {fileName ? (
                                            <>
                                                <FileText className="w-12 h-12 mb-4 text-cyan-400" />
                                                <p className="font-medium text-white">{fileName}</p>
                                                <p className="text-xs text-green-400 mt-2">File Loaded</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 mb-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                                <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">Click to Upload</p>
                                                <p className="text-xs mt-2">Format: timestamp, value (kW)</p>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* Synthetic Section */}
                                <div className="space-y-4 border-l border-slate-800 pl-8">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-purple-400" /> Synthetic Generator
                                    </h3>
                                    <div className="space-y-6">
                                        <SliderField label="Base Load (kW)" value={params.loadBaseKw} min={10} max={500}
                                            onChange={v => setParams({ ...params, loadBaseKw: v })} />
                                        <SliderField label="Morning Peak (kW)" value={params.loadMorningPeakKw} min={0} max={200}
                                            onChange={v => setParams({ ...params, loadMorningPeakKw: v })} />
                                        <SliderField label="Evening Peak (kW)" value={params.loadEveningPeakKw} min={0} max={200}
                                            onChange={v => setParams({ ...params, loadEveningPeakKw: v })} />
                                        <SliderField label="Noise (%)" value={params.loadNoisePct} min={0} max={20}
                                            onChange={v => setParams({ ...params, loadNoisePct: v })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">System Configuration</h2>
                                <p className="text-slate-400">Configure your PV and ESS specifications.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6 bg-slate-950/50 p-6 rounded-xl border border-yellow-500/20">
                                    <h3 className="flex items-center gap-2 text-yellow-400 font-bold text-lg"><Zap className="w-5 h-5" /> PV System</h3>
                                    <Field label="Capacity (kWp)" type="number" value={params.pvKwDc}
                                        onChange={v => setParams({ ...params, pvKwDc: Number(v) })} />
                                    <SliderField label="Weather Variance (%)" value={params.pvWeatherPct} min={0} max={50}
                                        onChange={v => setParams({ ...params, pvWeatherPct: v })} />
                                </div>
                                <div className="space-y-6 bg-slate-950/50 p-6 rounded-xl border border-green-500/20">
                                    <h3 className="flex items-center gap-2 text-green-400 font-bold text-lg"><Battery className="w-5 h-5" /> ESS System</h3>
                                    <Field label="Capacity (kWh)" type="number" value={params.battCapacityKwh}
                                        onChange={v => setParams({ ...params, battCapacityKwh: Number(v) })} />
                                    <Field label="Max Charge (kW)" type="number" value={params.battPchgKw}
                                        onChange={v => setParams({ ...params, battPchgKw: Number(v) })} />
                                    <Field label="Max Discharge (kW)" type="number" value={params.battPdisKw}
                                        onChange={v => setParams({ ...params, battPdisKw: Number(v) })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Economic Parameters</h2>
                                <p className="text-slate-400">Set electricity tariffs and carbon factors.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <Field label="Peak Price (KRW/kWh)" type="number" value={params.pricePeak}
                                    onChange={v => setParams({ ...params, pricePeak: Number(v) })} />
                                <Field label="Off-Peak Price (KRW/kWh)" type="number" value={params.priceOff}
                                    onChange={v => setParams({ ...params, priceOff: Number(v) })} />
                                <Field label="Feed-in Tariff (KRW/kWh)" type="number" value={params.feedin}
                                    onChange={v => setParams({ ...params, feedin: Number(v) })} />
                                <Field label="Grid CO2 Factor (g/kWh)" type="number" value={params.co2_g_per_kwh}
                                    onChange={v => setParams({ ...params, co2_g_per_kwh: Number(v) })} />
                            </div>
                        </div>
                    )}

                    {step === 6 && results && (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                            <div className="grid grid-cols-3 gap-4">
                                {Object.entries(results).map(([key, res]) => (
                                    <div key={key} className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors group">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center justify-between">
                                            {key.replace('_', ' ')}
                                            {key === 'pv_batt' && <span className="text-xs bg-cyan-500 text-slate-950 px-2 py-0.5 rounded font-bold">Recommended</span>}
                                        </h3>

                                        <div className="mb-6">
                                            <div className="text-4xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                                {res.kpi.self_sufficiency.toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-slate-500">Self Sufficiency</div>
                                        </div>

                                        <div className="space-y-3 text-sm border-t border-slate-700 pt-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Net Cost</span>
                                                <span className="text-white font-mono font-bold">₩{(res.kpi.net_cost_krw / 1000000).toFixed(1)}M</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 flex items-center gap-2"><Zap className="w-3 h-3" /> CO2</span>
                                                <span className="text-white font-mono font-bold">{(res.kpi.emissions_kg / 1000).toFixed(1)}t</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-[400px] w-full bg-slate-950/50 rounded-xl p-6 border border-slate-800">
                                <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                                    Energy Balance (PV + Battery Scenario)
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={results['pv_batt'].ts}>
                                        <defs>
                                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="ts" stroke="#64748b" tickFormatter={(v) => `${v}h`} />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend iconType="circle" />
                                        <Area type="monotone" dataKey="load" name="Load (kW)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                                        <Area type="monotone" dataKey="pv" name="PV Gen (kW)" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>

                    {step < 6 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 flex items-center shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-1"
                        >
                            Next Step
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button className="px-6 py-3 rounded-xl border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">
                                Export Report
                            </button>
                            <button className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors shadow-lg">
                                Save Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, type = "text", placeholder, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange && onChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
        </div>
    );
}

function SliderField({ label, value, min, max, onChange }: any) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-400">{label}</label>
                <span className="text-sm font-bold text-cyan-400">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={e => onChange && onChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
        </div>
    );
}
