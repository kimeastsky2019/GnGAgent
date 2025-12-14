import React from "react";

export default function CTA() {
    return (
        <section className="py-24 bg-slate-900 text-white">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                        지금, 우리 조직에 어떤 에이전트가 필요할까요?
                    </h2>
                    <p className="text-slate-400 text-lg">
                        AI 바우처, 단순 과제 수행으로 끝나지 않게 설계하겠습니다.
                    </p>
                </div>

                <form className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">이름 / 직함</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" placeholder="홍길동 / 팀장" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">회사명</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" placeholder="(주)지앤지" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">연락처</label>
                            <input type="tel" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" placeholder="010-1234-5678" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">이메일</label>
                            <input type="email" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" placeholder="example@gng.com" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">관심 분야 (중복 선택 가능)</label>
                        <div className="flex flex-wrap gap-4">
                            {["에너지/태양광", "제조/설비", "스마트시티/환경", "기타"].map((item) => (
                                <label key={item} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700" />
                                    <span className="text-slate-300">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-300 mb-2">프로젝트/과제 간단 설명</label>
                        <textarea className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500 h-32" placeholder="현재 겪고 있는 문제나 도입하고 싶은 AI 서비스에 대해 적어주세요."></textarea>
                    </div>

                    <div className="text-center">
                        <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors w-full md:w-auto">
                            무료 진단 및 상담 신청하기
                        </button>
                        <p className="mt-4 text-sm text-slate-500">
                            제출 후 48시간 이내 담당 에이전트가 연락드립니다.
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
}
