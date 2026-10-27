import React from 'react';
import { ChevronRightIcon } from '../studio/Icons';

const VIDEO_SOURCE = '/landing-bg.mp4';

export default function Hero9({ onLaunchApp }) {
  return (
    <section className="hero-9" id="product">
      <video
        className="hero-9__video"
        autoPlay
        loop
        muted
        playsInline
        poster="/favicon.svg"
        aria-hidden="true"
      >
        <source src={VIDEO_SOURCE} type="video/mp4" />
      </video>
      <div className="hero-9__veil" aria-hidden="true" />

      <div className="hero-9__content">
        <h1 className="hero-9__title">
          <span className="hero-9__reveal hero-9__reveal--two">Think</span>
          <span className="hero-9__reveal hero-9__reveal--three">Green</span>
        </h1>
        <p className="hero-9__description hero-9__reveal hero-9__reveal--four">
          Turn engineering data into audit-ready EPDs, with every impact mapped,
          verified, and ready to move the built world forward.
        </p>
        <div className="hero-9__actions hero-9__reveal hero-9__reveal--five">
          <button type="button" onClick={onLaunchApp} className="hero-9__primary">
            Start creating EPD <ChevronRightIcon size={16} />
          </button>
          <a className="hero-9__secondary" href="#solution">
            Explore EcoMetric
          </a>
        </div>
      </div>

      <div className="hero-9__footer hero-9__reveal hero-9__reveal--six">
        <span>Lifecycle intelligence for the products that shape our world</span>
        <span className="hero-9__scroll-hint" aria-hidden="true">
          Scroll to explore <span />
        </span>
      </div>
    </section>
  );
}
