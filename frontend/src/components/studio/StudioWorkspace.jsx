import React, { Component, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import StudioHeader from './StudioHeader';
import StudioSidebar from './StudioSidebar';
import ProjectsConsole from './ProjectsConsole';
import ProgressOverlay from './ProgressOverlay';

import UploadView from './views/UploadView';
import ReviewView from './views/ReviewView';
import UserReviewView from './views/UserReviewView';
import ValidateView from './views/ValidateView';
import MethodologyView from './views/MethodologyView';
import ResultsView from './views/ResultsView';
import ExportView from './views/ExportView';
import AuditView from './views/AuditView';

const STUDIO_PHASES = ['upload', 'extract', 'user_review', 'validate', 'audit', 'methodology', 'results', 'export'];

class StudioErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Studio render error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            padding: '32px 24px',
            backgroundColor: '#f5f5f7',
            borderRadius: '18px',
            border: '1px solid #d2d2d7'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Workspace View Recovered
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #86868b)', margin: '0 0 16px 0', lineHeight: 1.47 }}>
              An unexpected render issue occurred in this view. Your uploaded files and calculations remain intact.
            </p>
            <div style={{
              fontSize: '11px',
              fontFamily: 'SFMono-Regular, Consolas, monospace',
              color: '#ff3b30',
              backgroundColor: '#FFFFFF',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e5e5ea',
              marginBottom: '18px',
              textAlign: 'left',
              wordBreak: 'break-all'
            }}>
              {String(this.state.error?.message || 'Unknown error')}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              Reset View & Return to Upload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StudioWorkspace() {
  const { projectId, phase } = useParams();
  const navigate = useNavigate();
  const syncingPhaseRef = useRef(false);
  const {
    openProject,
    activePhase,
    setActivePhase,
    notification,
    isSidebarOpen,
    setIsSidebarOpen,
    progressTask,
  } = useStudio();

  // If a projectId is in the URL, ensure that project is opened in the calculation workspace
  useEffect(() => {
    if (projectId) {
      const opened = openProject(projectId);
      if (!opened) {
        console.warn(`[StudioWorkspace] Project with id "${projectId}" not found.`);
      }
    }
  }, [projectId, openProject]);

  useEffect(() => {
    if (!phase) return;

    if (STUDIO_PHASES.includes(phase) && phase !== activePhase) {
      syncingPhaseRef.current = true;
      setActivePhase(phase);
    }
  }, [phase, setActivePhase]);

  useEffect(() => {
    if (syncingPhaseRef.current) {
      syncingPhaseRef.current = false;
      return;
    }

    if (!projectId || !activePhase || phase === activePhase) return;

    navigate(`/app/projects/${projectId}/${activePhase}`, { replace: true });
  }, [projectId, phase, activePhase, navigate]);

  // Smooth scroll back to top when phase switches
  useEffect(() => {
    const mainEl = document.getElementById('studio-main-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePhase]);

  const renderActiveView = () => {
    switch (activePhase) {
      case 'upload':
        return <UploadView />;
      case 'extract':
      case 'review':
        return <ReviewView />;
      case 'user_review':
        return <UserReviewView />;
      case 'validate':
        return <ValidateView />;
      case 'audit':
        return <AuditView />;
      case 'methodology':
        return <MethodologyView />;
      case 'results':
        return <ResultsView />;
      case 'export':
        return <ExportView />;
      default:
        return <UploadView />;
    }
  };

  // If no projectId in URL (e.g. /app), render the Projects Console
  if (!projectId) {
    return (
      <div className="studio-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StudioErrorBoundary onReset={() => navigate('/app')}>
          <ProjectsConsole />
        </StudioErrorBoundary>

        {/* Toast */}
        {notification && (
          <div className="studio-toast" role="alert">
            <div className="toast-dot" />
            <div className="toast-content">
              <div className="toast-title">{notification.title}</div>
              <div className="toast-msg">{notification.msg}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // When a projectId is in URL, render the calculation workspace
  return (
    <div className="studio-root">
      <StudioHeader />

      <div className="studio-body-layout">
        <StudioSidebar />

        <main className="studio-main-workspace" id="studio-main-scroll">
          <StudioErrorBoundary onReset={() => setActivePhase('upload')}>
            <div key={activePhase} className="studio-view-transition">
              {renderActiveView()}
            </div>
          </StudioErrorBoundary>
        </main>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="studio-backdrop visible"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close panels"
            role="button"
            tabIndex={0}
          />
        )}
      </div>

      <ProgressOverlay task={progressTask} />

      {/* Toast */}
      {notification && (
        <div className="studio-toast" role="alert">
          <div className="toast-dot" />
          <div className="toast-content">
            <div className="toast-title">{notification.title}</div>
            <div className="toast-msg">{notification.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
