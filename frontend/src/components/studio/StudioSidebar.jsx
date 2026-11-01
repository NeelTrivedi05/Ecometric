import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import { useAuth } from '../../context/AuthContext';
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
  ArrowLeftIcon,
  LayersIcon,
} from './Icons';

const PHASES = [
  { id: 'product', step: '1', label: 'Product Setup', sub: 'Select product and benchmark', icon: LayersIcon },
  { id: 'upload', step: '2', label: 'Upload Documents', sub: 'XLSX, CSV, PDF Ingestion', icon: UploadIcon },
  { id: 'extract', step: '3', label: 'Extracted Inventory', sub: 'Modules A1–D Coverage', icon: ReviewIcon },
  { id: 'user_review', step: '4', label: 'Review & Mapping', sub: 'BOM & ecoinvent Providers', icon: EditIcon },
  { id: 'validate', step: '5', label: 'Pre-Calculation Checks', sub: 'Checked before calculation', icon: ValidateIcon },
  { id: 'methodology', step: '6', label: 'LCIA Methodology', sub: 'EF v3.1, TRACI, CML-IA', icon: MethodologyIcon },
  { id: 'results', step: '7', label: 'LCIA Results', sub: '25 Indicators × 16 Stages', icon: ResultsIcon },
  { id: 'audit', step: '8', label: 'Pre-Audit Verification', sub: 'PCR results rules', icon: ShieldCheckIcon },
  { id: 'export', step: '9', label: 'Export EPD', sub: 'Publication PDF & openEPD', icon: ExportIcon },
];

export default function StudioSidebar() {
  const navigate = useNavigate();
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
    currentAccount,
    productCategory,
  } = useStudio();
  const { user } = useAuth();

  const accountName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    currentAccount?.user_name ||
    currentAccount?.company_name ||
    'EcoMetric account';
  const accountInitials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const getPhaseStatus = (phaseId) => {
    switch (phaseId) {
      case 'product':
        return productCategory ? 'done' : '';
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
      <div className="sidebar-workspace-chrome">
        <button type="button" className="sidebar-back-button" onClick={() => navigate('/app')}>
          <ArrowLeftIcon size={15} />
          <span>Back to console</span>
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
      <div className="sidebar-account-footer">
        <div className="sidebar-account-card">
          <div className="sidebar-account-avatar">{accountInitials || 'EM'}</div>
          <div className="sidebar-account-copy">
            <span className="sidebar-account-label">Signed in as</span>
            <strong>{accountName}</strong>
            <span>{currentAccount?.company_name || 'EcoMetric'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
