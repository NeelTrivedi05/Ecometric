import React from 'react';

const featureCards = [
  {
    eyebrow: '01 / Capture',
    title: 'Ingest every input',
    value: 'BOM → LCI',
    description: 'Bring engineering BOMs, utility records, transport manifests, and supporting PDFs into one traceable workspace.',
    tone: 'amber',
  },
  {
    eyebrow: '02 / Calculate',
    title: 'Model the full life cycle',
    value: '13 indicators',
    description: 'Map materials and energy to ecoinvent datasets, then calculate impacts across A1–A3, A4–A5, B, C, and D.',
    tone: 'emerald',
  },
  {
    eyebrow: '03 / Publish',
    title: 'Verify and export',
    value: 'EPD ready',
    description: 'Apply PCR gates, preserve lineage, and export verifier-ready PDF and ILCD+EPD declarations with confidence.',
    tone: 'blue',
  },
];

function CardSignal() {
  return (
    <div className="features-16__signal" aria-hidden="true">
      <div className="features-16__dot-field" />
      <div className="features-16__signal-line" />
      <div className="features-16__signal-glow" />
    </div>
  );
}

export default function Features16() {
  return (
    <section className="features-16 reveal-on-scroll" aria-labelledby="features-16-title">
      <div className="lp-container">
        <div className="features-16__heading">
          <div>
            <p className="apple-section-eyebrow">From evidence to declaration</p>
            <h2 id="features-16-title">
              Every impact,
              <br />
              <span>connected.</span>
            </h2>
          </div>
          <p className="features-16__intro">
            One continuous chain from product data to an audit-ready environmental declaration.
            EcoMetric keeps the signal moving without losing the evidence behind it.
          </p>
        </div>

        <div className="features-16__cards">
          {featureCards.map((card) => (
            <article className={`features-16__card features-16__card--${card.tone}`} key={card.eyebrow}>
              <CardSignal />
              <div className="features-16__card-copy">
                <p className="features-16__eyebrow">{card.eyebrow}</p>
                <div className="features-16__card-title-row">
                  <h3>{card.title}</h3>
                  <strong>{card.value}</strong>
                </div>
                <p className="features-16__description">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
