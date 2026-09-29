import React from 'react';
import { LeafIcon } from '../studio/Icons';

export default function LandingFooter() {
  return (
    <footer className="apple-footer">
      <div className="lp-container">
        <div className="apple-footer-grid">
          {/* Column 1: Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <LeafIcon size={18} style={{ color: 'var(--apple-ink)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-ink)', letterSpacing: '-0.2px' }}>
                EcoMetric
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', lineHeight: '1.5', maxWidth: '360px', margin: 0 }}>
              Automated Life Cycle Assessment & Environmental Product Declaration software for HVAC, mechanical equipment, and industrial manufacturing.
            </p>
          </div>

          {/* Column 2: Standards & Frameworks */}
          <div>
            <div className="apple-footer-col-title">
              Standards Compliance
            </div>
            <ul className="apple-footer-links">
              <li className="apple-footer-link-item"><a href="#epds">ISO 14025:2006 Type III</a></li>
              <li className="apple-footer-link-item"><a href="#stages">EN 15804+A2:2019 Core PCR</a></li>
              <li className="apple-footer-link-item"><a href="#solution">UL 10010-4 Part B PCR</a></li>
              <li className="apple-footer-link-item"><a href="#how-it-works">ecoinvent v3.12 Cutoff LCI</a></li>
              <li className="apple-footer-link-item"><a href="#solution">PEF 3.0 / EF 3.1 Characterization</a></li>
            </ul>
          </div>

          {/* Column 3: Registries & Formats */}
          <div>
            <div className="apple-footer-col-title">
              Registries & Formats
            </div>
            <ul className="apple-footer-links">
              <li className="apple-footer-link-item"><a href="#epds">The International EPD® System</a></li>
              <li className="apple-footer-link-item"><a href="#epds">ILCD+EPD Schema 1.2 XML</a></li>
              <li className="apple-footer-link-item"><a href="#epds">EcoPlatform Verified Format</a></li>
              <li className="apple-footer-link-item"><a href="#who-its-for">USGBC LEED v4.1 MR Credit</a></li>
              <li className="apple-footer-link-item"><a href="#who-its-for">openEPD Verified API</a></li>
            </ul>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className="apple-footer-bottom">
          <div>
            Copyright © {new Date().getFullYear()} EcoMetric Systems Inc. All rights reserved.
          </div>
          <div>
            Compliant with ISO 14040/44 LCA Principles and PEF 3.0 Data Quality Rating rules.
          </div>
        </div>
      </div>
    </footer>
  );
}
