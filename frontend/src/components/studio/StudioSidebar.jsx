import React from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  UploadIcon,
  ReviewIcon,
  ValidateIcon,
  MethodologyIcon,
  ResultsIcon,
  ExportIcon,
  CheckIcon,
  CloseIcon,
} from './Icons';

const PHASES = [
  { id: 'upload', label: '1. Upload Documents', icon: UploadIcon },
  { id: 'review', label: '2. Review Extracted Data', icon: ReviewIcon },
  { id: 'validate', label: '3. Validate Against Rules', icon: ValidateIcon },
  { id: 'methodology', label: '4. Select Methodology', icon: MethodologyIcon },
  { id: 'results', label: '5. View Results', icon: ResultsIcon },
  { id: 'export', label: '6. Export EPD', icon: ExportIcon },
];

export default function StudioSidebar() {
  const { activePhase, setActivePhase, isSidebarOpen, setIsSidebarOpen, uploadedFiles, validationResults, selectedMethodology, results } = useStudio();

  const getPhaseStatus = (phaseId) => {
    switch (phaseId) {
      case 'upload': return uploadedFiles.length > 0 ? 'done' : '';
      case 'review': return uploadedFiles.some(f => f.status === 'done') ? 'done' : '';
      case 'validate': return validationResults.run_at ? 'done' : '';
      case 'methodology': return selectedMethodology ? 'done' : '';
      case 'results': return results ? 'done' : '';
      case 'export': return '';
      default: return '';
    }
  };

  const handleSelectPhase = (phaseId) => {
    setActivePhase(phaseId);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <aside className={`studio-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`} aria-label="Workflow Navigation">
      <div className="sidebar-header-row">
        <div className="sidebar-heading">EPD Workflow</div>
        <button
          type="button"
          className="btn-icon-sidebar-close"
          onClick={() => setIsSidebarOpen(false)}
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <CloseIcon className="w-4 h-4" />
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
              <div className="item-icon-wrapper">
                <Icon className="w-4 h-4" />
              </div>
              <span className="item-label">{phase.label}</span>
              {status === 'done' && !isActive && (
                <span className="item-check" aria-label="Complete">
                  <CheckIcon className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="compliance-tag">
          <span className="tag-label">Standard</span>
          <span className="tag-value">EN 15804+A2:2019</span>
        </div>
        <div className="compliance-tag">
          <span className="tag-label">Database</span>
          <span className="tag-value">ecoinvent 3.12</span>
        </div>
      </div>
    </aside>
  );
}
