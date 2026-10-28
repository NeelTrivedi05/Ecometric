import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import {
  Mail01,
  UploadCloud02,
  HelpCircle,
  Check,
  Building07,
} from '@untitledui/icons';

export default function OrganizationSettingsView() {
  const { user } = useAuth();
  const { activeOrg, isAccountAdmin, refreshTenant } = useTenant();

  // Personal Info Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('Account Admin / Sustainability Lead');
  const [bio, setBio] = useState(
    'Lead Life Cycle Assessment engineer overseeing product carbon footprinting, ISO 14025 compliance, and third-party EPD verification.'
  );

  // Organization & EPD Profile State
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [methodology, setMethodology] = useState('TRACI 2.1');
  const [pcrStandard, setPcrStandard] = useState('UL 10010-4 Part B v2.0 & EN 15804+A2');

  // Status & Notification
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // Initialize values from authenticated user and active organization
  useEffect(() => {
    if (user) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const parts = fullName.trim().split(' ');
      const fName = parts[0] || (user.email ? user.email.split('@')[0] : 'Dhruvil');
      const lName = parts.slice(1).join(' ') || (parts[0] ? 'Patel' : 'Admin');

      setFirstName(user.user_metadata?.first_name || fName);
      setLastName(user.user_metadata?.last_name || lName);
      setEmail(user.email || '');
      setAvatarUrl(
        user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      );
      if (user.user_metadata?.role) setRole(user.user_metadata.role);
      if (user.user_metadata?.bio) setBio(user.user_metadata.bio);
    } else {
      setFirstName('Dhruvil');
      setLastName('Patel');
      setEmail('dhruvil@ecometric.io');
      setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    }

    if (activeOrg) {
      setOrgName(activeOrg.name || 'Carrier Commercial HVAC');
      setWebsite(activeOrg.settings?.company_website || 'https://www.carrier.com');
      setAddress(activeOrg.settings?.company_address || 'One Carrier Place, Farmington, CT 06032, USA');
      setMethodology(activeOrg.settings?.default_methodology || 'TRACI 2.1');
      setPcrStandard(activeOrg.settings?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2');
    }
  }, [user, activeOrg]);

  // Handle Photo Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();

      // 1. Update Supabase Auth user metadata
      if (supabase && user) {
        await supabase.auth.updateUser({
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: full_name,
            avatar_url: avatarUrl,
            role: role.trim(),
            bio: bio.trim(),
          },
        });

        // 2. Update profiles table
        await supabase
          .from('profiles')
          .update({
            full_name: full_name,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // 3. Update organizations table if admin
        if (isAccountAdmin && activeOrg?.id && orgName.trim()) {
          await supabase
            .from('organizations')
            .update({
              name: orgName.trim(),
              settings: {
                ...activeOrg.settings,
                company_website: website.trim(),
                company_address: address.trim(),
                default_methodology: methodology,
                pcr_standard: pcrStandard,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', activeOrg.id);

          await refreshTenant();
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle Discard
  const handleCancel = () => {
    if (user) {
      const fullName = user.user_metadata?.full_name || '';
      const parts = fullName.trim().split(' ');
      setFirstName(user.user_metadata?.first_name || parts[0] || 'Dhruvil');
      setLastName(user.user_metadata?.last_name || parts.slice(1).join(' ') || 'Patel');
      setEmail(user.email || '');
      setAvatarUrl(
        user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      );
    }
    if (activeOrg) {
      setOrgName(activeOrg.name || '');
      setWebsite(activeOrg.settings?.company_website || '');
      setAddress(activeOrg.settings?.company_address || '');
    }
    setErrorMessage('');
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-card, #ffffff)',
    border: '1px solid var(--border, #dfe7dd)',
    color: 'var(--text-primary, #16231b)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  const focusProps = {
    onFocus: (e) => {
      e.target.style.borderColor = 'var(--accent, #1f7a4c)';
      e.target.style.boxShadow = '0 0 0 3px rgba(31, 122, 76, 0.12)';
    },
    onBlur: (e) => {
      e.target.style.borderColor = 'var(--border, #dfe7dd)';
      e.target.style.boxShadow = 'none';
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      {/* Toast Notification */}
      {savedSuccess && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#eaf7ee',
            border: '1px solid #c3e8cd',
            borderRadius: '10px',
            color: 'var(--accent, #1f7a4c)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(31, 122, 76, 0.08)',
          }}
        >
          <Check size={16} />
          <span>Settings saved successfully. Changes take effect across your organization.</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--accent, #1f7a4c)',
          }}
        >
          Workspace & Account Settings
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
          Settings & Profile
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          Manage your personal account profile, contact information, and tenant-level EPD reporting standards.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Personal Info */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '28px',
          }}
        >
          {/* Section Header with Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
                Personal info
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                Update your photo and personal details here.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border, #dfe7dd)',
                  color: 'var(--text-secondary, #2f3b33)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card2, #f8faf6)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card, #ffffff)')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent, #1f7a4c)',
                  border: '1px solid var(--accent, #1f7a4c)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = 'var(--accent-hover, #176640)';
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.backgroundColor = 'var(--accent, #1f7a4c)';
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Row 1: Name * */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'start',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                maxWidth: '560px',
              }}
            >
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle}
                {...focusProps}
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle}
                {...focusProps}
              />
            </div>
          </div>

          {/* Row 2: Email address * */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Email address <span style={{ color: '#dc2626' }}>*</span>
              </label>
            </div>
            <div style={{ position: 'relative', maxWidth: '560px', width: '100%' }}>
              <Mail01
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #5b6f62)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                required
                placeholder="analyst@carrier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '38px' }}
                {...focusProps}
              />
            </div>
          </div>

          {/* Row 3: Your photo * */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'start',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                  Your photo <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <HelpCircle size={14} style={{ color: 'var(--text-muted, #5b6f62)', cursor: 'help' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                This will be displayed on your profile and verified EPDs.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '560px', width: '100%' }}>
              {/* Circular Avatar */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '1px solid var(--border, #dfe7dd)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: 'var(--bg-card2, #f8faf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent, #1f7a4c)' }}>
                    {(firstName?.[0] || 'D') + (lastName?.[0] || 'P')}
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  border: '1px dashed var(--border-bright, #c8e2d1)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card2, #f8faf6)',
                  padding: '16px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent, #1f7a4c)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover, #eef7f1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-bright, #c8e2d1)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-card2, #f8faf6)';
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/png, image/jpeg, image/gif, image/svg+xml"
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(31, 122, 76, 0.08)',
                    color: 'var(--accent, #1f7a4c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px',
                  }}
                >
                  <UploadCloud02 size={18} />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #2f3b33)', margin: 0 }}>
                  <span style={{ color: 'var(--accent, #1f7a4c)', fontWeight: 600 }}>Click to upload</span> or drag and drop
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)', margin: '2px 0 0' }}>
                  SVG, PNG, JPG or GIF (max. 800×400px)
                </p>
              </div>
            </div>
          </div>

          {/* Row 4: Role / Title */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Role / Title
              </label>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <input
                type="text"
                placeholder="Sustainability Systems Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={inputStyle}
                {...focusProps}
              />
            </div>
          </div>

          {/* Row 5: Bio */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              alignItems: 'start',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Bio
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                Write a short professional introduction.
              </p>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Professional background in environmental declarations..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                {...focusProps}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted, #5b6f62)', marginTop: '4px' }}>
                {Math.max(0, 400 - bio.length)} characters left
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Organization & LCA Reporting Profile */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '28px',
          }}
        >
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: 0 }}>
                  Organization & LCA Profile
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                  Official manufacturer identity and default impact assessment standards embedded in published EPDs.
                </p>
              </div>
              {!isAccountAdmin && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    color: '#b45309',
                    border: '1px solid rgba(217, 119, 6, 0.25)',
                  }}
                >
                  🔒 Admin Restricted (Read-Only)
                </span>
              )}
            </div>
            {!isAccountAdmin && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card2, #f8faf6)',
                  border: '1px solid var(--border, #dfe7dd)',
                  fontSize: '12px',
                  color: 'var(--text-secondary, #2f3b33)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🛡️</span>
                <span>
                  <strong>Employee Access:</strong> You are viewing organization details as an employee. Organization identity and compliance standards can only be modified by an <strong>Account Admin</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Org Row 1: Legal Name */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Company Name
              </label>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <input
                type="text"
                required
                value={orgName}
                disabled={!isAccountAdmin}
                readOnly={!isAccountAdmin}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Carrier Commercial HVAC"
                style={{ ...inputStyle, cursor: !isAccountAdmin ? 'not-allowed' : 'text', backgroundColor: !isAccountAdmin ? 'var(--bg-card2, #f8faf6)' : 'var(--bg-card, #ffffff)' }}
                {...focusProps}
              />
            </div>
          </div>

          {/* Org Row 2: Website */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Company Website
              </label>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <input
                type="url"
                value={website}
                disabled={!isAccountAdmin}
                readOnly={!isAccountAdmin}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.carrier.com"
                style={{ ...inputStyle, cursor: !isAccountAdmin ? 'not-allowed' : 'text', backgroundColor: !isAccountAdmin ? 'var(--bg-card2, #f8faf6)' : 'var(--bg-card, #ffffff)' }}
                {...focusProps}
              />
            </div>
          </div>

          {/* Org Row 3: Address */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'start',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Manufacturing Facility Address
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                Included in verifier certification documents.
              </p>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <textarea
                rows={2}
                value={address}
                disabled={!isAccountAdmin}
                readOnly={!isAccountAdmin}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="One Carrier Place, Farmington, CT 06032, USA"
                style={{ ...inputStyle, resize: 'vertical', cursor: !isAccountAdmin ? 'not-allowed' : 'text', backgroundColor: !isAccountAdmin ? 'var(--bg-card2, #f8faf6)' : 'var(--bg-card, #ffffff)' }}
                {...focusProps}
              />
            </div>
          </div>

          {/* Org Row 4: Default Methodology */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1px solid var(--border, #dfe7dd)',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Default LCIA Methodology
              </label>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <select
                value={methodology}
                disabled={!isAccountAdmin}
                onChange={(e) => setMethodology(e.target.value)}
                style={{ ...inputStyle, cursor: !isAccountAdmin ? 'not-allowed' : 'pointer', backgroundColor: !isAccountAdmin ? 'var(--bg-card2, #f8faf6)' : 'var(--bg-card, #ffffff)' }}
              >
                <option value="TRACI 2.1">TRACI 2.1 (US EPA Standard)</option>
                <option value="CML-IA Baseline">CML-IA Baseline (European Standard)</option>
                <option value="ReCiPe 2016 Midpoint (H)">ReCiPe 2016 Midpoint (Hierarchist)</option>
                <option value="EF 3.1">Environmental Footprint (EF) 3.1</option>
              </select>
            </div>
          </div>

          {/* Org Row 5: PCR Standard */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 240px) 1fr',
              gap: '24px',
              padding: '20px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>
                Product Category Rule (PCR)
              </label>
            </div>
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <select
                value={pcrStandard}
                disabled={!isAccountAdmin}
                onChange={(e) => setPcrStandard(e.target.value)}
                style={{ ...inputStyle, cursor: !isAccountAdmin ? 'not-allowed' : 'pointer', backgroundColor: !isAccountAdmin ? 'var(--bg-card2, #f8faf6)' : 'var(--bg-card, #ffffff)' }}
              >
                <option value="UL 10010-4 Part B v2.0 & EN 15804+A2">UL 10010-4 Part B v2.0 & EN 15804+A2 (HVAC & Mechanical)</option>
                <option value="ISO 21930:2017 Core PCR">ISO 21930:2017 Core PCR for Building Products</option>
                <option value="EN 15804+A1 Legacy">EN 15804+A1 Legacy Standard</option>
              </select>
            </div>
          </div>

          {/* Bottom Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border, #dfe7dd)',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border, #dfe7dd)',
                color: 'var(--text-secondary, #2f3b33)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent, #1f7a4c)',
                border: '1px solid var(--accent, #1f7a4c)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : (isAccountAdmin ? 'Save All Settings' : 'Save Personal Profile')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
