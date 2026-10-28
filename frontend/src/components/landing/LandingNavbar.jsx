import React from 'react';
import { ChevronRightIcon } from '../studio/Icons';
import { Link, NavLink } from 'react-router-dom';
import BrandLogo from '../BrandLogo';

export default function LandingNavbar({ onLaunchApp }) {
  return (
    <header className="apple-sub-nav" aria-label="Product Navigation">
      <div className="lp-container apple-sub-nav-inner">
        <Link to="/overview" className="apple-subnav-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandLogo theme="light" height={22} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted, #5b6f62)', borderLeft: '1px solid #dfe7dd', paddingLeft: '8px', lineHeight: '18px' }}>Studio</span>
        </Link>

        <nav className="apple-subnav-links" aria-label="Sections">
          <NavLink to="/overview" className="apple-subnav-link">Overview</NavLink>
          <NavLink to="/pipeline" className="apple-subnav-link">Pipeline</NavLink>
          <NavLink to="/how-it-works" className="apple-subnav-link">How it works</NavLink>
          <NavLink to="/capabilities" className="apple-subnav-link">Capabilities</NavLink>
          <NavLink to="/pricing" className="apple-subnav-link">Pricing</NavLink>
          <NavLink to="/faq" className="apple-subnav-link">FAQ</NavLink>
        </nav>

        <button
          type="button"
          onClick={onLaunchApp}
          className="btn-apple-primary"
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          <span>Launch Studio</span>
          <ChevronRightIcon size={13} />
        </button>
      </div>
    </header>
  );
}
