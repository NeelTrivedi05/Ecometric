import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { StudioProvider } from './context/StudioContext';
import StudioWorkspace from './components/studio/StudioWorkspace';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing / Landing Page at Root */}
        <Route path="/" element={<LandingPage />} />

        {/* EcoMetric Calculation Studio Workspace */}
        <Route
          path="/app"
          element={
            <StudioProvider>
              <StudioWorkspace />
            </StudioProvider>
          }
        />

        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
