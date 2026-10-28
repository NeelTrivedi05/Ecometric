import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import BrandLogo from '../BrandLogo';
import CreateOrganizationModal from './CreateOrganizationModal';
import {
  BuildingIcon,
  CheckIcon,
  PlusIcon,
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
  const navigate = useNavigate();
  const { activeOrg, memberships, switchOrganization, userRole } = useTenant();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              gap: '8px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(31, 122, 76, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #1f7a4c)',
              }}
            >
              <BrandLogo />
            </span>
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.015em' }}>
              EcoMetric <span style={{ color: 'var(--text-muted, #5b6f62)', fontWeight: 400 }}>Admin Console</span>
            </span>
          </Link>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border, #dfe7dd)' }} />

          {/* Organization Switcher Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card2, #f8faf6)',
                border: '1px solid var(--border, #dfe7dd)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary, #16231b)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent, #1f7a4c)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeOrg?.name ? activeOrg.name.charAt(0).toUpperCase() : 'O'}
              </span>
              <span>{activeOrg?.name || 'Select Organization'}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #5b6f62)', marginLeft: '2px' }}>▾</span>
            </button>

            {isOrgDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  width: '280px',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #dfe7dd)',
                  boxShadow: '0 12px 32px rgba(16, 52, 33, 0.12)',
                  padding: '8px',
                  zIndex: 200,
                }}
              >
                <div
                  style={{
                    padding: '6px 10px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted, #5b6f62)',
                    letterSpacing: '0.04em',
                    borderBottom: '1px solid var(--border, #dfe7dd)',
                    marginBottom: '4px',
                  }}
                >
                  Your Organizations
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {memberships.map((m) => {
                    const org = m.organizations;
                    const isSelected = org?.id === activeOrg?.id;
                    return (
                      <button
                        key={m.organization_id || org?.id}
                        type="button"
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          switchOrganization(org?.slug || org?.id);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: isSelected ? 'var(--bg-hover, #eef7f1)' : 'transparent',
                          color: isSelected ? 'var(--accent, #1f7a4c)' : 'var(--text-secondary, #2f3b33)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              backgroundColor: isSelected ? 'var(--accent, #1f7a4c)' : 'var(--border, #dfe7dd)',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary, #2f3b33)',
                              fontSize: '10px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {org?.name?.charAt(0) || 'O'}
                          </span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {org?.name}
                          </span>
                        </div>
                        {isSelected && <CheckIcon size={14} style={{ color: 'var(--accent, #1f7a4c)' }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border, #dfe7dd)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--accent, #1f7a4c)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <PlusIcon size={14} />
                    <span>Create New Organization</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Status Badges & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* RLS Isolation Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'rgba(31, 122, 76, 0.08)',
              color: 'var(--accent, #1f7a4c)',
              border: '1px solid rgba(31, 122, 76, 0.2)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent, #1f7a4c)',
              }}
            />
            <span>RLS Isolated Tenant</span>
          </div>

          {/* Account Admin Role Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--bg-card2, #f8faf6)',
              color: 'var(--text-secondary, #2f3b33)',
              border: '1px solid var(--border, #dfe7dd)',
            }}
          >
            <span style={{ fontSize: '12px' }}>🛡️</span>
            <span>Account Admin</span>
          </div>

          {/* Return to Calculation Studio */}
          <Link
            to="/app"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent, #1f7a4c)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(31, 122, 76, 0.08)',
              transition: 'background-color 0.16s ease',
            }}
          >
            <span>← Studio Workspace</span>
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

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

