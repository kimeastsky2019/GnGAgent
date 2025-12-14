import React from "react";
import { Sun, Factory, Building2, ArrowRight } from "lucide-react";

export default function UseCase() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        누가 사용하면 좋을까요?
                    </h2>
                    <p className="text-lg text-slate-700 font-medium">
                        에너지 효율화가 필요한 모든 현장에서 활용 가능합니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cases.map((item, index) => (
                        <div
                            key={index}
                            className={`p-8 rounded-2xl border ${item.border} bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col`}
                        >
                            <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <div className="mb-3">
                                <span className={`text-xs font-extrabold ${item.color} uppercase tracking-widest`}>
                                    {item.industry}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                {item.title}
                            </h3>
                            <p className="text-slate-700 mb-8 flex-grow leading-relaxed font-medium">
                                {item.desc}
                            </p>
                            <button className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center group">
                                활용 사례 보기
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const cases = [
    {
        icon: Factory,
        industry: "ESCO / 에너지 사업자",
        title: "사업 제안 및 효과 검증",
        desc: "다수 사이트의 사전·사후 절감 효과를 시뮬레이션하여 고객을 설득합니다.",
        color: "text-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-100",
    },
    {
        icon: Building2,
        industry: "대학교 / 캠퍼스",
        title: "RE100 캠퍼스 구축",
        desc: "태양광과 ESS를 도입하여 에너지 자립률을 높이고 탄소 배출을 줄입니다.",
        color: "text-green-500",
        bg: "bg-green-50",
        border: "border-green-100",
    },
    {
        icon: Sun,
        industry: "지자체 / 공공기관",
        title: "규제특구 실증 과제",
        desc: "스마트시티 및 마이크로그리드 실증 과제 제안서에 필요한 데이터를 생성합니다.",
        color: "text-purple-500",
        bg: "bg-purple-50",
        border: "border-purple-100",
    },
];
