import React from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import { MenuIcon, ArrowLeftIcon } from './Icons';

export default function StudioHeader() {
  const {
    toggleSidebar,
    extractedData,
    activeProject,
  } = useStudio();

  // Project name: prioritize active project name, then extractedData project info, then fallback
  const projectName =
    activeProject?.name ||
    extractedData?.project_info?.product_name ||
    'AquaEdge 19DV Water-Cooled Centrifugal Chiller';

  return (
    <header
      className="studio-topbar"
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '14px',
        padding: '0 20px',
        height: '52px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: '1px solid #dfe7dd',
      }}
    >
      {/* Mobile Hamburger Navigation Button */}
      <button
        type="button"
        className="btn-icon-mobile-nav"
        onClick={toggleSidebar}
        title="Toggle Navigation"
        aria-label="Toggle Navigation"
      >
        <MenuIcon size={16} />
      </button>

      {/* Back to Projects Console Navigation */}
      <Link
        to="/app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          color: '#5b6f62',
          textDecoration: 'none',
          backgroundColor: 'transparent',
          border: '1px solid transparent',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#eef7f1';
          e.currentTarget.style.borderColor = '#c8e2d1';
          e.currentTarget.style.color = '#1f7a4c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = '#5b6f62';
        }}
        title="Return to Projects Console"
        aria-label="Return to Projects Console"
      >
        <ArrowLeftIcon size={18} />
      </Link>

      {/* Only display the Project Name */}
      <h1
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#16231b',
          margin: 0,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {projectName}
      </h1>
    </header>
  );
}
