import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InfoPage from './pages/InfoPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import VerifierPortal from './pages/VerifierPortal';
import { StudioProvider } from './context/StudioContext';
import StudioWorkspace from './components/studio/StudioWorkspace';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing / Landing Page at Root */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/overview" element={<LandingPage />} />
        <Route path="/pipeline" element={<LandingPage />} />
        <Route path="/modules" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/capabilities" element={<LandingPage />} />
        <Route path="/faq" element={<LandingPage />} />
        <Route path="/pricing" element={<LandingPage />} />

        {/* Knowledge Base & Detailed Info Pages */}
        <Route path="/info" element={<InfoPage />} />
        <Route path="/info/:topicId" element={<InfoPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* EcoMetric Calculation Studio Workspace & Projects with dedicated URLs */}
        <Route
          element={
            <StudioProvider>
              <Outlet />
            </StudioProvider>
          }
        >
          <Route path="/app" element={<StudioWorkspace />} />
          <Route path="/app/projects" element={<StudioWorkspace />} />
          <Route path="/app/mine" element={<StudioWorkspace />} />
          <Route path="/app/shared" element={<StudioWorkspace />} />
          <Route path="/app/archived" element={<StudioWorkspace />} />
          <Route path="/app/epds" element={<StudioWorkspace />} />
          <Route path="/app/projects/:projectId" element={<StudioWorkspace />} />
          <Route path="/app/projects/:projectId/:phase" element={<StudioWorkspace />} />
          <Route path="/app/project/:projectId" element={<StudioWorkspace />} />
          <Route path="/app/project/:projectId/:phase" element={<StudioWorkspace />} />
          <Route path="/projects/:projectId" element={<StudioWorkspace />} />
          <Route path="/projects/:projectId/:phase" element={<StudioWorkspace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/verifier/:projectId" element={<VerifierPortal />} />
        </Route>

        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
