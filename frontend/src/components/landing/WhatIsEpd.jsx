import React from 'react';
import { BookOpenIcon, LayersIcon, ResultsIcon, ShieldCheckIcon } from '../studio/Icons';

const facts = [
  {
    icon: BookOpenIcon,
    title: 'Standardised',
    desc: (
      <>
        A Type III environmental declaration under <strong>ISO 14025</strong>. Construction
        products follow <strong>EN 15804+A2</strong> or <strong>ISO 21930</strong>.
      </>
    ),
  },
  {
    icon: LayersIcon,
    title: 'Science-based',
    desc: (
      <>
        Built on a full <strong>Life Cycle Assessment (LCA)</strong> carried out to ISO 14040
        and 14044.
      </>
    ),
  },
  {
    icon: ResultsIcon,
    title: 'Comparable',
    desc: (
      <>
        Follows <strong>Product Category Rules (PCR)</strong>, so products in the same
        category are measured the same way.
      </>
    ),
  },
  {
    icon: ShieldCheckIcon,
    title: 'Independently verified',
    desc: (
      <>
        Checked by a third-party verifier, published by a programme operator, and usually{' '}
        <strong>valid for 5 years</strong>.
      </>
    ),
  },
];

// Illustrative values only, shown in EN 15804+A2 core indicator units.
const labelRows = [
  { name: 'Global warming potential', value: '12.4', unit: 'kg CO₂ eq', bold: true },
  { name: 'Ozone depletion', value: '3.1E-7', unit: 'kg CFC-11 eq' },
  { name: 'Acidification', value: '0.058', unit: 'mol H⁺ eq' },
  { name: 'Eutrophication, freshwater', value: '2.4E-4', unit: 'kg P eq' },
  { name: 'Photochemical ozone formation', value: '0.041', unit: 'kg NMVOC eq' },
  { name: 'Water deprivation', value: '1.9', unit: 'm³ world eq' },
];

function DeclarationLabel() {
  return (
    <aside className="epd-label" aria-label="Example of an EPD impact label">
      <p className="epd-label__kicker">Environmental Product</p>
      <p className="epd-label__title">Declaration</p>
      <div className="epd-label__meta">
        <span>Per declared unit</span>
        <span>Cradle to grave · A1–D</span>
      </div>
      <div className="epd-label__rule epd-label__rule--thick" />
      <p className="epd-label__heading">Impact indicators</p>
      <div className="epd-label__rule" />
      <dl className="epd-label__rows">
        {labelRows.map((row) => (
          <div className={`epd-label__row${row.bold ? ' epd-label__row--bold' : ''}`} key={row.name}>
            <dt>{row.name}</dt>
            <dd>
              {row.value} <span>{row.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="epd-label__rule epd-label__rule--thick" />
      <div className="epd-label__footer">
        <span className="epd-label__stamp">
          <ShieldCheckIcon size={14} /> Third-party verified
        </span>
        <span>ISO 14025 · EN 15804+A2</span>
      </div>
      <p className="epd-label__note">Illustrative values</p>
    </aside>
  );
}

export default function WhatIsEpd() {
  return (
    <section className="epd-what product-tile-light reveal-on-scroll" id="what-is-epd">
      <div className="lp-container">
        <div className="epd-what__top">
          <div className="epd-what__copy">
            <p className="apple-section-eyebrow">Understanding EPDs</p>
            <h2 className="apple-section-title">
              What is an Environmental Product Declaration?
            </h2>
            <p className="epd-what__lead">
              An Environmental Product Declaration (EPD) is a verified document that reports
              the environmental impact of a product across its whole life cycle, from raw
              material extraction to end of life.
            </p>
            <p className="epd-what__lead">
              Think of it as a <strong>nutrition label for products</strong>. It doesn't say a
              product is "green". It gives the facts, so anyone can compare.
            </p>
            <p className="epd-what__callout">
              An EPD doesn't certify that a product is "good". It discloses what the impact
              is, transparently.
            </p>
          </div>

          <DeclarationLabel />
        </div>

        <div className="epd-what__facts">
          {facts.map(({ icon: Icon, title, desc }, idx) => (
            <article className="epd-what__fact stagger-card" key={title}>
              <div className="epd-what__fact-head">
                <span className="epd-icon-chip">
                  <Icon size={18} />
                </span>
                <span className="epd-what__fact-index">0{idx + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
