import React, { useEffect, useState } from 'react';
import { Package } from '@untitledui/icons';
import { useTenant } from '../../../context/TenantContext';
import { supabase } from '../../../lib/supabase';

const cardStyle = {
  backgroundColor: 'var(--bg-card, #ffffff)',
  borderRadius: '16px',
  border: '1px solid var(--border, #dfe7dd)',
  padding: '24px 28px',
};

export default function BillingView() {
  const { activeOrg } = useTenant();
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadBilling() {
      if (!supabase || !activeOrg?.id) {
        setState('ready');
        return;
      }

      const [planResult, subscriptionResult] = await Promise.all([
        supabase.from('plans').select('code, display_name').eq('active', true),
        supabase.from('subscriptions').select('organization_id, plan_code, status, current_period_end, cancel_at_period_end').eq('organization_id', activeOrg.id).maybeSingle(),
      ]);

      if (!active) return;
      const failure = planResult.error || subscriptionResult.error;
      if (failure) {
        setError(failure.message);
        setState('error');
        return;
      }
      const currentSubscription = subscriptionResult.data;
      setPlan((planResult.data || []).find((item) => item.code === currentSubscription?.plan_code) || null);
      setSubscription(currentSubscription);
      setState('ready');
    }
    loadBilling();
    return () => { active = false; };
  }, [activeOrg?.id]);

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
        <p style={{ margin: '22px 0 0', color: 'var(--text-muted, #5b6f62)', fontSize: '13px' }}>
          EPD creation is currently unlimited for this workspace.
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>Budget and alerts</h2>
        <p style={{ margin: '4px 0 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          EPD creation is unlimited for this workspace. No monthly usage cap is applied.
        </p>
        <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card2, #f8faf6)' }}>
          <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            Account-level EPD quotas are disabled.
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Compare EcoMetric plans</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Review the plans and capabilities available for your workspace.
          </p>
        </div>
        <a
          href="/pricing"
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            background: '#1f7a4c',
            border: '1px solid #1f7a4c',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View pricing
        </a>
      </div>

    </div>
  );
}
