import React from 'react';
import { LeafIcon, ChevronRightIcon } from '../studio/Icons';

export default function LandingNavbar({ onLaunchApp }) {
  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#C25A23',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(194, 90, 35, 0.25)'
          }}>
            <LeafIcon size={18} />
          </div>
          <div className="lp-logo">
            EcoMetric
          </div>
        </div>

        {/* Links: Product, How it works, EPDs, Pricing */}
        <nav className="lp-nav-links">
          <a href="#product" className="lp-nav-link">Product</a>
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#epds" className="lp-nav-link">EPDs</a>
          <a href="#pricing" className="lp-nav-link">Pricing</a>
        </nav>

        {/* Action Button: Get Started */}
        <div>
          <button
            type="button"
            onClick={onLaunchApp}
            className="btn-lp-primary"
            style={{ padding: '9px 20px', fontSize: '13px' }}
          >
            <span>Get Started</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
