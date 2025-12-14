import React from 'react';

export default function ReportsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📄</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Reports Center</h2>
            <p className="text-slate-400">Generate and download detailed simulation reports.</p>
        </div>
    );
}
