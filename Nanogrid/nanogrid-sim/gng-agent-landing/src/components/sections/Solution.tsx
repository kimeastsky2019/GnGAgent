"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brain, Database, Server, FileText, Settings, Shield, BarChart3 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function Solution() {
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: triggerRef.current,
                    start: "top top",
                    end: "+=2000",
                    scrub: 1,
                    pin: true,
                    anticipatePin: 1,
                },
            });

            // Step 1
            tl.fromTo(".step-1", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 });
            // Step 2
            tl.fromTo(".step-2", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 });
            // Step 3
            tl.fromTo(".step-3", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 });

            // Highlight connection
            tl.to(".process-line", { width: "100%", duration: 2, ease: "none" }, 0);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative bg-slate-950 text-white">
            <div ref={triggerRef} className="h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 h-full flex flex-col justify-center">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                            NanoGrid Studio 워크플로우
                        </h2>
                        <p className="text-slate-400 text-lg">
                            데이터 업로드부터 리포트까지, 3단계로 끝나는 에너지 설계
                        </p>
                    </div>

                    <div className="relative max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Connecting Line (Desktop) */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 hidden md:block -z-10 -translate-y-1/2">
                            <div className="process-line h-full w-0 bg-cyan-500"></div>
                        </div>

                        {/* Step 1 */}
                        <div className="step-1 relative p-8 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-sm flex flex-col items-center text-center hover:border-cyan-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-500 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                <FileText className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Data Upload</h3>
                            <p className="text-slate-400 text-sm">
                                CSV/AMI 데이터를 업로드하면<br />AI가 부하 패턴을 자동 분석합니다.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="step-2 relative p-8 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-sm flex flex-col items-center text-center hover:border-purple-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-purple-500 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <Settings className="w-8 h-8 text-purple-400 animate-spin-slow" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Simulation Engine</h3>
                            <p className="text-slate-400 text-sm">
                                PV·ESS·요금·탄소 복합 시뮬레이션으로<br />최적의 용량과 운전 스케줄을 찾습니다.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="step-3 relative p-8 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-sm flex flex-col items-center text-center hover:border-green-500/50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-green-500 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <BarChart3 className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Decision Report</h3>
                            <p className="text-slate-400 text-sm">
                                시나리오별 경제성/탄소 감축 효과를<br />비교 분석한 리포트를 생성합니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 z-0"></div>
            </div>
        </section>
    );
}

function AgentCard({ name, desc }: { name: string; desc: string }) {
    return null; // Not used
}
