import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import { MenuIcon, ExportIcon, CheckCircleIcon, ChevronRightIcon, LeafIcon, RefreshCwIcon } from './Icons';

export default function StudioHeader() {
  const {
    setActivePhase,
    toggleSidebar,
    extractedData,
    loadPreset,
    currentPresetId,
    PRESET_DATASETS,
    isLoading
  } = useStudio();

  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const productName = extractedData?.project_info?.product_name || 'AquaEdge® 19DV Centrifugal Chiller';
  const capacityRt = extractedData?.operational?.capacity_rt || 500;
  const pcrStandard = extractedData?.project_info?.pcr_ref || 'UL 10010-4 & EN 15804+A2';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsPresetMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = async (presetKey) => {
    setIsPresetMenuOpen(false);
    await loadPreset(presetKey);
  };

  return (
    <header className="studio-topbar" role="banner">
      <div className="topbar-left">
        {/* macOS Window Controls (Traffic Lights) */}
        <div className="macos-traffic-lights hide-mobile" title="macOS Window Controls">
          <span className="traffic-dot dot-close" title="Close Workspace" onClick={() => setActivePhase('upload')} />
          <span className="traffic-dot dot-min" title="Minimize / Clean View" />
          <span className="traffic-dot dot-zoom" title="Full Screen View" />
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="btn-icon-mobile-nav"
          onClick={toggleSidebar}
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <MenuIcon size={16} />
        </button>

        {/* Brand Logo & Home Breadcrumb */}
        <div className="brand-group">
          <div className="brand-logo" onClick={() => setActivePhase('upload')}>
            <div className="brand-icon-box">
              <LeafIcon size={13} style={{ color: '#0066cc' }} />
            </div>
            <span className="brand-name">EcoMetric</span>
            <span className="brand-sub">Studio</span>
          </div>

          <Link
            to="/"
            className="apple-nav-link-subtle hide-mobile"
            title="Return to Product Showcase"
          >
            ← Showcase
          </Link>
        </div>

        <div className="topbar-divider hide-mobile" aria-hidden="true" />

        {/* Interactive Apple Model Preset Selector */}
        <div className="preset-selector-container" ref={menuRef}>
          <button
            type="button"
            className="btn-apple-preset-picker"
            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
            title="Switch Chiller Test Model (UL 10010-4 / EN 15804+A2)"
            aria-expanded={isPresetMenuOpen}
          >
            <span className="preset-equipment-icon">
              {currentPresetId === 'screw_chiller_300rt' ? '❄️' :
               currentPresetId === 'heat_pump_150rt' ? '♨️' :
               currentPresetId === 'incomplete_gap_analysis' ? '⚠️' : '💧'}
            </span>
            <span className="preset-active-label">
              {productName} ({Math.round(capacityRt)} RT)
            </span>
            <span className="preset-chevron">▾</span>
          </button>

          {isPresetMenuOpen && (
            <div className="apple-menu-popover" role="menu">
              <div className="apple-menu-header">
                <span>Select Engineering Benchmark Model</span>
                <span className="apple-menu-badge">ecoinvent 3.12</span>
              </div>

              {Object.entries(PRESET_DATASETS || {}).map(([key, item]) => {
                const isSelected = currentPresetId === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`apple-menu-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(key)}
                    disabled={isLoading}
                  >
                    <div className="menu-item-icon">
                      {key === 'screw_chiller_300rt' ? '❄️' :
                       key === 'heat_pump_150rt' ? '♨️' :
                       key === 'incomplete_gap_analysis' ? '⚠️' : '💧'}
                    </div>
                    <div className="menu-item-text">
                      <div className="menu-item-title">
                        {item.title}
                        {isSelected && <span className="menu-check">✓</span>}
                      </div>
                      <div className="menu-item-desc">{item.subtitle}</div>
                    </div>
                    <span
                      className="menu-item-badge"
                      style={{ color: item.badgeColor, backgroundColor: `${item.badgeColor}18` }}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Compliance Capsule Badge */}
        <div className="compliance-pill-header hide-tablet">
          <span className="compliance-dot-pulse" />
          <span className="compliance-pill-text">UL 10010-4 Part B v2.0 • EN 15804+A2</span>
        </div>

        {/* Primary Action Blue CTA */}
        <button
          type="button"
          className="btn-apple-action-blue"
          onClick={() => setActivePhase('export')}
          title="Export Environmental Product Declaration"
        >
          <ExportIcon size={14} />
          <span>Export EPD</span>
        </button>
      </div>
    </header>
  );
}
