import React from 'react';
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
  LeafIcon,
  ShieldCheckIcon,
} from './Icons';

const PHASES = [
  { id: 'upload', step: '1', label: 'Upload Documents', sub: 'XLSX, CSV, PDF Ingestion', icon: UploadIcon },
  { id: 'extract', step: '2', label: 'Extracted Inventory', sub: 'Modules A1–D Coverage', icon: ReviewIcon },
  { id: 'user_review', step: '3', label: 'Review & Mapping', sub: 'BOM & ecoinvent Providers', icon: EditIcon },
  { id: 'validate', step: '4', label: 'PCR Rules Audit', sub: 'UL 10010-4 & GPI Check', icon: ValidateIcon },
  { id: 'methodology', step: '5', label: 'LCIA Methodology', sub: 'EF v3.1, TRACI, CML-IA', icon: MethodologyIcon },
  { id: 'results', step: '6', label: 'LCIA Results', sub: '25 Indicators × 16 Stages', icon: ResultsIcon },
  { id: 'export', step: '7', label: 'Export EPD', sub: 'Publication PDF & openEPD', icon: ExportIcon },
];

export default function StudioSidebar() {
  const {
    activePhase,
    setActivePhase,
    isSidebarOpen,
    setIsSidebarOpen,
    uploadedFiles,
    extractedData,
    validationResults,
    selectedMethodology,
    results,
    lca,
  } = useStudio();

  const getPhaseStatus = (phaseId) => {
    switch (phaseId) {
      case 'upload':
        return uploadedFiles.length > 0 ? 'done' : '';
      case 'extract':
        return uploadedFiles.some(f => f.status === 'done') || (extractedData?.bom && extractedData.bom.length > 0) ? 'done' : '';
      case 'user_review':
        return extractedData?.bom && extractedData.bom.length > 0 ? 'done' : '';
      case 'validate':
        return validationResults?.run_at ? 'done' : '';
      case 'methodology':
        return selectedMethodology ? 'done' : '';
      case 'results':
        return lca?.isCalculated || results ? 'done' : '';
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

  const capacityRt = extractedData?.operational?.capacity_rt || 500;
  const rslYears = extractedData?.project_info?.lifespan_years || 25;

  return (
    <aside className={`studio-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`} aria-label="Workflow Navigation">
      <div className="sidebar-header-row">
        <div className="sidebar-heading-group">
          <span className="sidebar-heading">EPD Workflow</span>
          <span className="sidebar-heading-badge">UL 10010-4</span>
        </div>
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
            >
              <div className="item-step-indicator">
                {status === 'done' && !isActive ? (
                  <span className="step-done-check" title="Phase complete">✓</span>
                ) : (
                  <span className="step-number">{phase.step}</span>
                )}
              </div>

              <div className="item-icon-wrapper">
                <Icon size={15} />
              </div>

              <div className="item-text-stack">
                <span className="item-label">{phase.label}</span>
                <span className="item-subtext">{phase.sub}</span>
              </div>

              {isActive && <span className="active-pill-marker" />}
            </button>
          );
        })}
      </nav>

      {/* Apple-style Specs Card in Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-spec-card">
          <div className="spec-card-header">
            <span className="spec-icon">⚡</span>
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
      </div>
    </aside>
  );
}
