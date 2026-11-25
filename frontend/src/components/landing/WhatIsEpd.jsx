import React from 'react';
import { Link } from 'react-router-dom';

export default function WhatIsEpd() {
  return (
    <section className="declaration-guide" id="what-is-epd" aria-labelledby="epd-guide-title">
      <div className="lp-container declaration-guide__layout">
        <div>
          <h2 id="epd-guide-title">How to read an EPD</h2>
          <p>An Environmental Product Declaration records the impacts of making, using and disposing of a product. Each result belongs to a particular stage and unit.</p>
          <p>Start with the product and the stages covered. In this chiller example, A1–A3 covers materials, transport to the factory and manufacturing. Electricity used to run the chiller falls outside those stages.</p>
          <Link to="/info/epd">Read the EPD guide →</Link>
        </div>
        <figure className="declaration-guide__sheet">
          <figcaption>Sample calculation <span>A1–A3</span></figcaption>
          <h3>Water-cooled chiller</h3>
          <p>Carrier AquaEdge 19DV · Product stage</p>
          <table aria-label="Sample chiller product-stage impacts">
            <thead><tr><th scope="col">Impact indicator</th><th scope="col">Result</th></tr></thead>
            <tbody>
              <tr><th scope="row">Global warming</th><td>8,632 kg CO₂ eq</td></tr>
              <tr><th scope="row">Acidification</th><td>31.6 mol H⁺ eq</td></tr>
              <tr><th scope="row">Fossil resource use</th><td>114,751 MJ</td></tr>
            </tbody>
          </table>
          <small>Rounded results from EcoMetric’s demonstration inventory.</small>
        </figure>
      </div>
    </section>
  );
}
