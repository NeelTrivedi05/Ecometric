import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';

// Canonical Acronym quick-jump shortcuts
const ACRONYM_SHORTCUTS = [
  { label: 'CO₂ / GWP', query: 'GWP', icon: '🌍' },
  { label: 'Smog / POCP', query: 'Smog', icon: '🌫️' },
  { label: 'Acid Rain (AP)', query: 'Acidification', icon: '🌧️' },
  { label: 'Eutrophication', query: 'Eutrophication', icon: '💧' },
  { label: 'Ozone (ODP)', query: 'Ozone', icon: '🛡️' },
  { label: 'Resources (ADP)', query: 'Abiotic', icon: '⛏️' },
  { label: 'Water Use', query: 'Water', icon: '🚰' },
  { label: 'Toxicity', query: 'Toxicity', icon: '☣️' },
];

// High-level category groupings for filter chips
const CATEGORY_GROUPS = [
  { id: 'all', label: 'All Indicators', match: () => true },
  { id: 'climate', label: 'Climate & Carbon', match: (cat, name) => /climate|carbon|gwp|warming/i.test(`${cat} ${name}`) },
  { id: 'air', label: 'Air & Smog', match: (cat, name) => /photochemical|smog|ozone formation|particulate/i.test(`${cat} ${name}`) },
  { id: 'acid', label: 'Acidification', match: (cat, name) => /acidification|acid rain/i.test(`${cat} ${name}`) },
  { id: 'eutro', label: 'Eutrophication', match: (cat, name) => /eutrophication|nutrients/i.test(`${cat} ${name}`) },
  { id: 'resources', label: 'Resource Depletion', match: (cat, name) => /abiotic|resource|fossil|scarcity|minerals/i.test(`${cat} ${name}`) },
  { id: 'water', label: 'Water Scarcity', match: (cat, name) => /water|deprivation/i.test(`${cat} ${name}`) },
  { id: 'tox', label: 'Toxicity & Health', match: (cat, name) => /tox|cancer|carcinogenic|human health/i.test(`${cat} ${name}`) },
];

export default function LciaSearchFilter({
  indicators = [],
  viewMode = 'pcr', // 'pcr' | 'all'
  onViewModeChange,
  onFilteredIndicatorsChange,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState('all');

  // Debounce user keystrokes for smooth 60fps typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 120);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Base list based on viewMode (PCR Mandatory vs Full Matrix)
  const baseIndicators = useMemo(() => {
    if (viewMode === 'pcr') {
      const pcrOnly = indicators.filter(ind => ind.isMandatory !== false);
      return pcrOnly.length > 0 ? pcrOnly : indicators;
    }
    return indicators;
  }, [indicators, viewMode]);

  // Configure Fuse.js instance for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'category', weight: 0.3 },
        { name: 'code', weight: 0.2 },
        { name: 'acronyms', weight: 0.3 },
        { name: 'rawCategory', weight: 0.1 },
        { name: 'unit', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      includeMatches: true,
    };
    return new Fuse(baseIndicators, options);
  }, [baseIndicators]);

  // Filter and fuzzy search
  const filteredList = useMemo(() => {
    let result = baseIndicators;

    // 1. Category Filter Chip
    if (selectedCategoryGroup !== 'all') {
      const groupSpec = CATEGORY_GROUPS.find(g => g.id === selectedCategoryGroup);
      if (groupSpec) {
        result = result.filter(ind => groupSpec.match(ind.category || '', ind.name || ''));
      }
    }

    // 2. Debounced Search Query
    if (debouncedSearch) {
      // Check for exact acronym shortcut matches (e.g. 'GWP', 'CO2')
      const qLower = debouncedSearch.toLowerCase();
      const acronymDirectMatches = result.filter(ind => {
        const acrs = (ind.acronyms || []).map(a => a.toLowerCase());
        return acrs.includes(qLower) || ind.code?.toLowerCase() === qLower;
      });

      if (acronymDirectMatches.length > 0 && debouncedSearch.length <= 4) {
        result = acronymDirectMatches;
      } else {
        // Run Fuse.js fuzzy search
        const fuseResults = fuse.search(debouncedSearch);
        const fuseMatchedSet = new Set(fuseResults.map(r => r.item.rawCategory || r.item.name));
        result = result.filter(ind => fuseMatchedSet.has(ind.rawCategory || ind.name));
      }
    }

    return result;
  }, [baseIndicators, selectedCategoryGroup, debouncedSearch, fuse]);

  // Propagate filtered results up to parent table
  useEffect(() => {
    if (onFilteredIndicatorsChange) {
      onFilteredIndicatorsChange(filteredList, debouncedSearch);
    }
  }, [filteredList, debouncedSearch, onFilteredIndicatorsChange]);

  // Quick stats
  const totalInMethodology = indicators.length;
  const pcrCount = useMemo(() => indicators.filter(i => i.isMandatory !== false).length, [indicators]);

  return (
    <div className="lcia-search-filter-panel" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Top Header: View Mode Switcher & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-card2)',
            padding: 3,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <button
              type="button"
              onClick={() => {
                onViewModeChange('pcr');
                setSelectedCategoryGroup('all');
              }}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'pcr' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'pcr' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🛡️</span> Standard PCR View ({pcrCount})
            </button>
            <button
              type="button"
              onClick={() => {
                onViewModeChange('all');
                setSelectedCategoryGroup('all');
              }}
              style={{
                padding: '6px 14px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'all' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'all' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🌐</span> Full LCIA Matrix View ({totalInMethodology})
            </button>
          </div>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredList.length}</strong> of <strong>{baseIndicators.length}</strong> indicators
          </span>
        </div>

        {/* Clear Search & Reset */}
        {(searchTerm || selectedCategoryGroup !== 'all') && (
          <button
            type="button"
            className="btn btn-2xs btn-outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategoryGroup('all');
            }}
            style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* Main Search Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search indicators, categories, or acronyms (e.g., 'CO2', 'GWP', 'Smog', 'Acid Rain', 'Water', 'Toxicity')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card2)',
            color: 'var(--text-primary)',
          }}
        />
        <span style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          fontSize: '15px',
          pointerEvents: 'none',
        }}>
          🔍
        </span>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Acronym Badges & Category Filter Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Acronym Quick-Jumps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>
            QUICK JUMP:
          </span>
          {ACRONYM_SHORTCUTS.map(sc => (
            <button
              key={sc.query}
              type="button"
              onClick={() => setSearchTerm(sc.query)}
              style={{
                background: searchTerm.toLowerCase() === sc.query.toLowerCase() ? 'var(--accent-dim)' : 'var(--bg-card2)',
                border: searchTerm.toLowerCase() === sc.query.toLowerCase() ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: searchTerm.toLowerCase() === sc.query.toLowerCase() ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: 'var(--text-2xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{sc.icon}</span>
              <span>{sc.label}</span>
            </button>
          ))}
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, marginRight: 2 }}>
            CATEGORIES:
          </span>
          {CATEGORY_GROUPS.map(grp => {
            const count = grp.id === 'all'
              ? baseIndicators.length
              : baseIndicators.filter(i => grp.match(i.category || '', i.name || '')).length;

            if (count === 0 && grp.id !== 'all') return null;

            const isActive = selectedCategoryGroup === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedCategoryGroup(grp.id)}
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{grp.label}</span>
                <span style={{
                  fontSize: '9px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-card2)',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
