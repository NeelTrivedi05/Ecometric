import React from 'react';
import { FileTextIcon, TagIcon, LeafIcon, ShieldCheckIcon } from '../studio/Icons';

const stats = [
  {
    value: '~37%',
    label: 'of global energy- and process-related CO₂ emissions come from buildings and construction',
    source: 'UNEP Global Status Report for Buildings and Construction (2022 data)',
  },
  {
    value: '~11%',
    label: 'of global emissions come from making building materials and constructing buildings: embodied carbon',
    source: 'World Green Building Council, Bringing Embodied Carbon Upfront (2019)',
  },
  {
    value: '5 yrs',
    label: 'how long a verified EPD stays valid, once created',
    source: 'Typical validity under ISO 14025 / EN 15804',
  },
];

const reasons = [
  {
    icon: FileTextIcon,
    title: 'Regulations require it',
    desc: (
      <>
        Laws such as the <strong>Buy Clean California Act</strong>, France's{' '}
        <strong>RE2020</strong> and the revised <strong>EU Construction Products
        Regulation</strong> increasingly require verified environmental data for products.
      </>
    ),
  },
  {
    icon: TagIcon,
    title: 'Win projects and tenders',
    desc: 'Public procurement and large developers more and more often require EPDs in their specifications. No EPD can mean no bid.',
  },
  {
    icon: LeafIcon,
    title: 'Green building credits',
    desc: (
      <>
        <strong>LEED</strong>, <strong>BREEAM</strong> and other rating systems award points
        for using products that have EPDs.
      </>
    ),
  },
  {
    icon: ShieldCheckIcon,
    title: 'Stop greenwashing',
    desc: 'New anti-greenwashing rules restrict vague claims like "eco-friendly". An EPD backs your claims with verified data.',
  },
];

export default function WhyEpdMatters() {
  return (
    <section className="epd-why product-tile-parchment reveal-on-scroll" id="why-epd">
      <div className="lp-container">
        <div className="apple-section-header">
          <h2 className="apple-section-title">Why it matters</h2>
          <p className="apple-section-subtitle">
            Green claims are everywhere, but buyers, regulators and certifiers now want
            evidence. An EPD is that evidence: a single, verified source of truth about a
            product's footprint.
          </p>
        </div>

        <div className="epd-why__stats">
          {stats.map((stat) => (
            <article className="epd-why__stat stagger-card" key={stat.value}>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
              <span>{stat.source}</span>
            </article>
          ))}
        </div>

        <div className="epd-why__reasons">
          {reasons.map(({ icon: Icon, title, desc }, idx) => (
            <article className="epd-why__reason stagger-card" key={title}>
              <span className="epd-icon-chip">
                <Icon size={18} />
              </span>
              <div>
                <p className="epd-why__reason-index">Reason 0{idx + 1}</p>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="epd-why__closing">
          Without an EPD, a product is increasingly invisible to the market that matters most.
        </p>
      </div>
    </section>
  );
}
