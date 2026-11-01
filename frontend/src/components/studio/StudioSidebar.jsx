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
  ShieldCheckIcon,
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
    uploadedFiles,
    extractedData,
    validationResults,
    validationStale,
    resultsAudit,
    resultsAuditStale,
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
      className={`studio-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}
      aria-label="Workflow Navigation"
    >
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
                  <span className="step-done-check" title="Phase complete"><CheckIcon size={11} /></span>
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

    </aside>
  );
}
