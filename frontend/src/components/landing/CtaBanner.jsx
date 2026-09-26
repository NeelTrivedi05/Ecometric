import React from 'react';
import { ChevronRightIcon } from '../studio/Icons';

export default function CtaBanner({ onLaunchApp }) {
  return (
    <section className="product-tile-dark-3" style={{ textAlign: 'center', padding: '96px 0' }}>
      <div className="lp-container">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="apple-section-eyebrow on-dark" style={{ marginBottom: '16px' }}>
            Instant Deployment
          </div>

          <h2 style={{
            fontFamily: 'var(--apple-font-display)',
            fontSize: '44px',
            fontWeight: 600,
            color: 'var(--apple-body-on-dark)',
            marginBottom: '16px',
            lineHeight: '1.1',
            letterSpacing: '-0.025em'
          }}>
            Ready to automate your EPD workflow?
          </h2>

          <p style={{
            fontFamily: 'var(--apple-font-text)',
            fontSize: '18px',
            color: 'var(--apple-body-muted)',
            marginBottom: '36px',
            lineHeight: '1.47',
            letterSpacing: '-0.2px'
          }}>
            Generate third-party verifier ready Environmental Product Declarations in minutes with complete ecoinvent v3.12 data lineage.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onLaunchApp}
              className="btn-apple-primary"
              style={{ padding: '14px 32px', fontSize: '16px' }}
            >
              <span>Create your first EPD</span>
              <ChevronRightIcon size={16} />
            </button>

            <a
              href="#solution"
              className="btn-apple-secondary-on-dark"
              style={{ padding: '14px 28px', fontSize: '16px' }}
            >
              Learn about PCR rules
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
