import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import {
  UploadIcon,
  ReviewIcon,
  EditIcon,
  ValidateIcon,
  MethodologyIcon,
  ResultsIcon,
  ExportIcon,
  CheckIcon,
  CloseIcon,
  ShieldCheckIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from './Icons';

const PHASES = [
  { id: 'upload', step: '1', label: 'Upload Documents', sub: 'XLSX, CSV, PDF Ingestion', icon: UploadIcon },
  { id: 'extract', step: '2', label: 'Extracted Inventory', sub: 'Modules A1–D Coverage', icon: ReviewIcon },
  { id: 'user_review', step: '3', label: 'Review & Mapping', sub: 'BOM & ecoinvent Providers', icon: EditIcon },
  { id: 'validate', step: '4', label: 'Pre-Calculation Checks', sub: 'Checked before calculation', icon: ValidateIcon },
  { id: 'methodology', step: '5', label: 'LCIA Methodology', sub: 'EF v3.1, TRACI, CML-IA', icon: MethodologyIcon },
  { id: 'results', step: '6', label: 'LCIA Results', sub: '25 Indicators × 16 Stages', icon: ResultsIcon },
  { id: 'audit', step: '7', label: 'Pre-Audit Verification', sub: 'PCR results rules', icon: ShieldCheckIcon },
  { id: 'export', step: '8', label: 'Export EPD', sub: 'Publication PDF & openEPD', icon: ExportIcon },
];

export default function StudioSidebar() {
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
    validationStale,
    resultsAudit,
    resultsAuditStale,
    selectedMethodology,
    results,
    lca,
    productProfile,
    productCategory,
  } = useStudio();

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
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

  const getPhaseStatus = (phaseId) => {
    switch (phaseId) {
      case 'upload':
        return uploadedFiles.length > 0 ? 'done' : '';
      case 'extract':
        return uploadedFiles.some(f => f.status === 'done') || (extractedData?.bom && extractedData.bom.length > 0) ? 'done' : '';
      case 'user_review':
        return extractedData?.bom && extractedData.bom.length > 0 ? 'done' : '';
      case 'validate':
        return validationResults?.passed && !validationStale ? 'done' : '';
      case 'methodology':
        return selectedMethodology ? 'done' : '';
      case 'results':
        return lca?.isCalculated || results ? 'done' : '';
      case 'audit':
        return resultsAudit?.passed && !resultsAuditStale ? 'done' : '';
      case 'export':
        return '';
      default:
        return '';
    }
  };

  const handleSelectPhase = (phaseId) => {
    setActivePhase(phaseId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <aside
      className={`studio-sidebar ${isSidebarOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}
      aria-label="Workflow Navigation"
    >
      <div className="sidebar-header-row">
        {!isSidebarCollapsed && (
          <div className="sidebar-heading-group">
            <span className="sidebar-heading">EPD Workflow</span>
            <span className="sidebar-heading-badge">{productCategory ? productProfile.pcrShort : 'Select product'}</span>
          </div>
        )}

        <div className="sidebar-actions-group">
          {/* Desktop Collapse / Expand Button */}
          <button
            type="button"
            className="btn-icon-collapse-toggle hide-mobile"
            onClick={toggleSidebarCollapsed}
            title={isSidebarCollapsed ? "Expand Workflow (Ctrl+B)" : "Collapse Workflow (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Expand Workflow" : "Collapse Workflow"}
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

      <nav className="sidebar-nav">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const isActive = activePhase === phase.id;
          const status = getPhaseStatus(phase.id);

          return (
            <button
              key={phase.id}
              type="button"
              className={`sidebar-item ${isActive ? 'active' : ''} ${status}`}
              onClick={() => handleSelectPhase(phase.id)}
              aria-current={isActive ? 'step' : undefined}
              title={isSidebarCollapsed ? `${phase.step}. ${phase.label} (${phase.sub})` : undefined}
            >
              <div className="item-step-indicator">
                {status === 'done' && !isActive ? (
                  <span className="step-done-check" title="Phase complete"><CheckIcon size={11} /></span>
                ) : (
                  <span className="step-number">{phase.step}</span>
                )}
              </div>

              <div className="item-icon-wrapper">
                <Icon size={15} />
              </div>

              {!isSidebarCollapsed && (
                <div className="item-text-stack">
                  <span className="item-label">{phase.label}</span>
                  <span className="item-subtext">{phase.sub}</span>
                </div>
              )}

              {isActive && <span className="active-pill-marker" />}
            </button>
          );
        })}
      </nav>

      {/* Account Admin Console Footer Link */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 10px',
          borderTop: '1px solid var(--border, #dfe7dd)',
        }}
      >
        <Link
          to="/console"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border, #dfe7dd)',
            color: 'var(--text-secondary, #2f3b33)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.16s ease',
          }}
          title="Account Admin Console (Multi-Tenant Management)"
        >
          <ShieldCheckIcon size={14} style={{ color: 'var(--accent, #1f7a4c)', flexShrink: 0 }} />
          {!isSidebarCollapsed && <span>Admin Console</span>}
        </Link>
      </div>
    </aside>
  );
}
