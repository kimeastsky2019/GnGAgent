import React from 'react';

export default function SitesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🗺️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sites Management</h2>
            <p className="text-slate-400">Manage your NanoGrid sites and portfolios here.</p>
        </div>
    );
}
