import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div>
            <a href="#" className="brand-logo" style={{ marginBottom: '14px' }}>
              <div className="logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <span>EcoPulse <span className="gradient-text">EPD</span></span>
            </a>
            <p className="footer-brand-desc">
              Next-generation automated Life Cycle Assessment and verified Environmental Product Declaration platform.
            </p>
            <div className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
              <span className="badge-pulse-dot"></span>
              <span>EF 3.1 & GPI 5.0.1 Cloud Engine Active</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-links">
              <li><a href="#product" className="footer-link">LCA Automated Engine</a></li>
              <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
              <li><a href="#features" className="footer-link">Features & Integration</a></li>
              <li><a href="#dashboard" className="footer-link">Dashboard Preview</a></li>
              <li><a href="#pricing" className="footer-link">Pricing & Plans</a></li>
            </ul>
          </div>

          {/* Standards & PCRs */}
          <div>
            <h4 className="footer-col-title">Standards</h4>
            <ul className="footer-links">
              <li><a href="https://environdec.com" target="_blank" rel="noreferrer" className="footer-link">GPI 5.0.1 Reference</a></li>
              <li><a href="#epds" className="footer-link">PCR 2019:14 (EN 15804+A2)</a></li>
              <li><a href="#dashboard" className="footer-link">EF 3.1 Characterization</a></li>
              <li><a href="#faq" className="footer-link">Biogenic Mass Balance Rules</a></li>
              <li><a href="#dashboard" className="footer-link">Mandatory Disclaimers</a></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="footer-col-title">Enterprise</h4>
            <ul className="footer-links">
              <li><a href="#pricing" className="footer-link">Request Pilot Access</a></li>
              <li><a href="#faq" className="footer-link">Third-Party Verifier Portal</a></li>
              <li><a href="#faq" className="footer-link">ecoinvent Licensing</a></li>
              <li><a href="#" className="footer-link">API & openLCA Documentation</a></li>
              <li><a href="#" className="footer-link">Security & SOC2 Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} EcoPulse EPD Inc. All rights reserved. Compliant with ISO 14025, ISO 14040/44, and EN 15804+A2.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Compliance Statements</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
