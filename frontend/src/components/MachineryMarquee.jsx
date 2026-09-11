import React from 'react';
import { MACHINERY_EPD_DATA } from '../data/epdData';

export default function MachineryMarquee({ onOpenWizard }) {
  // Duplicate array for seamless infinite marquee loop
  const marqueeItems = [...MACHINERY_EPD_DATA, ...MACHINERY_EPD_DATA];

  return (
    <section id="equipment" className="machinery-marquee-section">
      <div className="container">
        {/* Subtle Luxury Header */}
        <div className="marquee-header">
          <div className="marquee-pill-tag">
            <span className="marquee-pulse-dot"></span>
            <span>CORE MACHINERY COVERAGE • EN 15804+A2 & PCR 2019:14</span>
          </div>
          <div className="marquee-title-row">
            <h2 className="marquee-title">
              Industrial Equipment Requiring <span className="text-gradient">Verified EPDs</span>
            </h2>
            <p className="marquee-desc">
              Mandatory across commercial building tenders, European Ecodesign, and corporate Scope 3 audits.
              Hover over any equipment to pause and inspect specifications.
            </p>
          </div>
        </div>
      </div>

      {/* Infinite Scrolling Track */}
      <div className="marquee-container">
        <div className="marquee-track">
          {marqueeItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="marquee-card"
              onClick={() => onOpenWizard && onOpenWizard(item.id)}
            >
              {/* Image Container with Studio Lighting & Vignette */}
              <div className="marquee-card-image-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  className="marquee-card-img"
                  loading="lazy"
                />
                <div className="marquee-card-gradient" />

                {/* Top Badge Overlay */}
                <div className="marquee-card-top">
                  <span className="marquee-pcr-pill">{item.pcr.split(' ')[0]} {item.pcr.split(' ')[1] || 'PCR'}</span>
                  <span className="marquee-capacity-pill">{item.typicalCapacity}</span>
                </div>

                {/* Hotspot Alert Pill */}
                <div className="marquee-hotspot-pill">
                  <span className="hotspot-dot"></span>
                  <span>{item.keyHotspots[0]?.label}</span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="marquee-card-content">
                <div className="marquee-card-category">{item.category}</div>
                <h3 className="marquee-card-name">{item.name}</h3>
                <p className="marquee-card-tagline">{item.tagline}</p>

                {/* Card Footer with Metrics & CTA */}
                <div className="marquee-card-footer">
                  <div className="marquee-gwp-stat">
                    <span className="stat-label">Typical GWP</span>
                    <span className="stat-value">{item.gwpTypical.split(' ')[0]} <span className="stat-unit">kg CO₂e</span></span>
                  </div>

                  <button
                    type="button"
                    className="marquee-card-cta"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWizard && onOpenWizard(item.id);
                    }}
                  >
                    <span>Generate EPD</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
