import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../studio/Icons';

const plans = [
  {
    name: 'Pilot',
    price: 'Free',
    detail: 'For teams proving out their first EPD workflow.',
    tone: 'light',
    features: ['1 active product model', 'BOM and PDF ingestion', 'Guided dataset mapping'],
  },
  {
    name: 'Studio',
    price: '$49',
    detail: 'Per month, per seat',
    tone: 'dark',
    features: ['Unlimited product models', 'Full LCIA and PCR validation', 'Verifier-ready PDF and ILCD export'],
  },
];

export default function Pricing11({ onLaunchApp }) {
  return (
    <section className="pricing-11 reveal-on-scroll" id="pricing">
      <div className="lp-container">
        <div className="pricing-11__bridge">
          <div className="pricing-11__card pricing-11__card--light">
            <div>
              <p className="pricing-11__eyebrow">01 / Pilot</p>
              <h3>Up and running in minutes.</h3>
              <p className="pricing-11__detail">{plans[0].detail}</p>
              <ol className="pricing-11__steps">
                <li><span>1</span><strong>Create your EPD workspace</strong></li>
                <li><span>2</span><strong>Upload BOM and evidence</strong></li>
                <li><span>3</span><strong>Start your first calculation</strong></li>
              </ol>
            </div>
          </div>

          <div className="pricing-11__phone" aria-hidden="true">
            <div className="pricing-11__phone-screen">
              <video
                className="pricing-11__phone-video"
                src="/pricing-phone.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            </div>
          </div>

          <div className="pricing-11__card pricing-11__card--dark">
            <div>
              <p className="pricing-11__eyebrow">02 / Studio</p>
              <h3>Simple, traceable pricing.</h3>
              <div className="pricing-11__price">{plans[1].price}<small>/ seat / month</small></div>
            </div>
            <div className="pricing-11__actions">
              <button type="button" className="pricing-11__button pricing-11__button--dark" onClick={onLaunchApp}>
                Start free trial <ChevronRightIcon size={15} />
              </button>
              <Link to="/pricing" className="pricing-11__model-link">View model pricing</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
