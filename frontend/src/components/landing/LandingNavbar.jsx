import React from 'react';
import { LeafIcon, ChevronRightIcon } from '../studio/Icons';

export default function LandingNavbar({ onLaunchApp }) {
  return (
    <>
      {/* Tier 1: Apple Global Nav (44px, pure black #000000, 12px text, -0.12px tracking) */}
      <nav className="apple-global-nav" aria-label="Global Navigation">
        <div className="lp-container apple-global-nav-inner">
          <a href="#product" className="apple-nav-brand">
            <LeafIcon size={14} style={{ color: '#ffffff' }} />
            <span>EcoMetric</span>
          </a>

          <div className="apple-global-links">
            <a href="#product" className="apple-global-link">Overview</a>
            <a href="#solution" className="apple-global-link">LCA Pipeline</a>
            <a href="#stages" className="apple-global-link">Modules A1–D</a>
            <a href="#how-it-works" className="apple-global-link">Methodology</a>
            <a href="#features" className="apple-global-link">Capabilities</a>
            <a href="#epds" className="apple-global-link">openEPD & Standards</a>
            <a href="#faq" className="apple-global-link">Verification FAQ</a>
          </div>

          <div className="apple-nav-utility">
            <button
              type="button"
              onClick={onLaunchApp}
              className="apple-btn-dark-utility"
              title="Open Calculation Studio"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Tier 2: Apple Sub-Nav Frosted Glass (52px, parchment 80% with blur, sticky) */}
      <header className="apple-sub-nav" aria-label="Product Navigation">
        <div className="lp-container apple-sub-nav-inner">
          <a href="#product" className="apple-subnav-title">
            EcoMetric Studio
          </a>

          <div className="apple-subnav-links">
            <a href="#product" className="apple-subnav-link">Overview</a>
            <a href="#solution" className="apple-subnav-link">Pipeline</a>
            <a href="#stages" className="apple-subnav-link">Modules</a>
            <a href="#how-it-works" className="apple-subnav-link">How it works</a>
            <a href="#faq" className="apple-subnav-link">FAQ</a>

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
        </div>
      </header>
    </>
  );
}
