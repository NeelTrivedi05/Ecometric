import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InfoPage from './pages/InfoPage';
import { StudioProvider } from './context/StudioContext';
import StudioWorkspace from './components/studio/StudioWorkspace';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing / Landing Page at Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Knowledge Base & Detailed Info Pages */}
        <Route path="/info" element={<InfoPage />} />
        <Route path="/info/:topicId" element={<InfoPage />} />

        {/* EcoMetric Calculation Studio Workspace & Projects with dedicated URLs */}
        <Route
          element={
            <StudioProvider>
              <Outlet />
            </StudioProvider>
          }
        >
          <Route path="/app" element={<StudioWorkspace />} />
          <Route path="/app/projects/:projectId" element={<StudioWorkspace />} />
          <Route path="/app/project/:projectId" element={<StudioWorkspace />} />
          <Route path="/projects/:projectId" element={<StudioWorkspace />} />
        </Route>

        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
