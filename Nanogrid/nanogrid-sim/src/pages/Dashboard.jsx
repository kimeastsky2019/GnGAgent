import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">대시보드</h2>
      <p className="text-sm text-gray-600">상단 메뉴의 [시뮬레이터]에서 CSV 부하 업로드·요금/CO₂ 설정·시나리오 비교·리포트 다운로드가 가능합니다.</p>
      <div className="mt-4">
        <Link to="/sim" className="px-4 py-2 rounded-xl bg-black text-white">시뮬레이터로 이동</Link>
      </div>
    </div>
  )
}
