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
    <header className="apple-sub-nav" aria-label="Product Navigation">
      <div className="lp-container apple-sub-nav-inner">
        <a href="#product" className="apple-subnav-title" onClick={(e) => handleScrollTo(e, 'product')}>
          <span className="apple-subnav-mark">
            <LeafIcon size={16} />
          </span>
          EcoMetric Studio
        </a>

        <nav className="apple-subnav-links" aria-label="Sections">
          <a href="#product" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'product')}>Overview</a>
          <a href="#solution" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'solution')}>Pipeline</a>
          <a href="#stages" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'stages')}>Modules</a>
          <a href="#how-it-works" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'how-it-works')}>How it works</a>
          <a href="#features" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'features')}>Capabilities</a>
          <a href="#faq" className="apple-subnav-link" onClick={(e) => handleScrollTo(e, 'faq')}>FAQ</a>
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
