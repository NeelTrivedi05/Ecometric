import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import BrandLogo from '../BrandLogo';
import {
  MenuIcon,
  ExportIcon,
  DropletIcon,
  SnowflakeIcon,
  ThermalIcon,
  AlertTriangleIcon,
  CheckIcon,
} from './Icons';

export default function StudioHeader() {
  const {
    setActivePhase,
    toggleSidebar,
    extractedData,
    loadPreset,
    currentPresetId,
    PRESET_DATASETS,
    isLoading,
    productProfile,
    activePhase,
    exportEpdPdf,
    reportDetails,
    showNotif,
  } = useStudio();

  const handleExportPdf = async () => {
    try {
      await exportEpdPdf(reportDetails);
    } catch (err) {
      showNotif('PDF export failed: ' + (err.message || 'Unknown error'), 'Export Error');
    }
  };

  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isChiller = productProfile?.isChiller !== false;
  const productName = extractedData?.project_info?.product_name || productProfile?.name;
  const capacityRt = extractedData?.operational?.capacity_rt || 500;

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

  const renderPresetIcon = (id, size = 15) => {
    if (id === 'screw_chiller_300rt') return <SnowflakeIcon size={size} style={{ color: 'var(--accent, #1f7a4c)' }} />;
    if (id === 'heat_pump_150rt') return <ThermalIcon size={size} style={{ color: '#d97706' }} />;
    if (id === 'incomplete_gap_analysis') return <AlertTriangleIcon size={size} style={{ color: '#dc2626' }} />;
    return <DropletIcon size={size} style={{ color: 'var(--accent, #1f7a4c)' }} />;
  };

  return (
    <header className="studio-topbar" role="banner">
      <div className="topbar-left">
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

        {/* Brand Name Home Breadcrumb with Leaf Logo */}
        <div className="brand-group">
          <div
            className="brand-logo"
            onClick={() => setActivePhase('upload')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="EcoMetric EPD Studio Home"
          >
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              backgroundColor: 'rgba(31, 122, 76, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #1f7a4c)'
            }}>
              <BrandLogo />
            </span>
            <span className="brand-name">EcoMetric Studio</span>
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

        {/* Interactive Model Preset Selector */}
        <div className="preset-selector-container" ref={menuRef}>
          <button
            type="button"
            className="btn-apple-preset-picker"
            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
            title="Switch Chiller Test Model (UL 10010-4 / EN 15804+A2)"
            aria-expanded={isPresetMenuOpen}
          >
            <span className="preset-equipment-icon">
              {renderPresetIcon(currentPresetId, 14)}
            </span>
            <span className="preset-active-label">
              {isChiller ? `${productName} (${Math.round(capacityRt)} RT)` : productName}
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
                      {renderPresetIcon(key, 16)}
                    </div>
                    <div className="menu-item-text">
                      <div className="menu-item-title">
                        {item.title}
                        {isSelected && <span className="menu-check"><CheckIcon size={12} /></span>}
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
        {/* Account Admin Console Quick Navigation */}
        <Link
          to="/console"
          className="hide-mobile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border, #dfe7dd)',
            backgroundColor: 'var(--bg-card, #ffffff)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary, #2f3b33)',
            textDecoration: 'none',
            transition: 'all 0.16s ease',
          }}
          title="Account Admin Console (Multi-Tenant Isolation)"
        >
          <span style={{ fontSize: '12px' }}>🛡️</span>
          <span>Admin Console</span>
        </Link>

        {/* Compliance Capsule Badge */}
        <div className="compliance-pill-header hide-tablet">
          <span className="compliance-dot-pulse" />
          <span className="compliance-pill-text">{productProfile?.pcrShort} • ISO 14025</span>
        </div>

        {/* Export action: only on the report generation stage (step 8) */}
        {activePhase === 'export' && (
          <button
            type="button"
            className="btn-apple-action-blue"
            onClick={handleExportPdf}
            disabled={isLoading}
            title="Download the EPD report (PDF)"
          >
            <ExportIcon size={14} />
            <span>{isLoading ? 'Generating…' : 'Export EPD'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
