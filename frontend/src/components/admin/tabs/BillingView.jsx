import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package } from '@untitledui/icons';
import { useTenant } from '../../../context/TenantContext';
import { supabase } from '../../../lib/supabase';

const cardStyle = {
  backgroundColor: 'var(--bg-card, #ffffff)',
  borderRadius: '16px',
  border: '1px solid var(--border, #dfe7dd)',
  padding: '24px 28px',
};

function ProgressBar({ value, warning = false }) {
  return (
    <div style={{ height: '8px', overflow: 'hidden', borderRadius: '9999px', background: '#edf2ec' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: warning ? '#d97706' : '#1f7a4c' }} />
    </div>
  );
}

export default function BillingView() {
  const { activeOrg } = useTenant();
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadBilling() {
      if (!supabase || !activeOrg?.id) {
        setState('ready');
        return;
      }

      const periodStart = new Date();
      periodStart.setDate(1);
      const [planResult, subscriptionResult, usageResult] = await Promise.all([
        supabase.from('plans').select('code, display_name, epd_quota').eq('active', true),
        supabase.from('subscriptions').select('organization_id, plan_code, status, current_period_end, cancel_at_period_end').eq('organization_id', activeOrg.id).maybeSingle(),
        supabase.from('usage_events').select('id, kind, status, period_start, created_at').eq('organization_id', activeOrg.id).gte('period_start', periodStart.toISOString().slice(0, 10)),
      ]);

      if (!active) return;
      const failure = planResult.error || subscriptionResult.error || usageResult.error;
      if (failure) {
        setError(failure.message);
        setState('error');
        return;
      }
      const currentSubscription = subscriptionResult.data;
      setPlan((planResult.data || []).find((item) => item.code === currentSubscription?.plan_code) || null);
      setSubscription(currentSubscription);
      setUsage(usageResult.data || []);
      setState('ready');
    }
    loadBilling();
    return () => { active = false; };
  }, [activeOrg?.id]);

  const used = useMemo(
    () => usage.filter((event) => ['reserved', 'committed'].includes(event.status)).length,
    [usage]
  );
  const quota = plan?.epd_quota || 0;
  const usagePercent = quota ? (used / quota) * 100 : 0;
  const planName = plan?.display_name || 'Workspace plan';

  if (state === 'loading') return <div style={{ color: 'var(--text-muted)' }}>Loading billing and usage…</div>;
  if (state === 'error') return <div style={{ ...cardStyle, color: '#b45309' }}>Could not load billing data: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      <div style={cardStyle}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent, #1f7a4c)' }}>
          Payment & usage
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '4px 0 0' }}>Billing & workspace limits</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
          View the plan and monthly EPD capacity for {activeOrg?.name || 'this workspace'}.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '8px', color: '#1f7a4c', background: 'rgba(31, 122, 76, 0.08)' }}>
              <Package size={22} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px' }}>{planName}</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {subscription?.status === 'active' ? 'Active subscription' : 'Subscription requires attention'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <strong>EPD creation usage</strong>
            <span>{used} / {quota || '—'} this month</span>
          </div>
          <ProgressBar value={usagePercent} warning={usagePercent >= 80} />
          {usagePercent >= 80 && (
            <p style={{ display: 'flex', gap: '7px', alignItems: 'center', margin: '12px 0 0', color: '#b45309', fontSize: '12px' }}>
              <AlertTriangle size={15} /> This workspace is approaching its monthly EPD limit.
            </p>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>Budget and alerts</h2>
        <p style={{ margin: '4px 0 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Track EPD capacity and decide when the workspace should be warned.
        </p>
        <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card2, #f8faf6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--text-muted)' }}>This month</span>
            <strong>{used} of {quota || '—'} EPDs</strong>
          </div>
          <ProgressBar value={usagePercent} warning={usagePercent >= 80} />
          <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            New EPD creation is blocked automatically when the quota is reached.
          </p>
        </div>
      </div>

    </div>
  );
}
