import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';

export default function SettingsPage() {
  const { activeOrg } = useTenant();
  const slug = activeOrg?.slug || window.localStorage.getItem('ecometric_active_org_slug') || 'carrier-hvac';
  return <Navigate to={`/console/${slug}/settings`} replace />;
}
