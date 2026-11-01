import React, { useEffect, useState } from 'react';
import { Check, Package } from '@untitledui/icons';
import { useTenant } from '../../../context/TenantContext';
import { supabase } from '../../../lib/supabase';

export default function PlanView() {
  const { activeOrg } = useTenant();
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    async function loadPlan() {
      if (!supabase || !activeOrg?.id) {
        setStatus('ready');
        return;
      }
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_code, status, current_period_end, cancel_at_period_end')
        .eq('organization_id', activeOrg.id)
        .maybeSingle();
      if (subscriptionError) {
        if (active) setStatus('error');
        return;
      }
      const { data, error } = await supabase
        .from('plans')
        .select('code, display_name, epd_quota')
        .eq('code', subscription?.plan_code || 'free')
        .maybeSingle();
      if (active) {
        setPlan({ ...(data || { code: 'free', display_name: 'Free', epd_quota: 1 }), subscription });
        setStatus(error ? 'error' : 'ready');
      }
    }
    loadPlan();
    return () => { active = false; };
  }, [activeOrg?.id]);

  if (status === 'loading') return <div style={{ color: 'var(--text-muted)' }}>Loading workspace plan…</div>;
  if (status === 'error') return <div style={{ color: '#b45309' }}>Could not load the workspace plan.</div>;

  const planName = plan?.display_name || 'Free';
  const quota = plan?.epd_quota || 1;
  const features = [
    `${quota} EPD${quota === 1 ? '' : 's'} per month`,
    'BOM and document ingestion',
    'PCR validation and LCIA calculations',
    'Workspace-scoped project data',
    'Verifier-ready PDF and ILCD export',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border, #dfe7dd)', padding: '24px 28px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent, #1f7a4c)' }}>
          Subscription & capacity
        </span>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '4px 0 0' }}>Workspace plan</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Your plan controls how many EPDs this workspace can create each month.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border, #dfe7dd)', padding: '28px', display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '8px', color: '#1f7a4c', background: 'rgba(31, 122, 76, 0.08)' }}>
              <Package size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{planName}</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {plan?.subscription?.status === 'active' ? 'Active' : 'Free workspace plan'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '22px' }}>
            {features.map((feature) => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary, #2f3b33)' }}>
                <Check size={16} color="#1f7a4c" /> <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '9999px', background: '#eaf7ee', color: '#1f7a4c', border: '1px solid #c3e8cd', fontSize: '12px', fontWeight: 600 }}>
            {quota} EPD{quota === 1 ? '' : 's'} / month
          </span>
          <button type="button" disabled style={{ padding: '9px 16px', borderRadius: '8px', background: '#fff', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px', cursor: 'not-allowed' }}>
            Upgrade via Stripe
          </button>
        </div>
      </div>
    </div>
  );
}
