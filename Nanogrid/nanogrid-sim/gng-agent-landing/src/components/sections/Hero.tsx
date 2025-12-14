'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            gsap.from(textRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });

            gsap.from(dashboardRef.current, {
                y: 100,
                opacity: 0,
                duration: 1.2,
                delay: 0.3,
                ease: "power3.out"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden bg-slate-950">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-bg.png"
                    alt="NanoGrid Background"
                    fill
                    className="object-cover opacity-20"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 text-center">
                <div ref={textRef} className="max-w-4xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8 animate-pulse">
                        <Zap className="w-4 h-4" />
                        <span>NanoGrid Digital Twin Studio</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
                        나노그리드, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                            시뮬레이션으로 먼저 설계하세요.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        복잡한 엑셀 계산은 그만. <br />
                        디지털 트윈 스튜디오에서 1시간 안에 최적의 에너지 설계를 완료하세요.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard/simulator"
                            className="group px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-lg transition-all flex items-center shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                        >
                            시뮬레이터 체험하기
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition-all border border-slate-700 hover:border-slate-600">
                            데모 계정 신청
                        </button>
                    </div>
                </div>

                {/* Dashboard Mockup */}
                <div ref={dashboardRef} className="relative max-w-6xl mx-auto perspective-1000">
                    <div className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
                        {/* Browser Header */}
                        <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <div className="flex-1 flex justify-center">
                                <div className="px-4 py-1 rounded-md bg-slate-950/50 text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <span className="text-green-500">🔒</span>
                                    studio.gngmeta.com/design
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Content Mockup */}
                        <div className="p-6 grid grid-cols-12 gap-6 bg-slate-950/50 backdrop-blur-sm">
                            {/* Sidebar */}
                            <div className="col-span-2 space-y-4">
                                <div className="h-8 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="h-6 w-full bg-slate-800/50 rounded"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Area */}
                            <div className="col-span-10 space-y-6">
                                <div className="flex justify-between">
                                    <div className="h-8 w-1/3 bg-slate-800 rounded"></div>
                                    <div className="h-8 w-1/4 bg-cyan-500/20 rounded"></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-slate-800/50 rounded-xl border border-slate-800 p-4 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="h-4 w-1/2 bg-slate-700 rounded mb-2"></div>
                                            <div className="h-8 w-3/4 bg-slate-600 rounded"></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-64 bg-slate-800/30 rounded-xl border border-slate-800 flex items-end justify-between p-4 gap-2">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-full bg-gradient-to-t from-cyan-500/50 to-purple-500/50 rounded-t-sm"
                                            style={{ height: `${Math.random() * 80 + 20}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
