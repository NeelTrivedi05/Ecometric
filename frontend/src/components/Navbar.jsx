import React from 'react';

export default function Navbar({ onOpenWizard, theme, onToggleTheme }) {
  return (
    <header className="navbar-wrapper">
      <div className="container navbar-container">
        <a href="#" className="brand-logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span>EcoPulse <span className="gradient-text">EPD</span></span>
        </a>

        <nav>
          <ul className="nav-links">
            <li><a href="#product" className="nav-link">Product</a></li>
            <li><a href="#machinery" className="nav-link">3D Machinery</a></li>
            <li><a href="#how-it-works" className="nav-link">How it works</a></li>
            <li><a href="#epds" className="nav-link">EPDs</a></li>
            <li><a href="#dashboard" className="nav-link">Dashboard</a></li>
            <li><a href="#faq" className="nav-link">FAQ</a></li>
          </ul>
        </nav>

        <div className="nav-actions">
          <button 
            type="button" 
            className="theme-toggle-btn" 
            onClick={onToggleTheme}
            title="Toggle between Light Sage and Charcoal Workstation themes"
          >
            <span>{theme === 'dark' ? '☀️ Light Sage' : '🌙 Charcoal'}</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onOpenWizard}
          >
            <span>Get Started</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
