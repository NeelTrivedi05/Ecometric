import React from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import { MenuIcon, ExportIcon } from './Icons';

export default function StudioHeader() {
  const { setActivePhase, toggleSidebar, extractedData } = useStudio();
  const productName = extractedData?.project_info?.product_name || 'New Project';

  return (
    <header className="studio-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="btn-icon-mobile-nav"
          onClick={toggleSidebar}
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <MenuIcon className="w-4 h-4" />
        </button>

        <div className="brand-logo" role="banner" onClick={() => setActivePhase('upload')}>
          <div className="brand-name">EcoMetric</div>
        </div>

        <Link
          to="/"
          className="btn btn-ghost btn-sm hide-mobile"
          style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', padding: '4px 8px' }}
          title="Return to Landing Page"
        >
          ← Home
        </Link>

        <div className="topbar-divider hide-mobile" aria-hidden="true" />

        <nav className="project-breadcrumbs hide-tablet" aria-label="Project">
          <span className="crumb-product">{productName}</span>
          <span className="crumb-sep hide-compact">/</span>
          <span className="crumb-pcr hide-compact">EN 15804+A2</span>
        </nav>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => setActivePhase('export')}
          title="Export EPD"
        >
          <ExportIcon className="w-3.5 h-3.5" />
          <span>Export EPD</span>
        </button>
      </div>
    </header>
  );
}
