import React from 'react';
import { LeafIcon } from '../studio/Icons';

export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '32px',
          paddingBottom: '36px',
          borderBottom: '1px solid #E5D6C8'
        }}>
          {/* Col 1 */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#C25A23',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LeafIcon size={16} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#2C221E' }}>EcoMetric</span>
            </div>
            <p style={{ fontSize: '13px', color: '#7A6B63', lineHeight: '1.6' }}>
              Automated Life Cycle Assessment & Environmental Product Declaration software for HVAC and industrial manufacturing.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2C221E', textTransform: 'uppercase', marginBottom: '12px' }}>
              Standards Compliance
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#5C4E46', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>ISO 14025:2006 Type III</li>
              <li>EN 15804+A2:2019 Core Rules</li>
              <li>UL 10010-4 Part B PCR</li>
              <li>ecoinvent v3.12 Cutoff LCI</li>
              <li>EF 3.1 Characterization</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2C221E', textTransform: 'uppercase', marginBottom: '12px' }}>
              Registries & Formats
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#5C4E46', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>The International EPD® System</li>
              <li>ILCD+EPD Schema 1.2 XML</li>
              <li>EcoPlatform Verified Format</li>
              <li>USGBC LEED v4.1 MR Credit</li>
            </ul>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '24px',
          fontSize: '12px',
          color: '#8A7A72'
        }}>
          <div>
            © {new Date().getFullYear()} EcoMetric Systems. All rights reserved.
          </div>
          <div>
            Compliant with ISO 14040/44 Life Cycle Assessment Principles.
          </div>
        </div>
      </div>
    </footer>
  );
}
