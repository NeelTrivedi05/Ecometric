import React, { useState } from 'react';
import { CheckIcon, CloseIcon, AlertIcon, InfoIcon } from './Icons';

// Renders a PCR ruleset report (backend engines/pcr_ruleset_engine.py) grouped by ruleset.

const STATUS = {
  fail: { label: 'Fails', color: '#ff3b30', bg: '#fff8f7', border: 'rgba(255, 59, 48, 0.2)', Icon: CloseIcon },
  missing: { label: 'Data missing', color: '#ff9f0a', bg: '#fffcf5', border: 'rgba(255, 159, 10, 0.25)', Icon: AlertIcon },
  manual: { label: 'Manual review', color: '#636366', bg: '#f9f9fb', border: '#e5e5ea', Icon: InfoIcon },
  pass: { label: 'Met', color: '#28cd41', bg: '#ffffff', border: '#e0e0e0', Icon: CheckIcon },
  not_applicable: { label: 'Not applicable', color: '#aeaeb2', bg: '#ffffff', border: '#ececf0', Icon: InfoIcon },
};

const ORDER = { fail: 0, missing: 1, manual: 2, pass: 3, not_applicable: 4 };
const SEVERITY = { critical: 'Critical', major: 'Major', minor: 'Minor' };

function sortChecks(a, b) {
  if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
  return (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
}

function sourceLabel(src) {
  if (!src) return null;
  const parts = [];
  if (src.section) parts.push(/^[\d.]+$/.test(String(src.section)) ? `§${src.section}` : src.section);
  if (src.page) parts.push(`p.${src.page}`);
  return parts.join(' · ') || null;
}

export function summaryChips(summary) {
  if (!summary) return [];
  return [
    { key: 'pass', label: 'met', value: summary.pass },
    { key: 'fail', label: 'fail', value: summary.fail },
    { key: 'missing', label: 'data missing', value: summary.missing },
    { key: 'manual', label: 'manual review', value: summary.manual },
    { key: 'not_applicable', label: 'not applicable', value: summary.not_applicable },
  ].filter(c => c.value > 0);
}

export function SummaryChips({ summary }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {summaryChips(summary).map(c => (
        <span key={c.key} style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
          color: STATUS[c.key].color, backgroundColor: '#f5f5f7', border: `1px solid ${STATUS[c.key].border}`,
        }}>
          {c.value} {c.label}
        </span>
      ))}
    </div>
  );
}

function CheckItem({ check, blockingLabel }) {
  const st = STATUS[check.status] || STATUS.manual;
  const { Icon } = st;
  const source = sourceLabel(check.source);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12,
      backgroundColor: st.bg, border: `1px solid ${check.blocking ? 'rgba(255, 59, 48, 0.35)' : st.border}`,
    }}>
      <span style={{ color: st.color, marginTop: 2, flexShrink: 0 }}><Icon size={16} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#1d1d1f' }}>{check.title}</span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {check.blocking && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, color: '#fff', backgroundColor: '#ff3b30' }}>
                {blockingLabel}
              </span>
            )}
            {!check.blocking && check.required_before_publish && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, color: '#8f5800', backgroundColor: 'rgba(255, 159, 10, 0.15)' }}>
                Required before publishing
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, color: st.color, backgroundColor: '#f5f5f7' }}>
              {st.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, color: '#636366', backgroundColor: '#f5f5f7' }}>
              {SEVERITY[check.severity] || check.severity}
            </span>
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#1d1d1f', margin: '2px 0 0', lineHeight: 1.4 }}>{check.message}</p>
        {check.requirement && check.status !== 'pass' && (
          <p style={{ fontSize: '11px', color: '#86868b', margin: '4px 0 0', lineHeight: 1.4 }}>{check.requirement}</p>
        )}
        <div style={{ fontSize: '10.5px', color: '#aeaeb2', marginTop: 4, fontFamily: 'var(--font-mono, monospace)' }}>
          {check.id}{source ? ` · ${source}` : ''}
        </div>
      </div>
    </div>
  );
}

export default function PcrCheckList({ report, blockingLabel = 'Blocking' }) {
  const [showInapplicable, setShowInapplicable] = useState(false);
  if (!report?.checks?.length) return null;

  const titles = { studio: 'Studio calculation inputs' };
  (report.rulesets || []).forEach(rs => { titles[rs.id] = rs.title || rs.id; });
  const groups = [];
  report.checks.forEach(c => {
    let g = groups.find(x => x.id === c.ruleset_id);
    if (!g) { g = { id: c.ruleset_id, checks: [] }; groups.push(g); }
    g.checks.push(c);
  });
  const hiddenCount = report.checks.filter(c => c.status === 'not_applicable').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map(g => {
        const visible = g.checks.filter(c => showInapplicable || c.status !== 'not_applicable').sort(sortChecks);
        if (!visible.length) return null;
        return (
          <div key={g.id} className="apple-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>{titles[g.id] || g.id}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0066cc', backgroundColor: 'rgba(0, 102, 204, 0.08)', padding: '2px 8px', borderRadius: '9999px' }}>
                {g.checks.filter(c => c.status === 'pass').length} / {g.checks.filter(c => c.status !== 'not_applicable').length} met
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visible.map(c => <CheckItem key={`${g.id}-${c.id}`} check={c} blockingLabel={blockingLabel} />)}
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <button type="button" className="btn-apple-secondary-pill" style={{ alignSelf: 'flex-start' }}
          onClick={() => setShowInapplicable(v => !v)}>
          {showInapplicable ? 'Hide' : 'Show'} {hiddenCount} rule{hiddenCount > 1 ? 's' : ''} that do not apply to this product
        </button>
      )}
    </div>
  );
}
