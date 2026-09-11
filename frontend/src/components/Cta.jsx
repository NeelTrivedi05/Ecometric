import React, { useState } from 'react';

export default function Cta({ onOpenWizard }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => onOpenWizard(), 700);
    }
  };

  return (
    <section className="cta-section" id="pricing">
      <div className="container">
        <div className="cta-box">
          <div className="badge" style={{ marginBottom: '20px' }}>
            <span className="badge-pulse-dot"></span>
            <span>GET STARTED TODAY</span>
          </div>

          <h2 className="cta-title">
            Ready to automate your <br />
            <span className="gradient-text">EPD workflow?</span>
          </h2>

          <p className="cta-subtitle">
            Join hundreds of manufacturers, LCA practitioners, and environmental consultants generating verified, third-party audit-ready EPDs in hours instead of months.
          </p>

          <form className="cta-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="cta-input"
              placeholder="Enter your work email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-lg">
              <span>{submitted ? "Launching Wizard..." : "Create your first EPD"}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          <div className="cta-guarantees">
            <div>✓ 14-day free trial</div>
            <div>✓ No credit card required</div>
            <div>✓ Full PCR 2019:14 & GPI 5.0.1 validation</div>
          </div>
        </div>
      </div>
    </section>
  );
}
