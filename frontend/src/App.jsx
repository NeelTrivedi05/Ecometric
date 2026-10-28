import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InfoPage from './pages/InfoPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import VerifierPortal from './pages/VerifierPortal';
import { StudioProvider } from './context/StudioContext';
import StudioWorkspace from './components/studio/StudioWorkspace';
import { useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import AdminConsoleLayout from './components/admin/AdminConsoleLayout';
import OverviewMetricsView from './components/admin/OverviewMetricsView';
import TeamManagementPanel from './components/admin/TeamManagementPanel';
import DomainDataAdminView from './components/admin/DomainDataAdminView';
import OrganizationSettingsView from './components/admin/OrganizationSettingsView';
import PlanView from './components/admin/tabs/PlanView';
import BillingView from './components/admin/tabs/BillingView';
import EmailView from './components/admin/tabs/EmailView';
import NotificationsView from './components/admin/tabs/NotificationsView';
import IntegrationsView from './components/admin/tabs/IntegrationsView';
import ApiView from './components/admin/tabs/ApiView';

function RequireAuth() {
  const { user, loading, isSessionExpired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main
        className="auth-page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f2f6f0',
          fontFamily: 'Google Sans Flex, sans-serif',
        }}
      >
        <p style={{ color: '#1f7a4c', fontWeight: 600, fontSize: '15px' }}>Loading your workspace…</p>
      </main>
    );
  }
  if (!user || isSessionExpired) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          message: isSessionExpired
            ? 'Your presence session expired after 24 hours. Please log in again.'
            : undefined,
        }}
      />
    );
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { role } = useAuth();
  if (role !== 'admin' && role !== 'account_admin') {
    return (
      <main className="auth-page">
        <div>
          <h1>Administrator access required</h1>
          <p>This area is limited to organization administrators.</p>
        </div>
      </main>
    );
  }
  return <Outlet />;
}

function ConsoleRedirect({ to = 'overview' }) {
  const { activeOrg, loading } = useTenant();

  if (loading) {
    return (
      <main
        className="auth-page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f2f6f0',
          fontFamily: 'Google Sans Flex, sans-serif',
        }}
      >
        <p style={{ color: '#1f7a4c', fontWeight: 600, fontSize: '15px' }}>Opening organization console…</p>
      </main>
    );
  }

  let storedSlug = window.localStorage.getItem('ecometric_active_org_slug');
  if (storedSlug === 'undefined' || storedSlug === 'null' || !storedSlug) {
    storedSlug = 'carrier-hvac';
  }
  const slug = activeOrg?.slug || storedSlug;
  return <Navigate to={`/console/${slug}/${to}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
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
              <Route path="/verifier/:projectId" element={<VerifierPortal />} />
            </Route>
          </Route>

          {/* Isolated Multi-Tenant Account Admin Console & Global Settings */}
          <Route path="/settings" element={<ConsoleRedirect to="settings" />} />
          <Route path="/console" element={<ConsoleRedirect to="overview" />} />
          <Route element={<AdminRouteGuard />}>
            <Route path="/console/:orgSlug" element={<AdminConsoleLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewMetricsView />} />
              <Route path="team" element={<TeamManagementPanel />} />
              <Route path="domain-data" element={<DomainDataAdminView />} />
              <Route path="settings" element={<OrganizationSettingsView />} />
              <Route path="plan" element={<PlanView />} />
              <Route path="billing" element={<BillingView />} />
              <Route path="email" element={<EmailView />} />
              <Route path="notifications" element={<NotificationsView />} />
              <Route path="integrations" element={<IntegrationsView />} />
              <Route path="api" element={<ApiView />} />
            </Route>
          </Route>

          {/* Redirect unknown routes back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TenantProvider>
    </BrowserRouter>
  );
}
