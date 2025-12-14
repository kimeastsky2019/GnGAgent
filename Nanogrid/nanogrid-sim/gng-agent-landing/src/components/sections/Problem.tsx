import React from "react";
import { AlertCircle, Cloud, Database, BarChart3 } from "lucide-react";

export default function Problem() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                        에너지 설계, <br className="hidden md:block" />
                        왜 이렇게 복잡할까요?
                    </h2>
                    <p className="text-lg text-slate-700 font-medium">
                        나노그리드 도입을 주저하게 만드는 4가지 장벽, 스튜디오가 해결합니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {problems.map((item, index) => (
                        <div
                            key={index}
                            className="group p-8 rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-cyan-50 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-600 transition-all duration-300">
                                <item.icon className="w-7 h-7 text-cyan-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                {item.title}
                            </h3>
                            <p className="text-slate-700 mb-6 min-h-[3rem] leading-relaxed text-sm">{item.desc}</p>
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-sm font-bold text-cyan-600 flex items-center group-hover:translate-x-1 transition-transform">
                                    → {item.solution}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const problems = [
    {
        icon: AlertCircle,
        title: "부하 데이터 해석",
        desc: "엑셀과 차트만으로는 복잡한 부하 패턴을 한눈에 파악하기 어렵습니다.",
        solution: "AI가 패턴 자동 분석",
    },
    {
        icon: Cloud,
        title: "시나리오 비교",
        desc: "PV·ESS 용량별 수십 가지 조합을 일일이 계산하는 건 불가능합니다.",
        solution: "원클릭 시나리오 비교",
    },
    {
        icon: BarChart3,
        title: "설득 자료 작성",
        desc: "의사결정자를 위한 예상 절감액 리포트와 그래프 작업에 시간이 너무 많이 듭니다.",
        solution: "리포트 자동 생성",
    },
    {
        icon: Database,
        title: "복잡한 요금제",
        desc: "계절별/시간대별 요금제(TOU)와 탄소 배출량을 정확히 반영하기 어렵습니다.",
        solution: "정밀한 요금 계산 엔진",
    },
];
