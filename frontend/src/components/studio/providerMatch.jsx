import React from 'react';

// Dataset (ecoinvent provider) bookkeeping shared by Extracted Inventory and Review & Mapping.
// match_method values come from the backend matcher (engines/material_matcher.py) or from a picker here.
export const USER_SELECTED = 'user_selected';
const AUTO_METHODS = new Set(['auto_default', 'material_library', 'name_search']);

// Search text and expected reference unit for each kind of stage input
export const PROVIDER_KINDS = {
  transport: { query: 'transport, freight', unit: 'metric ton*km' },
  electricity: { query: 'electricity, medium voltage', unit: 'kWh' },
  heat: { query: 'heat, natural gas', unit: 'MJ' },
  diesel: { query: 'diesel, burned in building machine', unit: 'MJ' },
  water: { query: 'tap water', unit: 'kg' },
  material: { query: '', unit: 'kg' },
  waste: { query: 'treatment of', unit: 'kg' },
};

// Stage inputs keep their dataset next to the id: <field>_dataset, <field>_reference_unit, <field>_match_method
// (plain dataset / reference_unit / match_method when the id field is `provider_id`).
export function providerMetaKey(field, suffix) {
  return field === 'provider_id' ? suffix : `${field}_${suffix}`;
}

export function stageProvider(block, field) {
  const b = block || {};
  return {
    id: b[field] || '',
    dataset: b[providerMetaKey(field, 'dataset')] || '',
    unit: b[providerMetaKey(field, 'reference_unit')] || '',
    method: b[providerMetaKey(field, 'match_method')] || '',
  };
}

export function bomProvider(item) {
  const i = item || {};
  return {
    id: i.provider_id || i.ecoinvent_id || '',
    dataset: i.dataset || '',
    unit: i.reference_unit || '',
    method: i.match_method || '',
    unmatched: i.ecoinvent_matched === false,
    pending: !(i.provider_id || i.ecoinvent_id) && i.ecoinvent_matched === undefined,
  };
}

// 'auto' | 'user' | 'document' | 'pending' | 'none'
export function matchStatus(provider) {
  if (provider.method === USER_SELECTED) return 'user';
  if (provider.pending) return 'pending';
  if (!provider.id || provider.unmatched) return 'none';
  if (AUTO_METHODS.has(provider.method)) return 'auto';
  return 'document';
}

function resultId(result) {
  return result.id || `ecoinvent_row_${result.row_index}`;
}

function resultLabel(result) {
  const name = result.activity_name || result.name || resultId(result);
  return result.activity_name ? `${name} [${result.geography || 'GLO'}]` : name;
}

// Fields written when the user picks a dataset for a stage input; the matcher never replaces these.
export function userProviderPatch(field, result) {
  return {
    [field]: resultId(result),
    [providerMetaKey(field, 'dataset')]: resultLabel(result),
    [providerMetaKey(field, 'reference_unit')]: result.reference_unit || result.unit || '',
    [providerMetaKey(field, 'match_method')]: USER_SELECTED,
  };
}

// Same for a BOM line
export function userBomPatch(result) {
  const id = resultId(result);
  return {
    provider_id: id,
    ecoinvent_id: id,
    ecoinvent_row: result.row_index,
    dataset: resultLabel(result),
    reference_product_name: result.reference_product_name,
    reference_unit: result.reference_unit || result.unit || '',
    ecoinvent_geography: result.geography,
    ecoinvent_matched: true,
    match_method: USER_SELECTED,
  };
}

const BADGE_STYLES = {
  auto: { label: 'Auto-selected', color: '#1f7a4c', bg: 'rgba(31, 122, 76, 0.10)', title: 'Best dataset picked automatically. Choose another one to override it.' },
  user: { label: 'Selected by you', color: '#0a62c9', bg: 'rgba(10, 98, 201, 0.10)', title: 'You chose this dataset. Automatic matching will not change it.' },
  document: { label: 'From document', color: '#6e5a12', bg: 'rgba(191, 144, 0, 0.12)', title: 'Dataset stated in the uploaded document.' },
  pending: { label: 'Matching…', color: '#6e6e73', bg: 'rgba(0, 0, 0, 0.06)', title: 'Looking up the best dataset for this line.' },
  none: { label: 'Not matched', color: '#c4271b', bg: 'rgba(255, 59, 48, 0.10)', title: 'No dataset found. Select one before calculating.' },
};

export function MatchBadge({ status }) {
  const s = BADGE_STYLES[status] || BADGE_STYLES.none;
  return (
    <span
      title={s.title}
      style={{ backgroundColor: s.bg, color: s.color, padding: '1px 7px', borderRadius: '9999px', fontWeight: 600, fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {s.label}
    </span>
  );
}

// Read-only dataset line: name, unit and match status
export function ProviderLine({ label, provider }) {
  const status = matchStatus(provider);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
      {label && <span style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)', fontWeight: 600 }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span
          title={provider.dataset || provider.id}
          style={{ fontSize: '11px', color: status === 'none' ? '#c4271b' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
        >
          {status === 'none' ? 'No dataset selected' : status === 'pending' ? 'Finding the best dataset…' : (provider.dataset || provider.id)}
        </span>
        {provider.unit && status !== 'none' && status !== 'pending' && (
          <span style={{ fontSize: '10px', color: 'var(--text-secondary, #86868b)', flexShrink: 0 }}>per {provider.unit}</span>
        )}
        <MatchBadge status={status} />
      </div>
    </div>
  );
}

// A card footer listing the datasets behind a stage's inputs
export function ProviderList({ rows }) {
  return (
    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary, #86868b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        ecoinvent v3.12 datasets
      </span>
      {rows.map(r => <ProviderLine key={r.label} label={r.label} provider={r.provider} />)}
    </div>
  );
}
