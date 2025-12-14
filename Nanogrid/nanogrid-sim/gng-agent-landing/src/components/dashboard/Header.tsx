import React from 'react';
import { Bell, Search } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search sites..."
                        className="bg-slate-800 border border-slate-700 text-sm text-white rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-cyan-500 w-64"
                    />
                </div>
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>
        </header>
    );
}
