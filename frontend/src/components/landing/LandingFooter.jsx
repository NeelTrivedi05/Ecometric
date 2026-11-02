import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer id="footer" className="apple-footer footer-8">
      <div className="footer-8__grid">
        <div className="footer-8__intro">
          <p>EcoMetric is the modern and intuitive way to model, verify, and publish environmental product data.</p>
        </div>

        <div className="footer-8__column">
          <h2>Product</h2>
          <a href="#solution">Platform overview</a>
          <a href="#how-it-works">How it works</a>
          <button type="button" onClick={() => navigate('/verify')}>Verify Authenticity</button>
          <button type="button" onClick={() => navigate('/login')}>Launch Studio</button>
        </div>
        <div className="footer-8__column">
          <h2>Resources</h2>
          <button type="button" onClick={() => navigate('/info/epd')}>EPD knowledge base</button>
          <button type="button" onClick={() => navigate('/info/pcr')}>PCR standards</button>
          <button type="button" onClick={() => navigate('/info/data-quality')}>Data quality guides</button>
        </div>
        <div className="footer-8__column">
          <h2>Company</h2>
          <button type="button" onClick={() => navigate('/info/more-info')}>About EcoMetric</button>
          <a href="mailto:hello@ecometric.com">Contact</a>
          <span className="footer-8__badge">LCA READY</span>
        </div>
      </div>

      <div className="footer-8__wordmark"><img src="/brand-wordmark.png" alt="EcoMetric" /></div>
      <div className="footer-8__bottom">
        <span>© {new Date().getFullYear()} EcoMetric Systems Inc. / Built for transparent LCA.</span>
        <div>
          <a href="#footer">Security</a>
          <a href="#footer">Terms of service</a>
          <a href="#footer">Privacy policy</a>
        </div>
      </div>
    </footer>
  );
}
