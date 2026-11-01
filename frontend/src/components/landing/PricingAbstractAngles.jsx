import React, { useState } from 'react';
import { ChevronRightIcon, CheckCircleIcon } from '../studio/Icons';
import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group';

const plans = [
  {
    name: 'Pilot',
    description: 'For teams starting their first audit-ready EPD workflow.',
    monthly: 'Free',
    annual: 'Free',
    features: ['1 active product model', 'BOM and PDF ingestion', 'Guided dataset mapping', 'Core LCIA indicators'],
    tone: 'light',
  },
  {
    name: 'Studio',
    description: 'For sustainability teams publishing EPDs at production scale.',
    monthly: 49,
    annual: 540,
    inrRate: 84,
    features: ['Unlimited product models', 'Full LCIA and PCR validation', 'ecoinvent v3.12 lineage', 'Verifier-ready PDF and ILCD export'],
    tone: 'featured',
  },
  {
    name: 'Enterprise',
    description: 'For manufacturers managing portfolios, facilities, and verification programs.',
    monthly: 'Custom',
    annual: 'Custom',
    features: ['Multi-facility workspaces', 'Account and role controls', 'Custom PCR and data rules', 'Priority verification support'],
    tone: 'light',
  },
];

export default function PricingAbstractAngles({ onLaunchApp }) {
  const [billingCycle, setBillingCycle] = useState('annual');
  const studioPlan = plans.find((plan) => plan.name === 'Studio');
  const annualSavings = Math.round(((studioPlan.monthly * 12 - studioPlan.annual) / (studioPlan.monthly * 12)) * 100);

  return (
    <section className="pricing-angles" aria-labelledby="pricing-angles-title">
      <div className="lp-container">
        <header className="pricing-angles__header">
          <h1 id="pricing-angles-title">
            EcoMetric plans
          </h1>
          <p>
            Simple, transparent pricing for audit-ready lifecycle intelligence.
          </p>
        </header>

        <div className="pricing-angles__free-start">
          <div>
            <h2>Start free</h2>
            <p>One product model included <span aria-hidden="true">ⓘ</span></p>
          </div>
          <button type="button" onClick={onLaunchApp}>Get started <ChevronRightIcon size={15} /></button>
        </div>

        <div className="pricing-angles__billing-toggle" aria-label="Billing cycle">
          <span>Billing cycle</span>
          <ButtonGroup
            selectedKeys={[billingCycle]}
            onSelectionChange={([selectedKey]) => setBillingCycle(selectedKey)}
          >
            <ButtonGroupItem id="monthly">Monthly</ButtonGroupItem>
            <ButtonGroupItem id="annual">
              Yearly <em>Save {annualSavings}%</em>
            </ButtonGroupItem>
          </ButtonGroup>
        </div>

        <div className="pricing-angles__grid">
          {plans.map((plan, index) => (
            <article className={`pricing-angles__plan pricing-angles__plan--${plan.tone}`} key={plan.name}>
              <div className="pricing-angles__plan-top">
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
                <div className="pricing-angles__price">
                  {typeof plan[billingCycle] === 'number' ? `$${plan[billingCycle]}` : plan[billingCycle]}
                  {plan.name !== 'Enterprise' && <small>{billingCycle === 'annual' ? '/ annum' : '/ month'}</small>}
                </div>
                {typeof plan[billingCycle] === 'number' && (
                  <span className="pricing-angles__price-inr">
                    Approx. ₹{(plan[billingCycle] * plan.inrRate).toLocaleString('en-IN')} {billingCycle === 'annual' ? '/ annum' : '/ month'}
                  </span>
                )}
                {plan.name !== 'Enterprise' && <span className="pricing-angles__billing">Billed {billingCycle === 'annual' ? 'annually' : 'monthly'}.</span>}
              </div>

              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><CheckCircleIcon size={15} />{feature}</li>
                ))}
              </ul>

              <button type="button" className="pricing-angles__button" onClick={onLaunchApp}>
                {plan.name === 'Enterprise' ? 'Talk to our team' : 'Get started'}
                <ChevronRightIcon size={15} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
