import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import SimpleWeatherDashboard from './components/SimpleWeatherDashboard';
import NavigationHeader from './components/NavigationHeader';
import Sidebar from './components/Sidebar';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: 80px; /* NavigationHeader 높이만큼 패딩 */
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

function App() {
  return (
    <Router>
      <NavigationHeader />
      <AppContainer>
        <Sidebar />
        <MainContent>
          <ContentArea>
            <Routes>
              <Route path="/" element={<SimpleWeatherDashboard />} />
              <Route path="/weather" element={<SimpleWeatherDashboard />} />
            </Routes>
          </ContentArea>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

export default App;
