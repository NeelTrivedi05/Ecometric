import React, { useState } from 'react';
import { FAQS } from '../../data/landingData';
import { ChevronRightIcon } from '../studio/Icons';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{ padding: '80px 0', backgroundColor: '#FAF6F0' }}>
      <div className="lp-container">
        <div className="section-header">
          <div className="section-badge">
            <span>Regulatory Knowledge Base</span>
          </div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about ISO 14025, EN 15804+A2, ecoinvent v3.12, and third-party verification.
          </p>
        </div>

        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(idx)}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    color: '#C25A23',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <ChevronRightIcon size={16} />
                  </span>
                </button>
                {isOpen && (
                  <div className="faq-answer">
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
