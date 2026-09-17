import React from 'react';
import { ChevronRightIcon } from '../studio/Icons';

export default function CtaBanner({ onLaunchApp }) {
  return (
    <section style={{ padding: '60px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #EFE4D8' }}>
      <div className="lp-container">
        <div style={{
          backgroundColor: '#C25A23',
          borderRadius: '16px',
          padding: '48px 36px',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(194, 90, 35, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              Ready to automate your EPD workflow?
            </h2>
            <p style={{ fontSize: '15px', color: '#FDF2EB', marginBottom: '28px', lineHeight: '1.6' }}>
              Generate third-party verifier ready Environmental Product Declarations in minutes with complete data lineage.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onLaunchApp}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#C25A23',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <span>Create your first EPD</span>
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
