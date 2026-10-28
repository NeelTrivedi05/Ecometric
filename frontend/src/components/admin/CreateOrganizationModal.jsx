import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Button } from '../base/buttons/button';
import { PlusIcon, CloseIcon } from '../studio/Icons';

export default function CreateOrganizationModal({ isOpen, onClose }) {
  const { createOrganization } = useTenant();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate slug if user hasn't manually edited slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an organization name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await createOrganization(name.trim(), slug.trim());
      onClose();
      setName('');
      setSlug('');
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(22, 35, 27, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'var(--font, Google Sans Flex, sans-serif)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '28px',
          boxShadow: '0 16px 40px rgba(16, 52, 33, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent, #1f7a4c)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              New Tenant Boundary
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
              Create Organization
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #5b6f62)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', lineHeight: 1.5, marginBottom: '20px' }}>
          Provisions a brand new isolated database tenant. You will automatically become the initial{' '}
          <strong>Account Admin</strong> with exclusive Row Level Security (RLS) jurisdiction.
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #2f3b33)',
                marginBottom: '6px',
              }}
            >
              Organization / Company Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Trane Technologies Industrial"
              value={name}
              onChange={handleNameChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #dfe7dd)',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: 'var(--text-primary, #16231b)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #2f3b33)',
                marginBottom: '6px',
              }}
            >
              Console URL Identifier (Slug)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card2, #f8faf6)',
                borderRadius: '8px',
                border: '1px solid var(--border, #dfe7dd)',
                padding: '0 12px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', marginRight: '4px' }}>
                /console/
              </span>
              <input
                type="text"
                required
                placeholder="trane-industrial"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary, #16231b)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button color="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} iconLeading={PlusIcon}>
              {loading ? 'Provisioning…' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

