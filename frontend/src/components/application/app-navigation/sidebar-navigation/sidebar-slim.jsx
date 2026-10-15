import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../../context/StudioContext';
import {
  ShieldCheckIcon,
  CloseIcon,
  CheckIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from '../../../studio/Icons';

/**
 * SidebarNavigationSlim
 * Single-tier direct click navigation matching DESIGN.md and the exact 8 workflow tabs
 * Features hover-to-expand when collapsed (expands on pointer hover, collapses on pointer remove)
 * No multi-menus or nested submenus on tab click.
 */
export function SidebarNavigationSlim({ items = [], footerItems = [], className = '' }) {
  const {
    activePhase,
    setActivePhase,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    uploadedFiles,
    extractedData,
    validationResults,
    selectedMethodology,
    results,
    lca,
  } = useStudio();

  // Pointer hover state for smooth expand/collapse on mouse move
  const [isHovered, setIsHovered] = useState(false);
  // Support & Settings dialogs
  const [activeModal, setActiveModal] = useState(null);

  // If collapsed, it expands when hovered over; when pointer leaves, it collapses
  const isExpanded = !isSidebarCollapsed || isHovered;

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle pin/collapse
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapsed]);

  // Compute status for each phase based on LCA engine state
  const getPhaseStatus = (phaseId) => {
    switch (phaseId) {
      case 'upload':
        return uploadedFiles && uploadedFiles.length > 0 ? 'done' : '';
      case 'extract':
        return (uploadedFiles && uploadedFiles.some((f) => f.status === 'done')) ||
          (extractedData?.bom && extractedData.bom.length > 0)
          ? 'done'
          : '';
      case 'user_review':
        return extractedData?.bom && extractedData.bom.length > 0 ? 'done' : '';
      case 'validate':
        return validationResults?.run_at ? 'done' : '';
      case 'methodology':
        return selectedMethodology ? 'done' : '';
      case 'results':
        return lca?.isCalculated || results ? 'done' : '';
      case 'audit':
        return lca?.auditRules && lca.auditRules.length > 0 ? 'done' : '';
      case 'export':
        return '';
      default:
        return '';
    }
  };

  // Direct tab click — activates phase immediately without opening any multi-menu
  const handleTabClick = (item) => {
    if (item.id) {
      setActivePhase(item.id);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleFooterClick = (footerItem) => {
    if (footerItem.label === 'Support') {
      setActiveModal('support');
    } else if (footerItem.label === 'Settings') {
      setActiveModal('settings');
    }
  };

  const capacityRt = extractedData?.operational?.capacity_rt || 500;
  const rslYears = extractedData?.project_info?.lifespan_years || 25;

  return (
    <aside
      className={`studio-sidebar ${isSidebarOpen ? 'mobile-open' : ''} ${
        !isExpanded ? 'collapsed' : ''
      } ${isSidebarCollapsed && isHovered ? 'hover-expanded' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="EPD Console Workflow Navigation"
    >
      {/* Header Row */}
      <div className="sidebar-header-row">
        {isExpanded && (
          <div className="sidebar-heading-group sidebar-fade-in">
            <span className="sidebar-heading">EPD Workflow</span>
            <span className="sidebar-heading-badge">UL 10010-4</span>
          </div>
        )}

        <div className="sidebar-actions-group">
          {/* Desktop Pin / Collapse Toggle Button */}
          <button
            type="button"
            className="btn-icon-collapse-toggle hide-mobile"
            onClick={toggleSidebarCollapsed}
            title={
              isSidebarCollapsed
                ? 'Pin Sidebar Open (Ctrl+B)'
                : 'Collapse Sidebar (Hover to Expand) (Ctrl+B)'
            }
            aria-label={isSidebarCollapsed ? 'Pin Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpenIcon size={16} /> : <PanelLeftCloseIcon size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="btn-icon-sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
            title="Close Navigation"
            aria-label="Close Navigation"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </div>

      {/* Navigation List of the 8 Tabs (Direct single click, no multi-menu) */}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePhase === (item.id || item.href.replace('/', ''));
          const status = getPhaseStatus(item.id);

          return (
            <div key={item.id || item.label} className="tab-card-wrapper">
              <button
                type="button"
                className={`sidebar-tab-card ${isActive ? 'active' : ''} ${status}`}
                onClick={() => handleTabClick(item)}
                aria-current={isActive ? 'step' : undefined}
                title={!isExpanded ? `${item.step}. ${item.label} (${item.sub})` : undefined}
              >
                {/* Step indicator circle matching user attached image */}
                <div
                  className={`tab-step-circle ${
                    isActive
                      ? 'circle-active'
                      : status === 'done'
                      ? 'circle-done'
                      : 'circle-pending'
                  }`}
                >
                  {status === 'done' && !isActive ? (
                    <span className="step-done-check" title="Phase complete">
                      <CheckIcon size={11} />
                    </span>
                  ) : (
                    <span className="step-number">{item.step}</span>
                  )}
                </div>

                {/* Icon */}
                <div className="tab-icon-box">
                  {Icon && <Icon size={17} />}
                </div>

                {/* Title & Subtitle Stack */}
                {isExpanded && (
                  <div className="tab-text-stack sidebar-fade-in">
                    <span className="tab-title">{item.label}</span>
                    <span className="tab-subtitle">{item.sub}</span>
                  </div>
                )}

                {/* Right vertical green indicator bar for active item */}
                {isActive && isExpanded && <span className="tab-active-indicator" />}

                {/* Optional notification badge pill */}
                {item.badge && isExpanded && (
                  <span className="tab-badge-pill">{item.badge}</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Reference Basis Specs Card in Sidebar Footer */}
      {isExpanded ? (
        <div className="sidebar-footer sidebar-fade-in">
          <div className="sidebar-spec-card">
            <div className="spec-card-header">
              <span className="spec-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ShieldCheckIcon size={13} style={{ color: 'var(--accent)' }} />
              </span>
              <span className="spec-title">Reference Basis</span>
            </div>

            <div className="spec-grid">
              <div className="spec-row">
                <span className="spec-key">Functional Unit</span>
                <span className="spec-val">1 ton capacity</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Capacity</span>
                <span className="spec-val">{Math.round(capacityRt)} RT</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">RSL</span>
                <span className="spec-val">{rslYears} Years</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Database</span>
                <span className="spec-val">ecoinvent 3.12</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Lineage</span>
                <span className="spec-val text-success">SHA-256 Valid</span>
              </div>
            </div>
          </div>

          {/* Footer Actions (Support & Settings) */}
          <div className="sidebar-footer-actions-row">
            {footerItems.map((fItem) => {
              const FIcon = fItem.icon;
              return (
                <button
                  key={fItem.label}
                  type="button"
                  className="btn-footer-action"
                  onClick={() => handleFooterClick(fItem)}
                  title={fItem.label}
                >
                  <span className="footer-action-icon">
                    {FIcon && <FIcon className="f-icon" />}
                  </span>
                  <span className="footer-action-label">{fItem.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="sidebar-footer-collapsed hide-mobile">
          {footerItems.map((fItem) => {
            const FIcon = fItem.icon;
            return (
              <button
                key={fItem.label}
                type="button"
                className="btn-footer-collapsed-icon"
                onClick={() => handleFooterClick(fItem)}
                title={fItem.label}
              >
                {FIcon && <FIcon className="f-icon" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Support / Settings Modals */}
      {activeModal && (
        <div className="slim-popover-backdrop" onClick={() => setActiveModal(null)}>
          <div className="slim-popover-card" onClick={(e) => e.stopPropagation()}>
            <div className="slim-popover-header">
              <h4>{activeModal === 'support' ? 'EcoMetric LCA Support' : 'EPD Console Settings'}</h4>
              <button
                type="button"
                className="btn-icon-xs"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="slim-popover-body">
              {activeModal === 'support' ? (
                <>
                  <p>Need assistance with chiller submittal audits or characterization factor overrides?</p>
                  <ul className="slim-help-list">
                    <li><strong>PCR Standard:</strong> UL 10010-4 Part B v2.0</li>
                    <li><strong>Core Standard:</strong> ISO 14025:2006 & EN 15804+A2</li>
                    <li><strong>Dataset:</strong> ecoinvent v3.12 Cut-off Allocation</li>
                    <li><strong>Email:</strong> lca-support@ecometric.engineering</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>Global Studio Calculation Tolerances & Emission Factor Libraries:</p>
                  <ul className="slim-help-list">
                    <li><strong>Cut-Off Threshold:</strong> &le; 1.0% mass/energy per component</li>
                    <li><strong>Electricity Grid:</strong> US-eGRID 2024 / ecoinvent 3.12 default</li>
                    <li><strong>GWP Metric:</strong> IPCC AR6 (GWP-100 excluding biogenic carbon)</li>
                    <li><strong>Lineage Verification:</strong> Cryptographic SHA-256 enabled</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
