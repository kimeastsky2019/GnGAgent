import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DemandAnalysisPage from './pages/DemandAnalysisPage'
import SupplyAnalysisPage from './pages/SupplyAnalysisPage'
import MatchingPage from './pages/MatchingPage'
import ScenarioPage from './pages/ScenarioPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demand" element={<DemandAnalysisPage />} />
        <Route path="/supply" element={<SupplyAnalysisPage />} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/scenarios" element={<ScenarioPage />} />
      </Routes>
    </Layout>
  )
}

export default App

