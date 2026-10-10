import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LeafIcon, ChevronRightIcon } from '../studio/Icons';
import { aboutTopics } from '../../data/aboutTopics';

export default function LandingFooter() {
  const navigate = useNavigate();

  const handleTopicClick = (topicId) => {
    navigate(`/info/${topicId}`);
  };

  return (
    <footer id="about" className="apple-footer">
      <div className="lp-container">
        {/* Knowledge Base / More Info Section inside Footer */}
        <div className="footer-kb-section" style={{ marginBottom: '56px', paddingBottom: '48px', borderBottom: '1px solid var(--apple-hairline)' }}>
          <div className="apple-section-header" style={{ marginBottom: '36px', textAlign: 'left', maxWidth: '100%' }}>
            <div className="apple-section-eyebrow" style={{ color: 'var(--apple-primary)' }}>
              KNOWLEDGE BASE
            </div>
            <h2 className="apple-section-title" style={{ fontSize: '32px', marginBottom: '8px' }}>
              Everything you need to know about EPDs
            </h2>
            <p className="apple-section-subtitle" style={{ fontSize: '15px', color: '#6e6e73' }}>
              Comprehensive technical standards, life cycle frameworks, and calculation methodologies. Select any topic to view full detailed specifications.
            </p>
          </div>

          {/* Interactive Knowledge Base Topics Cards Grid */}
          <div className="footer-kb-grid">
            {aboutTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTopicClick(topic.id)}
                className="footer-kb-card"
              >
                <div className="footer-kb-card-header">
                  <span className="footer-kb-card-label">{topic.tabLabel}</span>
                  <ChevronRightIcon size={14} className="footer-kb-card-icon" />
                </div>
                <span className="footer-kb-card-desc">{topic.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Link Columns */}
        <div className="apple-footer-grid" style={{ gridTemplateColumns: '1.8fr 1.2fr 1.2fr 1.2fr', gap: '32px' }}>
          {/* Column 1: Brand & Philosophy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <LeafIcon size={18} style={{ color: 'var(--apple-ink)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-ink)', letterSpacing: '-0.2px' }}>
                EcoMetric
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6e6e73', lineHeight: '1.5', maxWidth: '320px', margin: 0 }}>
              Automated Life Cycle Assessment & Environmental Product Declaration software for HVAC, mechanical equipment, and industrial manufacturing.
            </p>
          </div>

          {/* Column 2: More Info (Knowledge Topics) */}
          <div>
            <div className="apple-footer-col-title">
              More Info
            </div>
            <ul className="apple-footer-links">
              {aboutTopics.map((topic) => (
                <li key={topic.id} className="apple-footer-link-item">
                  <button
                    type="button"
                    onClick={() => handleTopicClick(topic.id)}
                    className="footer-link-btn"
                  >
                    {topic.tabLabel}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Standards Compliance */}
          <div>
            <div className="apple-footer-col-title">
              Standards Compliance
            </div>
            <ul className="apple-footer-links">
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('epd')} className="footer-link-btn">
                  ISO 14025:2006 Type III
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('iso-standards')} className="footer-link-btn">
                  EN 15804+A2:2019 Core PCR
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('pcr')} className="footer-link-btn">
                  UL 10010-4 Part B PCR
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('data-quality')} className="footer-link-btn">
                  ecoinvent v3.12 Cutoff LCI
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('gwp-impacts')} className="footer-link-btn">
                  PEF 3.0 / EF 3.1 Characterization
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Registries & Formats */}
          <div>
            <div className="apple-footer-col-title">
              Registries & Formats
            </div>
            <ul className="apple-footer-links">
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('epd')} className="footer-link-btn">
                  The International EPD® System
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('more-info')} className="footer-link-btn">
                  ILCD+EPD Schema 1.2 XML
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('more-info')} className="footer-link-btn">
                  EcoPlatform Verified Format
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('sustainability')} className="footer-link-btn">
                  USGBC LEED v4.1 MR Credit
                </button>
              </li>
              <li className="apple-footer-link-item">
                <button type="button" onClick={() => handleTopicClick('sustainability')} className="footer-link-btn">
                  openEPD Verified API
                </button>
              </li>
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
