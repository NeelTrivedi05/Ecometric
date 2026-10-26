import React from 'react';
import { useNavigate } from 'react-router-dom';

function SocialIcon({ kind }) {
  const paths = {
    x: 'M5 4h3.7l3.3 4.4L15.8 4H19l-5.5 6.3L19.5 20h-3.7l-3.8-5-4.2 5H4.6l5.8-6.9L5 4Zm2.8 1.7 8.4 12.6h.9L8.7 5.7h-.9Z',
    linkedin: 'M6.5 8.2H3.2V20h3.3V8.2ZM4.85 3A1.95 1.95 0 1 0 4.85 6.9 1.95 1.95 0 0 0 4.85 3ZM20.8 13.25c0-3.55-1.9-5.2-4.45-5.2-2.05 0-2.95 1.13-3.46 1.93V8.2H9.6V20h3.29v-5.84c0-1.54.3-3.03 2.2-3.03 1.88 0 1.9 1.76 1.9 3.13V20h3.8v-6.75Z',
    github: 'M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.7c-2.66.58-3.22-1.13-3.22-1.13-.43-1.1-1.06-1.4-1.06-1.4-.87-.6.07-.59.07-.59.96.07 1.47.99 1.47.99.85 1.46 2.23 1.04 2.77.8.09-.62.33-1.04.6-1.28-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.9.98-2.57-.1-.24-.43-1.22.1-2.54 0 0 .8-.26 2.62.98a9.1 9.1 0 0 1 4.77 0c1.82-1.24 2.62-.98 2.62-.98.53 1.32.2 2.3.1 2.54.61.67.98 1.53.98 2.57 0 3.67-2.23 4.48-4.36 4.72.34.3.64.87.64 1.75v2.6c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z',
    instagram: 'M18.5 3.5h-13A2 2 0 0 0 3.5 5.5v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2Zm-6.5 4.2a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm5.2-1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer id="footer" className="apple-footer footer-8">
      <div className="footer-8__grid">
        <div className="footer-8__intro">
          <p>EcoMetric is the modern and intuitive way to model, verify, and publish environmental product data.</p>
          <div className="footer-8__socials" aria-label="EcoMetric social links">
            <a href="https://x.com" aria-label="EcoMetric on X"><SocialIcon kind="x" /></a>
            <a href="https://www.instagram.com" aria-label="EcoMetric on Instagram"><SocialIcon kind="instagram" /></a>
            <a href="https://github.com" aria-label="EcoMetric on GitHub"><SocialIcon kind="github" /></a>
            <a href="https://www.linkedin.com" aria-label="EcoMetric on LinkedIn"><SocialIcon kind="linkedin" /></a>
          </div>
        </div>

        <div className="footer-8__column">
          <h2>Product</h2>
          <a href="#solution">Platform overview</a>
          <a href="#how-it-works">How it works</a>
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

      <div className="footer-8__wordmark" aria-hidden="true">ECOMETRIC</div>
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
