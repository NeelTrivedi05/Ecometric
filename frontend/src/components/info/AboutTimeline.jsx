import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../studio/Icons';

const milestones = [
  {
    date: 'Jan 2024',
    label: 'Foundation',
    title: 'A better starting point for LCA',
    body: 'EcoMetric began with one practical goal: make rigorous environmental accounting feel as clear as the product data manufacturers already own.',
    accent: 'Source data',
  },
  {
    date: 'Aug 2024',
    label: 'BOM intelligence',
    title: 'Engineering data, finally connected',
    body: 'BOMs, energy records, transport, and manufacturing inputs come together in a structured workspace built for real industrial products.',
    accent: 'Inventory mapping',
  },
  {
    date: 'Mar 2025',
    label: 'Impact engine',
    title: 'Every lifecycle stage in view',
    body: 'Model A1–A3 through C1–C4 and Module D with ecoinvent v3.12, consistent characterization, and transparent assumptions.',
    accent: 'Impact calculation',
  },
  {
    date: 'Oct 2025',
    label: 'Verification',
    title: 'Audit-ready by design',
    body: 'PCR gates, data quality ratings, and tabular lineage give verifiers a direct path from every result back to its source.',
    accent: 'Independent review',
  },
  {
    date: 'Apr 2026',
    label: 'EPD publishing',
    title: 'Results that move decisions',
    body: 'Publish clear Type III EPDs and machine-readable outputs that help teams compare, improve, and decarbonize products faster.',
    accent: 'EPD output',
  },
];

export default function AboutTimeline() {
  const [activeIndex, setActiveIndex] = useState(2);
  const active = milestones[activeIndex];
  const progress = `${(activeIndex / (milestones.length - 1)) * 100}%`;

  const move = (direction) => {
    setActiveIndex((current) => Math.min(
      milestones.length - 1,
      Math.max(0, current + direction)
    ));
  };

  return (
    <section className="about-timeline" aria-labelledby="about-timeline-title">
      <div className="about-timeline__heading">
        <span className="about-timeline__eyebrow">About EcoMetric</span>
        <h2 id="about-timeline-title">Our journey in environmental intelligence</h2>
      </div>

      <div className="about-timeline__active">
        <div className="about-timeline__active-copy">
          <span className="about-timeline__active-date">{active.date}</span>
          <div>
            <span className="about-timeline__active-accent">{active.accent}</span>
            <h3>{active.title}</h3>
            <p>{active.body}</p>
          </div>
        </div>
        <div className="about-timeline__visual" aria-hidden="true">
          <div className="about-timeline__visual-ring">
            <span />
          </div>
          <span className="about-timeline__visual-label">LCA / EPD</span>
        </div>
      </div>

      <div className="about-timeline__navigation">
        <div className="about-timeline__labels">
          {milestones.map((milestone, index) => (
            <button
              type="button"
              key={milestone.label}
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
            >
              {milestone.label}
            </button>
          ))}
        </div>
        <div className="about-timeline__rail">
          <div className="about-timeline__rail-fill" style={{ width: progress }} />
          {milestones.map((milestone, index) => (
            <button
              type="button"
              aria-label={`Show ${milestone.label}`}
              aria-pressed={index === activeIndex}
              className={index <= activeIndex ? 'is-active' : ''}
              key={milestone.date}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <div className="about-timeline__dates">
          {milestones.map((milestone, index) => (
            <span className={index === activeIndex ? 'is-active' : ''} key={milestone.date}>
              {milestone.date}
            </span>
          ))}
        </div>
      </div>

      <div className="about-timeline__controls">
        <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label="Previous milestone">
          <ChevronLeftIcon size={16} />
        </button>
        <button type="button" onClick={() => move(1)} disabled={activeIndex === milestones.length - 1} aria-label="Next milestone">
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </section>
  );
}
