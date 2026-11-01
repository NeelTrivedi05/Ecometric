import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import BrandLogo from '../BrandLogo';
import {
  MenuIcon,
  ExportIcon,
} from './Icons';

export default function StudioHeader() {
  const navigate = useNavigate();
  const {
    toggleSidebar,
    isLoading,
    activePhase,
    activeProject,
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

  return (
    <header className="studio-topbar" role="banner">
      <div className="topbar-left">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Go to EcoMetric home"
          style={{ display: 'inline-flex', padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
        >
          <BrandLogo theme="light" height={22} />
        </button>
        {activeProject?.name && (
          <>
            <span className="topbar-divider" aria-hidden="true" />
            <div className="project-breadcrumbs" title={activeProject.name}>
              <span className="project-breadcrumb-label">Project</span>
              <strong>{activeProject.name}</strong>
            </div>
          </>
        )}

        <button
          type="button"
          className="btn-icon-mobile-nav"
          onClick={toggleSidebar}
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <MenuIcon size={16} />
        </button>
      </div>

      <div className="topbar-right">
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
