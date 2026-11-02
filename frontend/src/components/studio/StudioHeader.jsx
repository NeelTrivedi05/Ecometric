import React, { useEffect, useState } from 'react';
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
    renameProject,
    saveProjectName,
    exportEpdPdf,
    reportDetails,
    showNotif,
  } = useStudio();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(activeProject?.name || '');
    }
  }, [activeProject?.name, isEditingName]);

  const startEditingName = () => {
    if (!activeProject?.name) return;
    setDraftName(activeProject.name);
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setDraftName(activeProject?.name || '');
    setIsEditingName(false);
  };

  const saveName = async () => {
    const nextName = draftName.trim();
    if (!nextName) {
      showNotif('Project name cannot be empty.', 'Project Name Required');
      return;
    }
    if (nextName === activeProject?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    renameProject(activeProject.id, nextName);
    try {
      await saveProjectName(activeProject.id, nextName);
      setIsEditingName(false);
    } catch (err) {
      renameProject(activeProject.id, activeProject.name);
      showNotif(err.message || 'Could not save project name.', 'Project Name Error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveName();
    } else if (event.key === 'Escape') {
      cancelEditingName();
    }
  };

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
              {isEditingName ? (
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={saveName}
                  disabled={isSavingName}
                  aria-label="Project name"
                  autoFocus
                  style={{ minWidth: 180, maxWidth: 360 }}
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  aria-label={`Edit project name: ${activeProject.name}`}
                  title="Edit project name"
                  style={{
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'text',
                    textAlign: 'left',
                  }}
                >
                  {activeProject.name}
                </button>
              )}
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
