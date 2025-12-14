import React from 'react';
import { ArrowUpRight, Zap, Leaf, DollarSign, Activity } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Total Energy Cost"
                    value="₩ 124.5M"
                    change="-12.3%"
                    trend="down"
                    icon={DollarSign}
                    color="text-cyan-400"
                />
                <KpiCard
                    title="CO2 Reduction"
                    value="45.2 tons"
                    change="+8.1%"
                    trend="up"
                    icon={Leaf}
                    color="text-green-400"
                />
                <KpiCard
                    title="Self Sufficiency"
                    value="68.5%"
                    change="+2.4%"
                    trend="up"
                    icon={Zap}
                    color="text-yellow-400"
                />
                <KpiCard
                    title="Active Sites"
                    value="12"
                    change="All Normal"
                    trend="neutral"
                    icon={Activity}
                    color="text-purple-400"
                />
            </div>

            {/* Recent Simulations */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Recent Simulations</h2>
                    <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                <th className="py-3 font-medium">Project Name</th>
                                <th className="py-3 font-medium">Scenario</th>
                                <th className="py-3 font-medium">Date</th>
                                <th className="py-3 font-medium">Savings</th>
                                <th className="py-3 font-medium">Status</th>
                                <th className="py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300">
                            {[1, 2, 3, 4].map((i) => (
                                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 font-medium text-white">Campus Building A-{i}</td>
                                    <td className="py-4">PV + ESS Optimization</td>
                                    <td className="py-4 text-slate-500">2024-05-{10 + i}</td>
                                    <td className="py-4 text-green-400 font-bold">₩ 12.5M/yr</td>
                                    <td className="py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="text-slate-400 hover:text-white">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, change, trend, icon: Icon, color }: any) {
    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-slate-800 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/10 text-green-400' :
                        trend === 'down' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                    {change}
                </div>
            </div>
            <div className="text-slate-400 text-sm font-medium mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
