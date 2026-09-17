import React, { useState, useMemo, useCallback } from 'react';
import { useStudio, ALL_METHODOLOGIES, getMethodology } from '../../../context/StudioContext';
import { MethodologyIcon, CheckIcon, ChevronRightIcon, InfoIcon, RefreshCwIcon, SearchIcon } from '../Icons';
import LciaExtractorSection from '../LciaExtractorSection';

const GROUPS = [
  'All',
  'Recommended',
  'TRACI',
  'EF / PEF',
  'IPCC',
  'ReCiPe',
  'CML',
  'USEtox',
  'Energy & Resources',
  'Other',
];

// Top commonly-used methodologies shown by default (in this order)
const COMMONLY_USED_IDS = ['traci_v2_1', 'ef_v3_1', 'ipcc_2021'];
const INITIAL_VISIBLE = COMMONLY_USED_IDS.length; // 3
const BATCH_SIZE = 12;

export default function MethodologyView() {
  const {
    selectedMethodology,
    changeMethodology,
    runCalculation,
    isLoading,
    setActivePhase,
  } = useStudio();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [activeType, setActiveType] = useState('all'); // 'all', 'midpoint', 'endpoint'

  const activeMethodDetails = getMethodology(selectedMethodology);

  // Group counts for filter tabs
  const groupCounts = useMemo(() => {
    const counts = { All: ALL_METHODOLOGIES.length, Recommended: 0 };
    GROUPS.forEach(g => { if (g !== 'All' && g !== 'Recommended') counts[g] = 0; });

    ALL_METHODOLOGIES.forEach(m => {
      if (m.recommended) counts.Recommended = (counts.Recommended || 0) + 1;
      if (counts[m.group] !== undefined) {
        counts[m.group] += 1;
      }
    });
    return counts;
  }, []);

  // Are any filters/search active?
  const isFiltering = searchQuery.trim() !== '' || activeGroup !== 'All' || activeType !== 'all';

  // Filtered & sorted methodologies
  const filteredMethodologies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = ALL_METHODOLOGIES.filter(m => {
      // Group filter
      if (activeGroup === 'Recommended' && !m.recommended) return false;
      if (activeGroup !== 'All' && activeGroup !== 'Recommended' && m.group !== activeGroup) return false;

      // Type filter
      if (activeType === 'midpoint' && m.category !== 'Midpoint') return false;
      if (activeType === 'endpoint' && m.category !== 'Endpoint') return false;

      // Search query filter
      if (!query) return true;

      const matchName = m.name.toLowerCase().includes(query);
      const matchStandard = m.standard.toLowerCase().includes(query);
      const matchGroup = m.group.toLowerCase().includes(query);
      const matchCategory = m.category.toLowerCase().includes(query);
      const matchDesc = m.desc.toLowerCase().includes(query);
      const matchLt = m.lt.toLowerCase().includes(query);
      const matchIndicators = (m.keyIndicators || []).some(k => k.toLowerCase().includes(query));

      return matchName || matchStandard || matchGroup || matchCategory || matchDesc || matchLt || matchIndicators;
    });

    // When NOT filtering, sort commonly used ones to the top
    if (!query && activeGroup === 'All' && activeType === 'all') {
      const commonly = [];
      const rest = [];
      // Preserve the defined order for commonly-used
      const commonlyMap = new Map();
      filtered.forEach(m => commonlyMap.set(m.id, m));
      COMMONLY_USED_IDS.forEach(id => {
        if (commonlyMap.has(id)) commonly.push(commonlyMap.get(id));
      });
      filtered.forEach(m => {
        if (!COMMONLY_USED_IDS.includes(m.id)) rest.push(m);
      });
      return [...commonly, ...rest];
    }

    return filtered;
  }, [searchQuery, activeGroup, activeType]);

  // The slice of methodologies actually visible on screen
  const visibleMethodologies = useMemo(() => {
    // When user is searching/filtering, show all matches
    if (isFiltering) return filteredMethodologies;
    return filteredMethodologies.slice(0, visibleCount);
  }, [filteredMethodologies, visibleCount, isFiltering]);

  const totalFiltered = filteredMethodologies.length;
  const hasMore = !isFiltering && visibleCount < totalFiltered;
  const remainingCount = totalFiltered - visibleCount;

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, totalFiltered));
  }, [totalFiltered]);

  const handleApplyAndCalculate = async () => {
    await runCalculation();
    setActivePhase('results');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveGroup('All');
    setActiveType('all');
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 20 }}>
        <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MethodologyIcon size={24} style={{ color: 'var(--accent)' }} />
          5. Select Methodology
        </h1>
        <p className="view-subtitle">
          In OpenLCA and EN 15804 standards, characterization factors convert raw Life Cycle Inventory (LCI) elementary flows into verified environmental impact indicators. Select from all 41 ecoinvent v3.12 Cut-off methodologies.
        </p>
      </div>

      {/* Educational Note Box explaining LCIA mechanics */}
      <div
        className="card"
        style={{
          background: 'var(--bg-card2)',
          borderLeft: '4px solid var(--accent)',
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <InfoIcon size={20} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <strong>How LCA Characterization Works:</strong> The calculation engine first compiles all elementary flows (energy, raw resources, direct emissions) from your uploaded documents and ecoinvent 3.12 cutoff.
            When you select a methodology below, standard characterization factors are multiplied across those flows (<code>Impact = &sum; Flow<sub>i</sub> &times; CF<sub>i</sub></code>).
            You can return and switch methodologies at any time to re-characterize without re-uploading documents.
          </div>
        </div>
      </div>

      {/* ── Search and Quick Filters Bar ── */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: 20,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Search Input Box */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div
            style={{
              position: 'relative',
              flex: '1 1 320px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 12,
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 41 methodologies (e.g., TRACI, IPCC, ReCiPe, EF, CML, no LT, GWP)..."
              style={{
                paddingLeft: 38,
                paddingRight: searchQuery ? 32 : 12,
                fontSize: 'var(--text-sm)',
                height: 42,
                borderRadius: 'var(--radius-sm)',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 16,
                  padding: 4,
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Midpoint / Endpoint Quick Scope Toggle */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-card2)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: 'var(--text-2xs)',
              fontWeight: 600,
            }}
          >
            {[
              { id: 'all', label: 'All Scopes' },
              { id: 'midpoint', label: 'Midpoints' },
              { id: 'endpoint', label: 'Endpoints' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveType(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: activeType === t.id ? 'var(--accent)' : 'transparent',
                  color: activeType === t.id ? '#FFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: 4 }}>
            Filter:
          </span>
          {GROUPS.map((grp) => {
            const isSelected = activeGroup === grp;
            const count = groupCounts[grp] || 0;
            return (
              <button
                key={grp}
                type="button"
                onClick={() => setActiveGroup(grp)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(184, 80, 66, 0.1)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{grp}</span>
                <span
                  style={{
                    fontSize: '10px',
                    opacity: 0.75,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count & status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredMethodologies.length}</strong> of {ALL_METHODOLOGIES.length} methodologies
            {searchQuery && <> matching "<span style={{ color: 'var(--accent)' }}>{searchQuery}</span>"</>}
          </span>

          {(searchQuery || activeGroup !== 'All' || activeType !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--text-2xs)',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Section Label for commonly used ── */}
      {!isFiltering && visibleCount <= INITIAL_VISIBLE && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            ⭐ Commonly Used
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}

      {/* ── Methodology Selection Grid ── */}
      {filteredMethodologies.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            marginBottom: 28,
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: 6 }}>
            No methodologies found
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 16 }}>
            No LCIA methodology matches your query "{searchQuery}". Try searching for TRACI, IPCC, ReCiPe, EF, CML, or clear your filters.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleClearFilters}
          >
            Clear Filters &amp; View All 41 Methodologies
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
              marginBottom: hasMore ? 0 : 28,
            }}
          >
            {visibleMethodologies.map((method, idx) => {
              const isSelected =
                selectedMethodology === method.id ||
                selectedMethodology === method.name ||
                (method.alias && selectedMethodology === method.alias);
              const isCommonlyUsed = COMMONLY_USED_IDS.includes(method.id);

              return (
                <React.Fragment key={method.id}>
                  {/* Divider before first non-commonly-used item when expanding */}
                  {!isFiltering && idx === INITIAL_VISIBLE && (
                    <div style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      margin: '8px 0 4px 0',
                    }}>
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        All Methodologies
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  <div
                    onClick={() => changeMethodology(method.id)}
                    style={{
                      background: isSelected ? '#FFFDFB' : 'var(--bg-card)',
                      border: isSelected ? '2px solid var(--accent)' : isCommonlyUsed && !isFiltering ? '1px solid rgba(184, 80, 66, 0.25)' : '1px solid var(--border)',
                      boxShadow: isSelected ? '0 4px 14px rgba(184, 80, 66, 0.16)' : 'var(--shadow-sm)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {/* Active checkmark circle in top right */}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(184, 80, 66, 0.3)',
                        }}
                      >
                        <CheckIcon size={14} />
                      </div>
                    )}

                    <div>
                      {/* Standard & Tag row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4, paddingRight: isSelected ? 24 : 0 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--mono)',
                            color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {method.standard}
                        </span>

                        {/* Commonly Used badge for top picks */}
                        {isCommonlyUsed && !isFiltering && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: 'rgba(34, 139, 34, 0.1)',
                              color: '#228B22',
                              padding: '1px 6px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                            }}
                          >
                            ⭐ Popular
                          </span>
                        )}

                        {method.recommended && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: 'rgba(184, 80, 66, 0.12)',
                              color: 'var(--accent)',
                              padding: '1px 6px',
                              borderRadius: 4,
                              letterSpacing: '0.04em',
                            }}
                          >
                            ★ Recommended
                          </span>
                        )}

                        {method.lt?.includes('no LT') && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '1px 5px',
                              borderRadius: 4,
                            }}
                          >
                            no LT
                          </span>
                        )}
                      </div>

                      {/* Methodology Name */}
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginTop: 4,
                          marginBottom: 8,
                          paddingRight: isSelected ? 24 : 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {method.name}
                      </h3>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          marginBottom: 12,
                        }}
                      >
                        {method.desc}
                      </p>

                      {/* Key Indicators Preview Pills */}
                      {method.keyIndicators && method.keyIndicators.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {method.keyIndicators.slice(0, 3).map((ind, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '10px',
                                background: 'var(--bg-card2)',
                                color: 'var(--text-secondary)',
                                padding: '2px 6px',
                                borderRadius: 3,
                                border: '1px solid var(--border)',
                              }}
                            >
                              {ind}
                            </span>
                          ))}
                          {method.keyIndicators.length > 3 && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                padding: '2px 4px',
                              }}
                            >
                              +{method.keyIndicators.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer metadata */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid var(--border)',
                        paddingTop: 10,
                        marginTop: 6,
                        fontSize: 'var(--text-2xs)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>
                        {method.category} · {method.lt}
                      </span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>
                        {method.indicators} {method.category === 'Endpoint' ? 'Endpoints' : 'Categories'}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Show More / Show Less Button ── */}
          {hasMore && (
            <div style={{ textAlign: 'center', margin: '20px 0 28px 0' }}>
              <button
                type="button"
                onClick={handleShowMore}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 32px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-card2)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                <span>Show More</span>
                <ChevronRightIcon size={14} style={{ transform: 'rotate(90deg)' }} />
              </button>
            </div>
          )}

          {/* Collapse back button when expanded beyond initial */}
          {!isFiltering && visibleCount > INITIAL_VISIBLE && !hasMore && (
            <div style={{ textAlign: 'center', margin: '20px 0 28px 0' }}>
              <button
                type="button"
                onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronRightIcon size={14} style={{ transform: 'rotate(-90deg)' }} />
                Show Less — Back to Commonly Used
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Active Method Preview Card ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 28 }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>Active Package: <strong>{activeMethodDetails.name}</strong></span>
          <span className="item-badge" style={{ marginLeft: 'auto' }}>
            ecoinvent 3.12 cutoff · {activeMethodDetails.standard}
          </span>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
          {activeMethodDetails.desc} Applying this methodology will characterize elementary flows across declared lifecycle stages (A1–A3 Production, A4 Transport, Stage B Use, Stage C EOL, and Module D Circularity Credits).
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(activeMethodDetails.keyIndicators || [
            'GWP-total', 'ODP', 'Acidification (AP)', 'Eutrophication (EP)', 'POCP', 'ADP-minerals', 'ADP-fossil', 'Water Deprivation (WDP)'
          ]).map((ind, i) => (
            <span key={i} className="format-tag">{ind}</span>
          ))}
        </div>
      </div>

      {/* Optional Live ecoinvent LCIA Extractor for direct ad-hoc exploration */}
      <LciaExtractorSection />

      {/* ── Action Footer ── */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={() => setActivePhase('validate')}
        >
          Back to Validation
        </button>

        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={handleApplyAndCalculate}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCwIcon size={16} className="spin-anim" />
              <span>Applying Characterization Factors...</span>
            </>
          ) : (
            <>
              <span>Calculate &amp; View Results ({activeMethodDetails.name})</span>
              <ChevronRightIcon size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
