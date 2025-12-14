import React from "react";

export default function Trust() {
    return (
        <section className="py-24 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-12">
                    지앤지가 하면 다릅니다
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="p-6">
                        <div className="text-4xl font-bold text-blue-600 mb-2">30+</div>
                        <p className="text-slate-700 font-bold">AI/데이터 프로젝트 수행</p>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
                        <p className="text-slate-700 font-bold">재계약 및 유지보수율</p>
                    </div>
                    <div className="p-6">
                        <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                        <p className="text-slate-700 font-bold">에이전트 상시 모니터링</p>
                    </div>
                </div>

                <div className="opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholder for Logos */}
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
                        <span className="text-xl font-bold text-slate-400">Public Institution A</span>
                        <span className="text-xl font-bold text-slate-400">Energy Corp B</span>
                        <span className="text-xl font-bold text-slate-400">Smart City C</span>
                        <span className="text-xl font-bold text-slate-400">Manufacturing D</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
