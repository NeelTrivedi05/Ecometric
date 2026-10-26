import React from 'react';
import { LayersIcon, EditIcon, BuildingIcon, GlobeIcon, SearchIcon, ResultsIcon } from '../studio/Icons';

const audiences = [
  {
    icon: LayersIcon,
    title: 'Manufacturers',
    desc: "Show your product's real footprint, meet customer and regulatory demands, and find where to reduce impact.",
  },
  {
    icon: EditIcon,
    title: 'Architects & designers',
    desc: 'Compare materials on verified data and design lower-carbon buildings.',
  },
  {
    icon: BuildingIcon,
    title: 'Contractors & developers',
    desc: 'Meet project specifications and earn green building certification points.',
  },
  {
    icon: GlobeIcon,
    title: 'Government & public buyers',
    desc: 'Set carbon limits in tenders and buy cleaner products with confidence.',
  },
  {
    icon: SearchIcon,
    title: 'Sustainability consultants',
    desc: 'Use EPD data in whole-building LCAs and certification projects.',
  },
  {
    icon: ResultsIcon,
    title: 'Investors & ESG teams',
    desc: 'Track Scope 3 emissions and report supply-chain impact accurately.',
  },
];

export default function WhoNeedsEpd() {
  return (
    <section className="epd-who product-tile-dark reveal-on-scroll" id="who-needs-epd">
      <div className="lp-container">
        <div className="apple-section-header">
          <h2 className="apple-section-title">Who needs EPDs</h2>
          <p className="apple-section-subtitle">
            An EPD connects everyone in the value chain, from the people who make a product to
            the people who choose it.
          </p>
        </div>

        <div className="epd-who__grid">
          {audiences.map(({ icon: Icon, title, desc }) => (
            <article className="epd-who__card stagger-card" key={title}>
              <span className="epd-icon-chip">
                <Icon size={18} />
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
