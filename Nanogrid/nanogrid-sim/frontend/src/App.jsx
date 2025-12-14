import React, { useEffect, useState } from 'react'
import axios from 'axios'

// API 기본 설정 - 환경 변수 또는 기본값 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API 에러 핸들링 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

function KPI({ kpi }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      {Object.entries(kpi || {}).map(([k, v]) => (
        <div key={k} className="border rounded-2xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">{k}</div>
          <div className="text-2xl font-semibold">{typeof v === 'number' ? v.toFixed(3) : String(v)}</div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [status, setStatus] = useState(null)
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState(null)

  // API 연결 상태 확인
  useEffect(() => {
    apiClient.get('/')
      .then(r => {
        setApiStatus(r.data)
        console.log('API 연결 성공:', r.data)
      })
      .catch(err => {
        setError('백엔드 API에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.')
        console.error('API 연결 실패:', err)
      })
  }, [])

  const runSample = async () => {
    setLoading(true)
    setError(null)
    try {
      const req = {
        site_id: 1,
        period_start: '2025-01-01T00:00:00Z',
        period_end: '2025-01-07T00:00:00Z',
        step_minutes: 15,
        strategy: 'self_sufficiency',
        params: {}
      }
      const run = await apiClient.post('/sim-runs', req).then(r => r.data)
      setStatus(run)
      
      // 결과 조회 (현재는 TODO 상태이므로 에러 처리)
      try {
        const res = await apiClient.get(`/results/${run.sim_run_id}`).then(r => r.data)
        setKpi(res.kpi)
      } catch (err) {
        console.warn('결과 조회 실패 (백엔드 구현 필요):', err)
        setError('시뮬레이션 실행은 성공했지만 결과 조회에 실패했습니다. 백엔드 구현이 필요합니다.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || '시뮬레이션 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold">NanoGrid Match Simulation</h1>
      <p className="text-gray-600 mt-2">프로젝트 대시보드 · 시뮬레이션 실행 · KPI 확인</p>

      {/* API 상태 표시 */}
      {apiStatus && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="text-sm text-green-700">✓ 백엔드 API 연결됨: {apiStatus.service}</div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="text-sm text-red-700">⚠ {error}</div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button 
          onClick={runSample} 
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '실행 중...' : '샘플 실행'}
        </button>
      </div>

      {status && (
        <div className="mt-6 border rounded-2xl p-4">
          <div className="text-sm text-gray-500">상태</div>
          <pre className="text-sm mt-2">{JSON.stringify(status, null, 2)}</pre>
        </div>
      )}

      {kpi && <KPI kpi={kpi} />}
    </div>
  )
}
