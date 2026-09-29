import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStudio, ALL_METHODOLOGIES, getMethodology } from '../../../context/StudioContext';
import { indicatorPassesFilter } from '../../../data/lciaMethodologies';
import { ResultsIcon, ChevronRightIcon, CheckIcon, RefreshCwIcon, SearchIcon } from '../Icons';
import LciaSearchFilter from '../LciaSearchFilter';
import ProcessFlowModal from '../ProcessFlowModal';

export default function ResultsView() {
  const {
    lca,
    selectedMethodology,
    changeMethodology,
    setActivePhase,
    showNotif,
    isLoading,
    runCalculation,
    generateNsfDocument,
    extractedData,
  } = useStudio();

  const [showFullBreakdown, setShowFullBreakdown] = useState(false);
  // 'all' | 'pcr' | 'gpi'
  const [indicatorFilter, setIndicatorFilter] = useState('all');

  const FILTER_OPTIONS = [
    { id: 'all', label: 'All Indicators',  desc: 'Show all 25 computed impact categories' },
    { id: 'pcr', label: 'PCR Mandatory',   desc: 'EN 15804+A2 + UL 10010-4 required (16 indicators)' },
    { id: 'gpi', label: 'GPI Core',        desc: 'International EPD System primary page (6 indicators)' },
  ];

  const [viewMode, setViewMode] = useState('pcr'); // 'pcr' | 'all'
  const [displayedIndicators, setDisplayedIndicators] = useState([]);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [normMode, setNormMode] = useState('fu'); // 'fu' = per 1 ton chilling capacity | 'declared' = full machine declared unit

  const capacityRt = Number(extractedData?.operational?.capacity_rt || extractedData?.project_info?.capacity_rt || 500);
  const normFactor = normMode === 'fu' ? Math.max(1, capacityRt) : 1;

  // Auto-run genuine characterization if results not calculated yet but BOM exists
  useEffect(() => {
    if (!lca.isCalculated && !isLoading && extractedData?.bom && extractedData.bom.length > 0) {
      runCalculation();
    }
  }, [lca.isCalculated, isLoading, extractedData?.bom, runCalculation]);

  // Strict 3-significant-figure scientific notation per SKILL.md (e.g. 3.30E-01)
  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    const rawNum = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(rawNum) || !isFinite(rawNum)) return '—';
    if (rawNum === 0) return '0.00E+00';
    const num = rawNum / normFactor;
    return num.toExponential(2).toUpperCase();
  };

  const currentMethod = getMethodology(selectedMethodology);

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    try {
      const cleanQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${cleanQ})`, 'gi');
      const parts = String(text).split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: 'rgba(230, 162, 60, 0.4)', color: 'var(--text-primary)', padding: '0 3px', borderRadius: '3px', fontWeight: 700 }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const baseIndicators = displayedIndicators.length > 0 || activeSearchTerm ? displayedIndicators : lca.indicators;
  const activeRows = useMemo(
    () => baseIndicators.filter(ind => indicatorPassesFilter(ind.rawCategory || ind.name || ind.code, indicatorFilter)),
    [baseIndicators, indicatorFilter]
  );

  return (
    <div className="view-container">
      {/* Apple View Header */}
      <div className="apple-view-header">
        <div>
          <span className="apple-eyebrow">Phase 6 • Impact Characterization</span>
          <h1 className="view-title" style={{ margin: 0, fontFamily: 'var(--font-display, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif)', letterSpacing: '-0.022em' }}>
            Life Cycle Impact Assessment Results
          </h1>
          <p className="view-subtitle" style={{ marginTop: '4px', marginBottom: 0, color: 'var(--text-secondary, #86868b)' }}>
            Environmental indicators computed via ecoinvent v3.12 Cut-off model &amp; UL 10010-4 characterization rules.
          </p>
        </div>

        <div className="apple-header-action-group">
          {/* Apple Segmented Normalization Toggle */}
          <div className="apple-segmented-tabs" style={{ padding: '3px' }}>
            <button
              type="button"
              className={`apple-segmented-tab ${normMode === 'fu' ? 'active' : ''}`}
              onClick={() => setNormMode('fu')}
              title="Normalized per 1 ton chilling capacity over 25 yr RSL (UL 10010-4 §3.1)"
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              <span>Per 1 Ton (FU)</span>
            </button>
            <button
              type="button"
              className={`apple-segmented-tab ${normMode === 'declared' ? 'active' : ''}`}
              onClick={() => setNormMode('declared')}
              title={`Declared Machine Total (${capacityRt} RT)`}
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              <span>Declared ({capacityRt} RT)</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={() => runCalculation()}
            disabled={isLoading}
            style={{ fontSize: '12px' }}
          >
            <RefreshCwIcon size={13} className={isLoading ? 'spin' : ''} />
            <span>Recalculate</span>
          </button>

          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={() => setIsFlowModalOpen(true)}
            style={{ fontSize: '12px', color: '#0066cc' }}
          >
            <span>Entanglement &amp; PCR Audit</span>
          </button>

          {/* Interactive Quick Methodology Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #e0e0e0' }}>
            <span style={{ fontSize: '10px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase' }}>
              Method:
            </span>
            <select
              className="form-input"
              value={selectedMethodology}
              onChange={(e) => {
                changeMethodology(e.target.value);
                showNotif(`Characterized using ${getMethodology(e.target.value)?.name || e.target.value}`, 'Methodology Updated');
              }}
              style={{ padding: '2px 4px', fontSize: '11px', height: 'auto', background: 'transparent', border: 'none', fontWeight: 600, color: '#0066cc', cursor: 'pointer', maxWidth: '320px' }}
            >
              {['EF / PEF', 'TRACI', 'IPCC', 'ReCiPe', 'CML', 'USEtox', 'Energy & Resources', 'Other'].map((groupName) => {
                const items = ALL_METHODOLOGIES.filter((m) => m.group === groupName);
                if (!items.length) return null;
                return (
                  <optgroup key={groupName} label={`${groupName} (${items.length})`}>
                    {items.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.recommended ? '★ ' : ''}{m.name} ({m.standard})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Processing Status Banner */}
      {isLoading && (
        <div className="card" style={{ padding: '20px 24px', textAlign: 'center', marginBottom: 24, border: '1px solid #e0e0e0', background: '#fafafc', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <RefreshCwIcon size={18} className="spin" style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
              Computing Characterization Factors with ecoinvent v3.12...
            </span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
            Dynamically characterizing all lifecycle modules (A1–A5, B1–B7, C1–C4, Module D) for {currentMethod?.name || selectedMethodology}.
          </p>
        </div>
      )}

      {!isLoading && !lca.isCalculated && (!extractedData?.bom || extractedData.bom.length === 0) && (
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 24, background: 'var(--bg-card2)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 8 }}>Awaiting Equipment Data</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 16px' }}>
            No bill of materials or equipment specifications are loaded yet. Upload your engineering documents or load sample data in Step 1 to characterize environmental impacts.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setActivePhase('upload')}
          >
            Go to Upload Documents
          </button>
        </div>
      )}

      {/* Top KPI Header Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="apple-card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            A1 Raw Materials
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#0066cc', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', margin: '4px 0', letterSpacing: '-0.02em' }}>
            {formatValue(lca.a1_gwp)}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>kg CO₂e{normMode === 'fu' ? ' / ton' : ''}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>BOM supply chain extraction</div>
        </div>

        <div className="apple-card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            A2 Inbound Logistics
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', margin: '4px 0', letterSpacing: '-0.02em' }}>
            {formatValue(lca.a2_gwp)}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>kg CO₂e{normMode === 'fu' ? ' / ton' : ''}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>Freight logistics legs</div>
        </div>

        <div className="apple-card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            A3 Manufacturing
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', margin: '4px 0', letterSpacing: '-0.02em' }}>
            {formatValue(lca.a3_gwp)}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>kg CO₂e{normMode === 'fu' ? ' / ton' : ''}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>Plant electricity &amp; natural gas</div>
        </div>

        <div className="apple-card" style={{ padding: '16px 18px', margin: 0 }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cradle-to-Gate (A1–A3)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', margin: '4px 0', letterSpacing: '-0.02em' }}>
            {formatValue((lca.a1_gwp || 0) + (lca.a2_gwp || 0) + (lca.a3_gwp || 0))}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>kg CO₂e{normMode === 'fu' ? ' / ton' : ''}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>Total Upstream Production</div>
        </div>

        <div className="apple-card" style={{ padding: '16px 18px', margin: 0, backgroundColor: '#fbfbfd', border: '1px solid #d2d2d7' }}>
          <div style={{ fontSize: '11px', color: '#0066cc', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cradle-to-Grave (A1–C4)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums', margin: '4px 0', letterSpacing: '-0.02em' }}>
            {formatValue(lca.total_gwp)}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>kg CO₂e{normMode === 'fu' ? ' / ton' : ''}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#86868b' }}>Total Lifecycle GWP</div>
        </div>
      </div>

      {/* Dynamic LCIA Search, Fuzzy Acronym Lookup, & Matrix Toggle */}
      <LciaSearchFilter
        indicators={lca.indicators || []}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFilteredIndicatorsChange={(filtered, query) => {
          setDisplayedIndicators(filtered);
          setActiveSearchTerm(query);
        }}
      />

      {/* Characterized Matrix Table */}
      <div className="apple-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1d1d1f' }}>
              {viewMode === 'pcr' ? 'Standard PCR Environmental Matrix' : 'Full LCIA Environmental Matrix'}
            </span>
            <span style={{ fontSize: '12px', color: '#86868b', marginLeft: 8 }}>
              ({currentMethod.name} — {activeRows.length} displayed • {normMode === 'fu' ? 'Normalized per 1 ton chilling capacity' : `Machine Total ${capacityRt} RT`})
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {lca.isCalculated && (
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#28cd41', backgroundColor: '#eafaf1', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(40, 205, 65, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckIcon size={11} color="#28cd41" /> {activeRows.length} indicator{activeRows.length !== 1 ? 's' : ''} shown (ecoinvent LCI)
              </span>
            )}

            {/* PCR / GPI Filter Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px',
                gap: 2,
              }}
              role="group"
              aria-label="Indicator filter"
            >
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.desc}
                  aria-pressed={indicatorFilter === opt.id}
                  onClick={() => setIndicatorFilter(opt.id)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    background: indicatorFilter === opt.id ? 'var(--accent)' : 'transparent',
                    color: indicatorFilter === opt.id ? '#fff' : 'var(--text-muted)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-apple-secondary-pill"
              onClick={() => setShowFullBreakdown(!showFullBreakdown)}
              style={{ fontSize: '11px', padding: '4px 12px' }}
            >
              {showFullBreakdown ? 'Summary View' : 'Full Stage Breakdown (A1–D)'}
            </button>
          </div>
        </div>

        <div className="data-table-wrapper" style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="apple-table" aria-label="Environmental Indicators Matrix" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '90px', position: 'sticky', left: 0, background: '#fafafc', zIndex: 2 }}>Indicator</th>
                <th style={{ minWidth: '220px' }}>Impact Category Name</th>
                <th style={{ minWidth: '90px' }}>Unit</th>
                <th className="num" style={{ color: '#0066cc', fontWeight: 600 }}>A1</th>
                <th className="num" style={{ color: '#1d1d1f', fontWeight: 600 }}>A2</th>
                <th className="num" style={{ color: '#1d1d1f', fontWeight: 600 }}>A3</th>
                <th className="num" style={{ fontWeight: 600, background: '#f5f5f7' }}>A1–A3</th>
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
                <th className="num" style={{ fontWeight: 600, background: '#f5f5f7' }}>C1–C4</th>
                <th className="num" style={{ color: '#28cd41', fontWeight: 600 }} title="Module D is MND (Module Not Declared) baseline under UL 10010-4 and presented separately">
                  Module D (MND)
                </th>
                <th className="num" style={{ fontWeight: 700, color: '#0066cc' }}>A1–C4 Total</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.length === 0 ? (
                <tr>
                  <td colSpan={23} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--text-muted)' }}>
                      <SearchIcon size={24} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      No matching indicators found {activeSearchTerm ? `for "${activeSearchTerm}"` : 'for the selected filter'}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>
                      Try adjusting your search query, switching to "All Indicators", or selecting Full LCIA Matrix View.
                    </div>
                  </td>
                </tr>
              ) : (
                activeRows.map((ind) => {
                  const isGwp = ind.code === 'GWP100' || ind.name.toLowerCase().includes('global warming');

                  return (
                    <tr key={ind.rawCategory || ind.code} style={{ background: isGwp ? 'var(--accent-dim)' : undefined }}>
                      <td style={{ sticky: 'left', background: 'var(--bg-card)', zIndex: 1 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'var(--text-2xs)', color: 'var(--accent)' }}>
                          {highlightMatch(ind.code, activeSearchTerm)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: isGwp ? 600 : 400 }}>
                            {highlightMatch(ind.name, activeSearchTerm)}
                          </span>
                          {ind.category && ind.category !== 'General' && ind.category !== ind.name && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              Category: {highlightMatch(ind.category, activeSearchTerm)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="item-badge" style={{ fontSize: '0.65rem' }}>{ind.unit}</span>
                      </td>
                      <td className="num">{formatValue(ind.a1)}</td>
                      <td className="num">{formatValue(ind.a2)}</td>
                      <td className="num">{formatValue(ind.a3)}</td>
                      <td className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>{formatValue(ind.a1a3)}</td>
                      <td className="num">{formatValue(ind.a4)}</td>
                      <td className="num">{formatValue(ind.a5)}</td>
                      <td className="num">{formatValue(ind.b1)}</td>
                      <td className="num">{formatValue(ind.b2)}</td>
                      <td className="num">{formatValue(ind.b3)}</td>
                      <td className="num">{formatValue(ind.b4)}</td>
                      <td className="num">{formatValue(ind.b5)}</td>
                      <td className="num">{formatValue(ind.b6)}</td>
                      <td className="num">{formatValue(ind.b7)}</td>
                      <td className="num">{formatValue(ind.c1)}</td>
                      <td className="num">{formatValue(ind.c2)}</td>
                      <td className="num">{formatValue(ind.c3)}</td>
                      <td className="num">{formatValue(ind.c4)}</td>
                      <td className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>{formatValue(ind.c)}</td>
                      <td className="num" style={{ color: ind.d < 0 ? 'var(--success)' : undefined }}>
                        {formatValue(ind.d)}
                      </td>
                      <td className="num" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatValue(ind.total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="btn-apple-secondary-pill"
          onClick={() => setActivePhase('methodology')}
        >
          ← Change Methodology
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={async () => {
              showNotif('Generating official NSF / UL 10010-4 EPD document...', 'Generating EPD');
              await generateNsfDocument();
              setActivePhase('export');
            }}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Generate Official NSF EPD</span>
            <ChevronRightIcon size={14} />
          </button>

          <button
            type="button"
            className="btn-apple-action-blue"
            onClick={() => {
              showNotif('Proceeding to EPD Declaration Certificate', 'Results Confirmed');
              setActivePhase('export');
            }}
          >
            <span>Proceed to Export Suite</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* Supply Chain Entanglement & PCR Audit Modal */}
      <ProcessFlowModal
        isOpen={isFlowModalOpen}
        onClose={() => setIsFlowModalOpen(false)}
      />
    </div>
  );
}

