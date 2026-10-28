import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import BrandLogo from '../BrandLogo';

export default function AdminRouteGuard() {
  const { user, loading: authLoading } = useAuth();
  const { activeOrg, isAccountAdmin, userRole, loading: tenantLoading } = useTenant();
  const location = useLocation();

  const isLoading = authLoading || tenantLoading;

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base, #f2f6f0)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font, Google Sans Flex, sans-serif)',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '36px',
            boxShadow: '0 8px 30px rgba(16, 52, 33, 0.06)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(31, 122, 76, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'var(--accent, #1f7a4c)',
            }}
          >
            <BrandLogo />
          </div>

          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary, #16231b)',
              marginBottom: '8px',
              letterSpacing: '-0.015em',
            }}
          >
            Verifying Tenant Privileges…
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted, #5b6f62)',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            Connecting to PostgreSQL RLS isolation boundary for this organization.
          </p>

          {/* Skeleton Loaders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                height: '14px',
                width: '100%',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                borderRadius: '6px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
            <div
              style={{
                height: '14px',
                width: '75%',
                margin: '0 auto',
                backgroundColor: 'rgba(31, 122, 76, 0.06)',
                borderRadius: '6px',
                animation: 'pulse 1.5s infinite ease-in-out 0.2s',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in and no fallback active organization exists, redirect to login
  if (!user && !activeOrg) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // If user has no active organization in database
  if (!activeOrg) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base, #f2f6f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font, Google Sans Flex, sans-serif)',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '36px',
            boxShadow: '0 12px 36px rgba(16, 52, 33, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              marginBottom: '16px',
            }}
          >
            ✉️
          </div>

          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary, #16231b)',
              marginBottom: '8px',
            }}
          >
            Organization Membership Required
          </h1>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted, #5b6f62)',
              lineHeight: 1.55,
              marginBottom: '20px',
            }}
          >
            Your account is not currently associated with an active organization. Ask an Account Admin to send you an invitation, or launch the calculation studio.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/app"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--accent, #1f7a4c)',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              Launch Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active member of organization (Admin or Employee) is allowed into console
  return <Outlet />;
}

