import React, { useState } from 'react';
import { FAQS } from '../../data/landingData';
import { ChevronRightIcon } from '../studio/Icons';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section className="product-tile-parchment" id="faq">
      <div className="lp-container">
        <div className="apple-section-header">
          <div className="apple-section-eyebrow">
            Regulatory Knowledge Base
          </div>
          <h2 className="apple-section-title">
            Frequently Asked Questions
          </h2>
          <p className="apple-section-subtitle">
            Essential facts on ISO 14025, EN 15804+A2, ecoinvent v3.12, and third-party verification.
          </p>
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="apple-disclosure-item">
                <button
                  type="button"
                  className="apple-disclosure-trigger"
                  onClick={() => toggle(idx)}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    color: 'var(--apple-primary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <ChevronRightIcon size={16} />
                  </span>
                </button>
                {isOpen && (
                  <div className="apple-disclosure-content">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
