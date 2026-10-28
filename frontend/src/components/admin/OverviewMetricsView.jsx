import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { ACCOUNTS_DATA } from '../../data/accountsData';
import {
  FileTextIcon,
  ShieldCheckIcon,
  LayersIcon,
  CheckIcon,
  DropletIcon,
  PlusIcon,
  ExternalLinkIcon,
} from '../studio/Icons';

export default function OverviewMetricsView() {
  const { orgSlug } = useParams();
  const { activeOrg } = useTenant();

  // Find account domain data matching current active organization
  const accountKey = activeOrg?.slug || orgSlug || 'carrier-hvac';
  const accountData = ACCOUNTS_DATA[accountKey] || ACCOUNTS_DATA['carrier-hvac'];

  const projectsCount = accountData?.projects?.length || 4;
  const epdsCount = accountData?.epds?.length || 1;
  const dqrScore = accountData?.database_assembly?.dqr_score || 1.28;
  const dqrRating = accountData?.database_assembly?.dqr_rating || 'Platinum Tier 1 (ISO 14044 Verified)';
  const pcrStandard = accountData?.database_assembly?.pcr_standard || 'UL 10010-4 Part B & EN 15804+A2';
  const facilityName = accountData?.facility_name || 'Primary Manufacturing Facility';

  // Calculate total GWP tracked
  const totalGwpKg = (accountData?.projects || []).reduce((acc, p) => acc + (p.gwp_total || 0), 0);
  const totalGwpTons = (totalGwpKg / 1000).toFixed(1);

  const statCards = [
    {
      label: 'Industrial LCA Projects',
      value: projectsCount,
      sub: 'Chillers & Heat Pumps',
      icon: LayersIcon,
      badge: 'Active Assessments',
      badgeColor: '#1f7a4c',
    },
    {
      label: 'Verified Type III EPDs',
      value: epdsCount,
      sub: 'ISO 14025 / EN 15804+A2',
      icon: FileTextIcon,
      badge: 'Published & Certified',
      badgeColor: '#2e9e5b',
    },
    {
      label: 'Embodied Carbon Tracked',
      value: `${totalGwpTons} t`,
      sub: 'kg CO₂e Cumulative Cradle-to-Grave',
      icon: DropletIcon,
      badge: 'Module A1–D Scoped',
      badgeColor: '#0284c7',
    },
    {
      label: 'Data Quality Rating (DQR)',
      value: dqrScore,
      sub: dqrRating,
      icon: ShieldCheckIcon,
      badge: 'ISO 14044 Verified',
      badgeColor: '#1f7a4c',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #dfe7dd)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent, #1f7a4c)',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              Multi-Tenant Organization Console
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>
              Tenant ID: <code style={{ fontSize: '11px' }}>{activeOrg?.id || 'org-carrier-syracuse'}</code>
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
            {activeOrg?.name || 'Organization Overview'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #2f3b33)', margin: '4px 0 0' }}>
            {facilityName} • Governed by {pcrStandard}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={`/console/${orgSlug}/team`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card2, #f8faf6)',
              border: '1px solid var(--border, #dfe7dd)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary, #16231b)',
              textDecoration: 'none',
            }}
          >
            <ShieldCheckIcon size={14} />
            <span>Manage Team</span>
          </Link>
          <Link
            to={`/console/${orgSlug}/domain-data`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent, #1f7a4c)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <PlusIcon size={14} />
            <span>Explore Domain Data</span>
          </Link>
        </div>
      </div>

      {/* Domain KPI Stat Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: '14px',
                border: '1px solid var(--border, #dfe7dd)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary, #2f3b33)' }}>
                  {c.label}
                </span>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(31, 122, 76, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent, #1f7a4c)',
                  }}
                >
                  <Icon size={16} />
                </span>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary, #16231b)',
                    fontFeatureSettings: "'tnum' 1, 'zero' 1",
                    lineHeight: 1.1,
                  }}
                >
                  {c.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', marginTop: '6px' }}>
                  {c.sub}
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border, #dfe7dd)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: c.badgeColor,
                    backgroundColor: `${c.badgeColor}12`,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {c.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Section: Facility LCI Assembly & Tenant Lineage Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
        {/* Left Card: Facility Regional Assembly */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
              Regional Facility LCI Assembly
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent, #1f7a4c)',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              ISO 14044 Scoped
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)' }}>Facility Location</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                {accountData?.facility_location || 'DeWitt, New York, USA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)' }}>Regional Electricity Grid Mix</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent, #1f7a4c)' }}>
                {accountData?.database_assembly?.grid_mix_name || 'US-NYUP (Upstate New York)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)' }}>Grid Emission Factor</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                {accountData?.database_assembly?.grid_emission_factor || 0.165} kg CO₂e / kWh
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)' }}>Background LCI Database</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                ecoinvent v3.12 Cut-Off (26,533 activities)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)' }}>Cryptographic SHA-256 Hash</span>
              <code style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)' }}>
                {accountData?.database_assembly?.sha256_hash?.substring(0, 20)}…
              </code>
            </div>
          </div>
        </div>

        {/* Right Card: Audit Trail & Lineage Activity */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
              Tenant Operational Audit Trail
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>RLS Logged</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                title: 'AquaEdge 19DV Centrifugal Chiller EPD Published',
                sub: 'Third-party verification certified by EcoForm Certification (Jack Geibig)',
                time: '2 hours ago',
                icon: CheckIcon,
                color: '#1f7a4c',
              },
              {
                title: 'Upstate NY Clean Grid Mix Lineage Linked',
                sub: 'ecoinvent provider ecoinvent_elec_mv_us validated with zero cut-off gaps',
                time: 'Yesterday',
                icon: ShieldCheckIcon,
                color: '#0284c7',
              },
              {
                title: 'WeatherExpert Heat Pump 150 RT Ingestion',
                sub: 'Module A1-A3 raw material breakdown parsed across 18 nested BOM components',
                time: '3 days ago',
                icon: LayersIcon,
                color: '#d97706',
              },
              {
                title: 'Tenant Row Level Security Boundary Certified',
                sub: 'Database access policies locked exclusively to organization_id tenant boundary',
                time: '1 week ago',
                icon: ShieldCheckIcon,
                color: '#1f7a4c',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)' }}>{item.time}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', marginTop: '2px' }}>
                      {item.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

