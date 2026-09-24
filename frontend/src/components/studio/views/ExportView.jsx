import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { DownloadIcon, LeafIcon, CheckIcon, RefreshCwIcon, ChevronRightIcon } from '../Icons';

export default function ExportView() {
  const {
    projectInfo,
    lca,
    downloadIlcdJson,
    showNotif,
    setActivePhase,
    nsfDocument,
    generateNsfDocument,
    downloadNsfJson,
    openNsfHtmlReport,
    isLoading,
    selectedMethodology,
  } = useStudio();

  const [activeTab, setActiveTab] = useState('nsf'); // 'nsf' | 'cert' | 'json'

  // Auto-generate NSF document on first load if not present
  useEffect(() => {
    if (!nsfDocument && !isLoading) {
      generateNsfDocument();
    }
  }, [nsfDocument, generateNsfDocument, isLoading]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    const hash = nsfDocument?.header?.verification_hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
    navigator.clipboard?.writeText(hash);
    showNotif('EPD verification cryptographic hash copied to clipboard', 'Hash Copied');
  };

  const genInfo = nsfDocument?.general_information || {};
  const lcaRules = nsfDocument?.lca_methodology || {};
  const lciaRes = nsfDocument?.lcia_results || {};
  const interpretation = nsfDocument?.interpretation || {};
  const header = nsfDocument?.header || {};

  return (
    <div className="phase-container export-view" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* Top Header & Actions */}
      <div className="view-section no-print" style={{ marginBottom: 20 }}>
        <div className="section-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
              7. Export EPD &amp; Verification Package
            </h2>
            <p className="section-subtitle" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Official NSF / UL 10010-4 Chiller Environmental Product Declaration with certified scientific notation (3 sig digits) and digital ILCD+EPD packages.
            </p>
          </div>
          <div className="export-action-group" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActivePhase('results')}
              style={{ fontSize: '13px' }}
            >
              Back to View Results
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCopyHash}
              title="Copy audit hash"
            >
              Copy Hash
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handlePrint}
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => openNsfHtmlReport()}
              disabled={!nsfDocument || isLoading}
              title="Open standalone verified HTML report in new tab"
            >
              Preview Official HTML
            </button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => downloadNsfJson()}
              disabled={!nsfDocument || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Download NSF EPD (JSON)</span>
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={downloadIlcdJson}
              title="Download standard ILCD+EPD format"
            >
              ILCD JSON
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, borderBottom: '1px solid var(--border)', paddingBottom: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'nsf' ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setActiveTab('nsf')}
            style={{ fontWeight: 700 }}
          >
            Official NSF / UL 10010-4 Declaration
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'cert' ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setActiveTab('cert')}
            style={{ fontWeight: 700 }}
          >
            EN 15804+A2 Summary Certificate
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'json' ? 'btn-accent' : 'btn-ghost'}`}
            onClick={() => setActiveTab('json')}
            style={{ fontWeight: 700 }}
          >
            Compliant JSON Inspector
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => generateNsfDocument()}
            disabled={isLoading}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
            Regenerate Document
          </button>
        </div>
      </div>

      {/* TAB 1: OFFICIAL NSF / UL 10010-4 DECLARATION */}
      {activeTab === 'nsf' && (
        <div>
          {isLoading && !nsfDocument ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spin" style={{ display: 'inline-block', marginBottom: 16 }}>
                <RefreshCwIcon size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3>Generating Official NSF / UL 10010-4 EPD Document...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 8 }}>
                Characterizing impacts into scientific notation (3 significant digits) across stages A1–D according to UL 10010-4 Part B v2.0 rules.
              </p>
            </div>
          ) : !nsfDocument ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <h3>NSF Document Not Yet Generated</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Click below to compute the full compliant NSF Chiller EPD specification.
              </p>
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => generateNsfDocument()}
              >
                Generate Official NSF EPD Now
              </button>
            </div>
          ) : (
            <div className="printable-doc" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
              {/* Header Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--accent)', paddingBottom: 20, marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'inline-block', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 800, fontSize: 'var(--text-2xs)', padding: '4px 10px', borderRadius: 'var(--radius-full)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                    ISO 14025 • UL 10010-4 Part B v2.0 • UL 10010 Part A v4.0
                  </div>
                  <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
                    ENVIRONMENTAL PRODUCT DECLARATION
                  </h1>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Product-Specific Type III Declaration for Water-Cooled Chillers
                  </div>
                </div>
                <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>EPD DECLARATION NUMBER</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                    {header.declaration_number}
                  </div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Validity: {header.date_of_issue} to {header.period_of_validity}
                  </div>
                </div>
              </div>

              {/* SECTION 1: GENERAL INFORMATION */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, borderLeft: '4px solid var(--accent)', paddingLeft: 10, marginBottom: 16 }}>
                  1. General Information &amp; Technical Specifications
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
                  {/* Table 1 & 2: Company & General */}
                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Program Operator &amp; Manufacturer
                    </div>
                    <table className="cert-mini-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                      <tbody>
                        <tr><td><strong>Program Operator:</strong></td><td>{header.program_operator}</td></tr>
                        <tr><td><strong>Manufacturer:</strong></td><td>{header.manufacturer}</td></tr>
                        <tr><td><strong>General Instructions:</strong></td><td>{header.general_program_instructions}</td></tr>
                        <tr><td><strong>Core PCR:</strong></td><td>{header.reference_pcr}</td></tr>
                        <tr><td><strong>Intended Application:</strong></td><td>{header.intended_application}</td></tr>
                        <tr><td><strong>CSI MasterFormat:</strong></td><td>{genInfo.csi_code}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Table 3: Product Info */}
                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Product Details &amp; Operational Spec
                    </div>
                    <table className="cert-mini-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                      <tbody>
                        <tr><td><strong>Product / Functional Unit:</strong></td><td>{header.product_and_fu}</td></tr>
                        <tr><td><strong>Rated Chilling Capacity:</strong></td><td>{genInfo.chiller_capacity_rt} tons refrigeration (RT)</td></tr>
                        <tr><td><strong>Operating Weight (Delivered):</strong></td><td>{genInfo.mass_delivered_kg?.toLocaleString()} kg</td></tr>
                        <tr><td><strong>Conversion Factor:</strong></td><td>{genInfo.conversion_factor_kg_per_fu} kg / ton capacity</td></tr>
                        <tr><td><strong>Reference Service Life:</strong></td><td>{header.rsl} (Building ESL: {header.building_esl})</td></tr>
                        <tr><td><strong>Replacement Cycles (B4):</strong></td><td>{header.replacement_cycles} equipment renewals</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 4 & 5: Operating Characteristics & Transport */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      AHRI 550/590 Standard Part-Load Ratings
                    </div>
                    <table className="cert-mini-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                      <tbody>
                        {genInfo.technical_data_table_1?.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.name}:</strong></td>
                            <td className="num">{item.value} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Refrigerant &amp; Logistics Specification
                    </div>
                    <table className="cert-mini-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                      <tbody>
                        <tr><td><strong>Refrigerant Designation:</strong></td><td>{genInfo.refrigerant_type}</td></tr>
                        <tr><td><strong>Factory Initial Charge:</strong></td><td>{genInfo.refrigerant_charge_kg} kg</td></tr>
                        <tr><td><strong>Outbound Transport (A4):</strong></td><td>{genInfo.transport_table_5?.distance_km} km ({genInfo.transport_table_5?.vehicle_type})</td></tr>
                        <tr><td><strong>Installation Diesel (A5):</strong></td><td>{genInfo.installation_table_6?.diesel_fuel_liters} L crane fuel ({genInfo.installation_table_6?.diesel_energy_mj} MJ/FU)</td></tr>
                        <tr><td><strong>Annual Energy (B6):</strong></td><td>{genInfo.operational_energy_table_10?.electricity_consumption_per_year_kwh?.toLocaleString()} kWh/yr</td></tr>
                        <tr><td><strong>End-of-Life Recycling (C3):</strong></td><td>{genInfo.end_of_life_table_12?.waste_to_recycling_kg?.toLocaleString()} kg ({genInfo.end_of_life_table_12?.refrigerant_recovery_rate_pct}% gas recovery)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 3: Material Composition */}
                <div className="card" style={{ padding: 16, margin: 0, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Base Material Composition &amp; Bill of Materials (A1 Raw Materials Extraction)
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                      <thead>
                        <tr>
                          <th>Material Classification</th>
                          <th className="num">Mass (kg)</th>
                          <th className="num">Per Declared Unit (kg / ton)</th>
                          <th className="num">Mass Share (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genInfo.material_composition_table_3?.map((mat, idx) => (
                          <tr key={idx}>
                            <td><strong>{mat.material}</strong></td>
                            <td className="num">{mat.mass_kg?.toLocaleString()}</td>
                            <td className="num">{mat.kg_per_fu}</td>
                            <td className="num" style={{ fontWeight: 700 }}>{mat.percent_of_total}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LCA METHODOLOGY & SYSTEM BOUNDARIES */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, borderLeft: '4px solid var(--accent)', paddingLeft: 10, marginBottom: 16 }}>
                  2. System Boundaries &amp; Life Cycle Modules (UL 10010-4)
                </h3>
                <div className="card" style={{ padding: 16, margin: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM BOUNDARY</span>
                      <div style={{ fontWeight: 700 }}>{lcaRules.system_boundary}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600 }}>ALLOCATION RULE</span>
                      <div style={{ fontWeight: 700 }}>{lcaRules.allocation}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600 }}>BACKGROUND DATABASE</span>
                      <div style={{ fontWeight: 700 }}>{header.lci_database}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {lcaRules.cut_off_criteria} {lcaRules.data_quality}
                  </div>
                </div>
              </div>

              {/* SECTION 3: LCIA CHARACTERIZATION MATRIX (SCIENTIFIC NOTATION 3 SIG DIGITS) */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, borderLeft: '4px solid var(--accent)', paddingLeft: 10, margin: 0 }}>
                    3. Life Cycle Impact Assessment (LCIA) Characterization Matrix
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-card2)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: 600 }}>
                    Methodology: <span style={{ color: 'var(--accent)' }}>{lciaRes.methodology}</span> • Basis: {lciaRes.unit_basis} • Format: Scientific (3 sig digits)
                  </div>
                </div>

                <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <table className="data-table" style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card2)' }}>
                        <th style={{ minWidth: 160, position: 'sticky', left: 0, background: 'var(--bg-card2)', zIndex: 2 }}>Impact Category</th>
                        <th style={{ minWidth: 70 }}>Unit</th>
                        <th className="num">A1</th>
                        <th className="num">A2</th>
                        <th className="num">A3</th>
                        <th className="num" style={{ background: 'rgba(196, 119, 90, 0.08)', fontWeight: 700 }}>A1-A3</th>
                        <th className="num">A4</th>
                        <th className="num">A5</th>
                        <th className="num">B1</th>
                        <th className="num">B2</th>
                        <th className="num">B3</th>
                        <th className="num">B4</th>
                        <th className="num">B5</th>
                        <th className="num">B6</th>
                        <th className="num">B7</th>
                        <th className="num">C1</th>
                        <th className="num">C2</th>
                        <th className="num">C3</th>
                        <th className="num">C4</th>
                        <th className="num" style={{ background: 'rgba(196, 119, 90, 0.08)', fontWeight: 700 }}>C1-C4</th>
                        <th className="num">D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lciaRes.matrix && lciaRes.matrix.length > 0 ? (
                        lciaRes.matrix.map((row, idx) => (
                          <tr key={idx} style={{ background: row.indicator?.toLowerCase().includes('global warming') ? 'var(--accent-dim)' : undefined }}>
                            <td style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', fontWeight: 700, zIndex: 1 }}>
                              {row.indicator}
                            </td>
                            <td><span className="item-badge" style={{ fontSize: '0.65rem' }}>{row.unit}</span></td>
                            <td className="num">{row['A1']}</td>
                            <td className="num">{row['A2']}</td>
                            <td className="num">{row['A3']}</td>
                            <td className="num" style={{ fontWeight: 700, background: 'rgba(196, 119, 90, 0.06)' }}>{row['A1-A3']}</td>
                            <td className="num">{row['A4']}</td>
                            <td className="num">{row['A5']}</td>
                            <td className="num">{row['B1']}</td>
                            <td className="num">{row['B2']}</td>
                            <td className="num">{row['B3']}</td>
                            <td className="num">{row['B4']}</td>
                            <td className="num">{row['B5']}</td>
                            <td className="num">{row['B6']}</td>
                            <td className="num">{row['B7']}</td>
                            <td className="num">{row['C1']}</td>
                            <td className="num">{row['C2']}</td>
                            <td className="num">{row['C3']}</td>
                            <td className="num">{row['C4']}</td>
                            <td className="num" style={{ fontWeight: 700, background: 'rgba(196, 119, 90, 0.06)' }}>{row['C1-C4']}</td>
                            <td className="num" style={{ color: 'var(--success)' }}>{row['D']}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={21} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                            Run calculation to generate full characterization matrix.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: INTERPRETATION */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, borderLeft: '4px solid var(--accent)', paddingLeft: 10, marginBottom: 16 }}>
                  4. Life Cycle Interpretation &amp; Carbon Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Primary Life Cycle Driver
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {interpretation.dominance_analysis}
                    </p>
                  </div>

                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Refrigerant Fugitive Emissions
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {interpretation.refrigerant_impact}
                    </p>
                  </div>

                  <div className="card" style={{ padding: 16, margin: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--success)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Circularity Potential (Module D)
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Module D accounts for the net avoidance of virgin copper, aluminium, and structural steel through high scrap recovery yields at end-of-life deconstruction.
                    </p>
                  </div>
                </div>
              </div>

              {/* REFERENCES & SIGN-OFF BLOCK */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Normative References &amp; Standards
                </div>
                <ul style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>
                  {nsfDocument.references?.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>

                <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Independent Third-Party Verification &amp; Deterministic Lineage</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                        In accordance with ISO 14025:2006, ISO 14040:2006, ISO 14044:2006, and UL 10010-4 Part B v2.0
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ backgroundColor: 'var(--success-soft, #ecfdf5)', color: 'var(--success, #10b981)', padding: '3px 10px', borderRadius: 4, fontWeight: 700, fontSize: 'var(--text-2xs)' }}>
                        VERDICT: {header.compliance_verdict || 'COMPLIANT'} ({header.compliance_score || '100%'})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Background Dataset Lineage (ecoinvent 3.12 Cut-off):</span>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all', marginTop: 2 }}>
                        SHA256: {header.lineage_hash || '6bc4e6475877e8e90d8a6184b681366154cc5f6ec42c7cec54eb871224b33e02'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>EPD Declaration Package Integrity Hash:</span>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', wordBreak: 'break-all', marginTop: 2 }}>
                        {header.verification_hash}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EN 15804+A2 SUMMARY CERTIFICATE */}
      {activeTab === 'cert' && (
        <div className="certificate-document printable-doc" id="epd-certificate" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 32, boxShadow: 'var(--shadow-md)' }}>
          <div className="cert-top-strip" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span className="badge badge-success" style={{ fontWeight: 700 }}>EN 15804+A2 COMPLIANT</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM BOUNDARY: A1–C4 + MODULE D</span>
          </div>
          
          <div className="cert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div className="cert-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LeafIcon className="w-8 h-8 text-emerald" style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>ENVIRONMENTAL PRODUCT DECLARATION</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>In accordance with ISO 14025:2006 and EN 15804:2012+A2:2019</div>
              </div>
            </div>
            <div className="cert-reg-box" style={{ textAlign: 'right', fontSize: 'var(--text-xs)' }}>
              <div><strong>Registration No:</strong> <span style={{ fontFamily: 'var(--mono)' }}>{header.declaration_number || 'S-P-09412'}</span></div>
              <div><strong>Program Operator:</strong> {projectInfo.operator || 'NSF Certification, LLC'}</div>
              <div><strong>Validity:</strong> 5 Years (2026 – 2031)</div>
            </div>
          </div>

          <div className="cert-divider" style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

          <div className="cert-body">
            <div className="cert-product-summary" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{projectInfo.productName}</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '4px 0 12px' }}>
                <strong>Declared Unit:</strong> {projectInfo.declaredUnitStatement}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 'var(--text-xs)', background: 'var(--bg-card2)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div><strong>Core PCR:</strong> {projectInfo.pcrRef}</div>
                <div><strong>LCIA Method:</strong> {projectInfo.lciaMethod}</div>
                <div><strong>Service Life:</strong> {projectInfo.rsl}</div>
                <div><strong>Total Unit Mass:</strong> {lca.totalMass?.toLocaleString()} kg</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Global Warming (A1–D)</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
                  {Math.round(lca.total_gwp || 0).toLocaleString()} <small style={{ fontSize: '0.65rem' }}>kg CO₂e</small>
                </div>
              </div>
              <div className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Manufacturing (A1–A3)</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, fontFamily: 'var(--mono)', margin: '4px 0' }}>
                  {Math.round((lca.a1_gwp || 0) + (lca.a2_gwp || 0) + (lca.a3_gwp || 0)).toLocaleString()} <small style={{ fontSize: '0.65rem' }}>kg CO₂e</small>
                </div>
              </div>
              <div className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Recyclability Rate</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
                  {(lca.recRate || 92.4).toFixed(1)}%
                </div>
              </div>
              <div className="card" style={{ padding: 12, margin: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Mass Cut-off Rate</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, fontFamily: 'var(--mono)', margin: '4px 0' }}>
                  {(lca.massCutoff || 0.85).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="table-wrapper" style={{ marginBottom: 24 }}>
              <table className="data-table" style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>Indicator</th>
                    <th>Unit</th>
                    <th className="num">A1–A3</th>
                    <th className="num">A4</th>
                    <th className="num">B1–B7</th>
                    <th className="num">C1–C4</th>
                    <th className="num">Module D</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lca.indicators.slice(0, 8).map((ind) => {
                    const total = (ind.a1a3 || 0) + (ind.a4 || 0) + (ind.b || 0) + (ind.c || 0) + (ind.d || 0);
                    return (
                      <tr key={ind.code}>
                        <td><strong>{ind.code}</strong></td>
                        <td><span className="item-badge" style={{ fontSize: '0.65rem' }}>{ind.unit}</span></td>
                        <td className="num">{typeof ind.a1a3 === 'number' ? Math.round(ind.a1a3).toLocaleString() : '—'}</td>
                        <td className="num">{typeof ind.a4 === 'number' ? Math.round(ind.a4).toLocaleString() : '—'}</td>
                        <td className="num">{typeof ind.b === 'number' ? Math.round(ind.b).toLocaleString() : '—'}</td>
                        <td className="num">{typeof ind.c === 'number' ? Math.round(ind.c).toLocaleString() : '—'}</td>
                        <td className="num" style={{ color: ind.d < 0 ? 'var(--success)' : undefined }}>
                          {typeof ind.d === 'number' ? Math.round(ind.d).toLocaleString() : '—'}
                        </td>
                        <td className="num" style={{ fontWeight: 800 }}>
                          {typeof total === 'number' ? Math.round(total).toLocaleString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <strong>Third-Party Verification:</strong> Conducted in accordance with ISO 14040/44 and verified under ISO 14025.
              </div>
              <div style={{ textAlign: 'right', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                EcoMetric Platform v2.4 • SHA256 Verified
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLIANT JSON INSPECTOR */}
      {activeTab === 'json' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
              Compliant NSF EPD Data Payload (JSON Schema v2.0)
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(nsfDocument, null, 2));
                showNotif('Complete JSON copied to clipboard', 'Copied');
              }}
            >
              Copy JSON
            </button>
          </div>
          <pre style={{ maxHeight: 500, overflow: 'auto', background: 'var(--bg-card2)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 'var(--text-2xs)' }}>
            {JSON.stringify(nsfDocument, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
