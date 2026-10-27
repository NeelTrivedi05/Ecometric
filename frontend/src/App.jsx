import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InfoPage from './pages/InfoPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import SettingsPage from './pages/SettingsPage';
import VerifierPortal from './pages/VerifierPortal';
import { StudioProvider } from './context/StudioContext';
import StudioWorkspace from './components/studio/StudioWorkspace';
import { useAuth } from './context/AuthContext';

function RequireAuth() {
  const { user, membership, loading } = useAuth();
  if (loading) return <main className="auth-page"><p>Loading your workspace…</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!membership) return <main className="auth-page"><div><h1>Access pending</h1><p>Your account must be invited to an EcoMetric organization.</p></div></main>;
  return <Outlet />;
}

function RequireAdmin() {
  const { role } = useAuth();
  if (role !== 'admin') return <main className="auth-page"><div><h1>Administrator access required</h1><p>This area is limited to organization administrators.</p></div></main>;
  return <Outlet />;
}

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
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />

        {/* EcoMetric Calculation Studio Workspace & Projects with dedicated URLs */}
        <Route element={<RequireAuth />}>
          <Route element={<StudioProvider><Outlet /></StudioProvider>}>
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
          <Route element={<RequireAdmin />}><Route path="/settings" element={<SettingsPage />} /></Route>
          <Route path="/verifier/:projectId" element={<VerifierPortal />} />
          </Route>
        </Route>

        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
