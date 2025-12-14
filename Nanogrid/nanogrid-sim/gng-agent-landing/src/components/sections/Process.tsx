import React from "react";

export default function Process() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        복잡한 에너지 설계, <br className="md:hidden" />3단계로 끝내세요
                    </h2>
                    <p className="text-lg text-slate-700 font-medium">
                        전문 지식이 없어도, 데이터만 있으면 충분합니다.
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Connecting Line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200 md:left-1/2 md:-translate-x-1/2"></div>

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`relative flex flex-col md:flex-row items-start md:items-center ${index % 2 === 0 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Dot */}
                                <div className="absolute left-0 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 w-10 h-10 bg-white border-4 border-cyan-500 rounded-full z-10 flex items-center justify-center shadow-md">
                                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                </div>

                                {/* Content */}
                                <div className="ml-12 md:ml-0 md:w-1/2 md:px-12">
                                    <div className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${index % 2 === 0 ? "md:text-left" : "md:text-right"
                                        }`}>
                                        <span className="inline-block px-3 py-1 bg-cyan-50 text-cyan-600 text-xs font-bold rounded-full mb-2">
                                            STEP {index + 1}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-700 font-medium leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

const steps = [
    {
        title: "데이터 업로드",
        desc: "보유하신 부하 데이터(CSV)를 업로드하거나, 표준 부하 패턴을 선택합니다.",
    },
    {
        title: "시뮬레이션 설정",
        desc: "PV, ESS 용량, 요금제 등 주요 변수를 설정하고 시나리오를 생성합니다.",
    },
    {
        title: "리포트 확인",
        desc: "경제성 분석(ROI), 탄소 감축량 등 핵심 지표가 담긴 리포트를 확인합니다.",
    },
    {
        title: "실제 도입",
        desc: "검증된 데이터를 바탕으로 실제 구축 및 운영을 시작합니다.",
    },
];
