import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { ACCOUNTS_DATA } from '../../data/accountsData';
import { Button } from '../base/buttons/button';
import {
  SearchIcon,
  FilterIcon,
  LayersIcon,
  FileTextIcon,
  CheckIcon,
  ShieldCheckIcon,
  DropletIcon,
  ExternalLinkIcon,
  DownloadIcon,
} from '../studio/Icons';

export default function DomainDataAdminView() {
  const { orgSlug } = useParams();
  const { activeOrg, isAccountAdmin } = useTenant();

  const accountKey = activeOrg?.slug || orgSlug || 'carrier-hvac';
  const accountData = ACCOUNTS_DATA[accountKey] || ACCOUNTS_DATA['carrier-hvac'];

  const rawProjects = accountData?.projects || [];
  const rawEpds = accountData?.epds || [];

  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'epds', 'facility'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [standardFilter, setStandardFilter] = useState('all');

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return rawProjects.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.product_model && p.product_model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.refrigerant && p.refrigerant.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && p.status === 'Verified EPD') ||
        (statusFilter === 'calculation' && p.status === 'In Calculation') ||
        (statusFilter === 'draft' && (p.status === 'Draft' || p.status === 'BOM Extracted'));

      const matchesStandard =
        standardFilter === 'all' ||
        (p.standard && p.standard.toLowerCase().includes(standardFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesStandard;
    });
  }, [rawProjects, searchQuery, statusFilter, standardFilter]);

  const handleExportDossier = () => {
    const jsonStr = JSON.stringify(
      {
        organization: activeOrg?.name || accountData.company_name,
        facility: accountData.facility_name,
        assembly: accountData.database_assembly,
        projects: rawProjects,
        epds: rawEpds,
        exported_at: new Date().toISOString(),
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeOrg?.slug || 'ecometric'}_lca_inventory_dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
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
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent, #1f7a4c)',
            }}
          >
            LCA Operational Records
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '4px 0 0' }}>
            Domain Data & Life Cycle Inventory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
            Inspect and configure industrial chiller models, refrigerant charges, and verified EPD declarations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button color="secondary" onClick={handleExportDossier} iconLeading={DownloadIcon}>
            Export LCA Dossier
          </Button>
          <Link
            to="/app"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent, #1f7a4c)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>+ Launch Calculation</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border, #dfe7dd)', paddingBottom: '12px' }}>
        {[
          { id: 'projects', label: `LCA Projects (${rawProjects.length})`, icon: LayersIcon },
          { id: 'epds', label: `Published EPDs (${rawEpds.length})`, icon: FileTextIcon },
          { id: 'facility', label: 'Facility Assembly Settings', icon: ShieldCheckIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? 'var(--accent, #1f7a4c)' : 'var(--bg-card, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #2f3b33)',
                border: isActive ? '1px solid var(--accent, #1f7a4c)' : '1px solid var(--border, #dfe7dd)',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View: LCA Projects Table */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search and Filters Bar */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--border, #dfe7dd)',
              padding: '12px 16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                minWidth: '220px',
                backgroundColor: 'var(--bg-card2, #f8faf6)',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #dfe7dd)',
              }}
            >
              <SearchIcon size={14} style={{ color: 'var(--text-muted, #5b6f62)' }} />
              <input
                type="text"
                placeholder="Search by equipment model, refrigerant (e.g. R1233zd), or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  color: 'var(--text-primary, #16231b)',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #dfe7dd)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                fontSize: '13px',
                color: 'var(--text-secondary, #2f3b33)',
                outline: 'none',
              }}
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified EPD</option>
              <option value="calculation">In Calculation</option>
              <option value="draft">Draft & Ingestion</option>
            </select>

            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border, #dfe7dd)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                fontSize: '13px',
                color: 'var(--text-secondary, #2f3b33)',
                outline: 'none',
              }}
            >
              <option value="all">All PCR Rules</option>
              <option value="ul">UL 10010-4 Part B</option>
              <option value="en">EN 15804+A2</option>
            </select>
          </div>

          {/* Table Container */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--border, #dfe7dd)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-card2, #f8faf6)', borderBottom: '1px solid var(--border, #dfe7dd)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Product Model</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Capacity</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Refrigerant & Charge</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>PCR Standard</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>GWP Total</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)' }}>Status</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => {
                    const isVerified = p.status === 'Verified EPD';
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid var(--border, #dfe7dd)',
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)' }}>{p.product_model || 'Model #19DV-500RT'}</div>
                        </td>

                        <td style={{ padding: '14px 20px', fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>
                          <span style={{ fontWeight: 600 }}>{p.capacity_rt} RT</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)', marginLeft: '4px' }}>
                            ({Math.round(p.capacity_rt * 3.517)} kW)
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(31, 122, 76, 0.08)',
                              color: 'var(--accent, #1f7a4c)',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            {p.refrigerant}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)', marginTop: '3px' }}>
                            {p.refrigerant_charge_kg} kg charge
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary, #2f3b33)' }}>
                          {p.standard}
                        </td>

                        <td style={{ padding: '14px 20px', fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary, #16231b)' }}>
                            {p.gwp_total.toLocaleString()} kg CO₂e
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)' }}>
                            {(p.gwp_total / p.capacity_rt).toFixed(1)} kg / RT
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: isVerified ? '#eaf7ee' : 'rgba(217, 119, 6, 0.1)',
                              color: isVerified ? '#1f7a4c' : '#b45309',
                            }}
                          >
                            {isVerified && <CheckIcon size={12} />}
                            {p.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <Link
                            to={`/app/projects/${p.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--accent, #1f7a4c)',
                              textDecoration: 'none',
                            }}
                          >
                            <span>Open in Studio</span>
                            <ExternalLinkIcon size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View: Published EPDs */}
      {activeTab === 'epds' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '16px',
          }}
        >
          {rawEpds.map((epd) => (
            <div
              key={epd.id}
              style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--border, #dfe7dd)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent, #1f7a4c)',
                      backgroundColor: 'rgba(31, 122, 76, 0.08)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {epd.epd_number}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)' }}>
                    Valid until: {epd.valid_until}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #16231b)', margin: '0 0 8px' }}>
                  {epd.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted, #5b6f62)', margin: '0 0 16px', lineHeight: 1.45 }}>
                  Functional unit: {epd.functional_unit}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #5b6f62)' }}>Program Operator</span>
                    <span style={{ fontWeight: 600 }}>{epd.program_operator}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #5b6f62)' }}>Third-Party Verifier</span>
                    <span style={{ fontWeight: 600 }}>{epd.verifier} ({epd.verifier_org})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #5b6f62)' }}>Total GWP (Module A-D)</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent, #1f7a4c)' }}>{epd.gwp_total.toLocaleString()} kg CO₂e</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border, #dfe7dd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #5b6f62)' }}>DQR Score: {epd.dqr_score}</span>
                <Link
                  to="/app/epds"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--accent, #1f7a4c)',
                    textDecoration: 'none',
                  }}
                >
                  View Certificate →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Facility Assembly Configuration */}
      {activeTab === 'facility' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #dfe7dd)',
            padding: '28px',
            maxWidth: '800px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0, color: 'var(--text-primary, #16231b)' }}>
                Plant LCI Assembly Configuration
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #5b6f62)', margin: '4px 0 0' }}>
                Defines the regional emission factors and baseline background databases applied to all projects in this organization.
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent, #1f7a4c)',
                backgroundColor: 'rgba(31, 122, 76, 0.08)',
                padding: '4px 10px',
                borderRadius: '9999px',
              }}
            >
              Verified Facility
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', marginBottom: '4px' }}>
                Manufacturing Facility Name
              </label>
              <input
                type="text"
                readOnly={!isAccountAdmin}
                defaultValue={accountData.facility_name}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #dfe7dd)',
                  fontSize: '13px',
                  backgroundColor: isAccountAdmin ? '#ffffff' : 'var(--bg-card2, #f8faf6)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', marginBottom: '4px' }}>
                Regional Electricity Grid Subregion
              </label>
              <input
                type="text"
                readOnly={!isAccountAdmin}
                defaultValue={accountData.database_assembly?.grid_mix_name}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #dfe7dd)',
                  fontSize: '13px',
                  backgroundColor: isAccountAdmin ? '#ffffff' : 'var(--bg-card2, #f8faf6)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', marginBottom: '4px' }}>
                  Grid Emission Factor (kg CO₂e / kWh)
                </label>
                <input
                  type="number"
                  step="0.001"
                  readOnly={!isAccountAdmin}
                  defaultValue={accountData.database_assembly?.grid_emission_factor}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #dfe7dd)',
                    fontSize: '13px',
                    backgroundColor: isAccountAdmin ? '#ffffff' : 'var(--bg-card2, #f8faf6)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #2f3b33)', marginBottom: '4px' }}>
                  Default Refrigerant Spectrum
                </label>
                <input
                  type="text"
                  readOnly={!isAccountAdmin}
                  defaultValue={accountData.database_assembly?.default_refrigerant || 'R1233zd'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #dfe7dd)',
                    fontSize: '13px',
                    backgroundColor: isAccountAdmin ? '#ffffff' : 'var(--bg-card2, #f8faf6)',
                  }}
                />
              </div>
            </div>

            {isAccountAdmin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button onClick={() => alert('Facility assembly settings saved for this organization.')}>
                  Save Assembly Parameters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

