import React from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import BrandLogo from '../BrandLogo';
import {
  BuildingIcon,
  LayersIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from '../studio/Icons';
import {
  Package,
  CreditCard01,
  Mail01,
  Bell01,
  Link01,
  Key01,
} from '@untitledui/icons';

export default function AdminConsoleLayout() {
  const { orgSlug } = useParams();
  const { activeOrg } = useTenant();

  const currentSlug = orgSlug || activeOrg?.slug || 'default';

  const navLinks = [
    { to: `/console/${currentSlug}/overview`, label: 'Overview & Metrics', icon: LayersIcon },
    { to: `/console/${currentSlug}/team`, label: 'Team & Access Control', icon: ShieldCheckIcon },
    { to: `/console/${currentSlug}/domain-data`, label: 'Domain Data (LCA & EPDs)', icon: FileTextIcon },
    { to: `/console/${currentSlug}/settings`, label: 'Organization Settings', icon: BuildingIcon },
    { to: `/console/${currentSlug}/plan`, label: 'Plan', icon: Package },
    { to: `/console/${currentSlug}/billing`, label: 'Billing', icon: CreditCard01 },
    { to: `/console/${currentSlug}/email`, label: 'Email', icon: Mail01 },
    { to: `/console/${currentSlug}/notifications`, label: 'Notifications', icon: Bell01, badge: '2' },
    { to: `/console/${currentSlug}/integrations`, label: 'Integrations', icon: Link01 },
    { to: `/console/${currentSlug}/api`, label: 'API', icon: Key01 },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base, #f2f6f0)',
        color: 'var(--text-primary, #16231b)',
        fontFamily: 'var(--font, Google Sans Flex, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Application Header */}
      <header
        style={{
          height: '60px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border, #dfe7dd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Brand Mark */}
          <Link
            to="/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <BrandLogo theme="light" height={22} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-muted, #5b6f62)',
                borderLeft: '1px solid var(--border, #dfe7dd)',
                paddingLeft: '10px',
                lineHeight: '18px',
              }}
            >
              Admin Console
            </span>
          </Link>

        </div>

      </header>

      {/* Navigation Subheader Tabs */}
      <nav
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderBottom: '1px solid var(--border, #dfe7dd)',
          padding: '0 24px',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 2px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent, #1f7a4c)' : 'var(--text-muted, #5b6f62)',
                textDecoration: 'none',
                borderBottom: isActive ? '2px solid var(--accent, #1f7a4c)' : '2px solid transparent',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
                transition: 'all 0.16s ease',
              })}
            >
              <Icon size={15} />
              <span>{link.label}</span>
              {link.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(31, 122, 76, 0.1)',
                    color: 'var(--accent, #1f7a4c)',
                    border: '1px solid var(--border-bright, #c8e2d1)',
                  }}
                >
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Main Console Content Body */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

    </div>
  );
}
