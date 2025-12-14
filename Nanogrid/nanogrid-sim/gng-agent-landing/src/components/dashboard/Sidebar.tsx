import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Zap, FileText, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sites', href: '/dashboard/sites', icon: Map },
    { name: 'Simulator', href: '/dashboard/simulator', icon: Zap },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    // In a real app, usePathname() would be used here, but for now we might mock it or just use simple links
    // const pathname = usePathname(); 

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                    <Sparkles className="w-5 h-5" />
                    <span>NanoGrid Studio</span>
                </div>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            "text-slate-400 hover:text-white hover:bg-slate-800",
                            // item.href === pathname && "bg-cyan-500/10 text-cyan-400" 
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        DK
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Dongho Kim</p>
                        <p className="text-xs text-slate-500 truncate">Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
