import React, { Component } from 'react';
import { useStudio } from '../../context/StudioContext';
import StudioHeader from './StudioHeader';
import StudioSidebar from './StudioSidebar';

import UploadView from './views/UploadView';
import ReviewView from './views/ReviewView';
import ValidateView from './views/ValidateView';
import MethodologyView from './views/MethodologyView';
import ResultsView from './views/ResultsView';
import ExportView from './views/ExportView';

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
            padding: '24px',
            backgroundColor: '#FFF8F2',
            borderRadius: '12px',
            border: '1px solid #F5DEC8',
            boxShadow: '0 4px 12px rgba(184,83,29,0.06)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#9C5832', margin: '0 0 8px 0' }}>
              Workspace View Recovered
            </h2>
            <p style={{ fontSize: '13px', color: '#5C4E46', margin: '0 0 16px 0' }}>
              An unexpected render issue occurred in this view. Your uploaded files and calculations remain intact.
            </p>
            <div style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#8F4A14',
              backgroundColor: '#FFFFFF',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #EED8C5',
              marginBottom: '16px',
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
  const {
    activePhase,
    setActivePhase,
    notification,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useStudio();

  const renderActiveView = () => {
    switch (activePhase) {
      case 'upload':
        return <UploadView />;
      case 'review':
        return <ReviewView />;
      case 'validate':
        return <ValidateView />;
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

  return (
    <div className="studio-root">
      <StudioHeader />

      <div className="studio-body-layout">
        <StudioSidebar />

        <main className="studio-main-workspace" id="studio-main-scroll">
          <StudioErrorBoundary onReset={() => setActivePhase('upload')}>
            {renderActiveView()}
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
