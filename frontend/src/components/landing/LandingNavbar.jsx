import React from 'react';
import { LeafIcon, ChevronRightIcon } from '../studio/Icons';

export default function LandingNavbar({ onLaunchApp }) {
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        {/* Logo */}
        <a
          href="#product"
          onClick={(e) => handleScrollTo(e, 'product')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', cursor: 'pointer' }}
        >
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
        </a>

        {/* Links: Product, How it works, Features, EPDs, Pricing */}
        <nav className="lp-nav-links">
          <a href="#product" className="lp-nav-link" onClick={(e) => handleScrollTo(e, 'product')}>Product</a>
          <a href="#how-it-works" className="lp-nav-link" onClick={(e) => handleScrollTo(e, 'how-it-works')}>How it works</a>
          <a href="#features" className="lp-nav-link" onClick={(e) => handleScrollTo(e, 'features')}>Features</a>
          <a href="#epds" className="lp-nav-link" onClick={(e) => handleScrollTo(e, 'epds')}>EPDs</a>
          <a href="#pricing" className="lp-nav-link" onClick={(e) => handleScrollTo(e, 'pricing')}>Pricing</a>
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
