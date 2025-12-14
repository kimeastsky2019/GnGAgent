import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import AppLayout from './pages/AppLayout'
import Simulator from './pages/Simulator'
import Dashboard from './pages/Dashboard'
import ApiTest from './App' // API 통합 테스트 페이지

const router = createBrowserRouter([
  { path: '/', element: <AppLayout />, children: [
    { index: true, element: <Dashboard /> },
    { path: 'sim', element: <Simulator /> },
    { path: 'api-test', element: <ApiTest /> }, // API 통합 테스트 페이지
  ]}
], {
  basename: '/demand_control'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
