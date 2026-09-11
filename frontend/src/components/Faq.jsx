import React, { useState } from 'react';
import { FAQ_DATA } from '../data/epdData';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(prev => (prev === idx ? -1 : idx));
  };

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="section-title">Common Questions & Methodology</h2>
          <p className="section-subtitle">
            Everything you need to know about LCIA characterization factors, PCR compliance, and the verification pipeline.
          </p>
        </div>

        <div className="faq-list">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggle(idx)}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon">+</span>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
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
