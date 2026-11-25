import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '../studio/Icons';

const VIDEO_SOURCE = '/new_video.mp4';

export default function Hero9({ onLaunchApp }) {
  return (
    <section className="hero-9" id="product">
      <video
        className="hero-9__video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/hero-background-poster.jpg"
        aria-hidden="true"
      >
        <source src={VIDEO_SOURCE} type="video/mp4" />
      </video>
      <div className="hero-9__veil" aria-hidden="true" />

      <div className="hero-9__content">
        <h1 className="hero-9__title">
          <span className="hero-9__reveal hero-9__reveal--two">From materials</span>
          <span className="hero-9__reveal hero-9__reveal--three">to a draft EPD.</span>
        </h1>
        <p className="hero-9__description hero-9__reveal hero-9__reveal--four">
          Upload your bill of materials, review its environmental impacts, and prepare an Environmental Product Declaration for verification.
        </p>
        <div className="hero-9__actions hero-9__reveal hero-9__reveal--five">
          <button type="button" onClick={onLaunchApp} className="hero-9__primary">
            Create a project <ChevronRightIcon size={16} />
          </button>
          <Link className="hero-9__secondary" to="/how-it-works">
            See how it works
          </Link>
        </div>
      </div>

      <div className="hero-9__footer hero-9__reveal hero-9__reveal--six">
        <Link to="/verify">Verify a declaration</Link>
        <span className="hero-9__scroll-hint" aria-hidden="true">
          Scroll to explore <span />
        </span>
      </div>
    </section>
  );
}
