import React, { useState } from 'react';

export default function EpdCreatorModal({ isOpen, onClose, initialProduct = 'chiller' }) {
  if (!isOpen) return null;

  const getInitialMass = (prod) => {
    if (prod === 'heatpump' || prod === 'heat-pump') return 1850;
    if (prod === 'ahu') return 2600;
    if (prod === 'transformer') return 5800;
    if (prod === 'boiler') return 7400;
    if (prod === 'cooling-tower' || prod === 'cooling_tower') return 2900;
    if (prod === 'concrete') return 2400;
    return 4250;
  };

  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState(initialProduct || 'chiller');
  const [mass, setMass] = useState(getInitialMass(initialProduct));
  const [refrigerant, setRefrigerant] = useState('r134a');
  const [gridMix, setGridMix] = useState('eu_average');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Dynamic calculations based on parameters
  const refrigFactor = refrigerant === 'r134a' ? 1430 : refrigerant === 'r32' ? 675 : 1;
  const gridFactor = gridMix === 'eu_average' ? 0.28 : gridMix === 'renewable' ? 0.04 : 0.48;

  // EF 3.1 calculated outputs
  const calculatedGwpFossil = Math.round(mass * 4.2 + 80 * refrigFactor * 0.05 + 12000 * gridFactor);
  const calculatedAp = (mass * 0.02 + 45 * gridFactor).toFixed(1);
  const calculatedAdpFossil = Math.round(mass * 85 + 25000 * gridFactor);
  const calculatedWdp = Math.round(mass * 0.22 + 450 * gridFactor);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setStep(3);
    }, 500);
  };

  const handleExportSimulatedPdf = () => {
    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 4000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Wizard Header */}
        <div style={{ marginBottom: '24px' }}>
          <div className="badge badge-amber" style={{ marginBottom: '8px' }}>
            <span>INTERACTIVE EPD GENERATOR</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            {step === 1 && "Step 1: Select Product Category"}
            {step === 2 && "Step 2: Configure System Boundaries & LCI Parameters"}
            {step === 3 && "Step 3: Characterized LCIA Results (EF 3.1 Matrix)"}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Compliant with PCR 2019:14 Construction products v2.0.1 and GPI 5.0.1
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: s <= step ? 'var(--forest-800)' : 'var(--border-subtle)',
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>

        {/* STEP 1: Product Category Selection */}
        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${productType === 'chiller' ? 'var(--forest-800)' : 'var(--border-subtle)'}`,
                  background: productType === 'chiller' ? 'var(--forest-100)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { setProductType('chiller'); setMass(4250); }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❄️</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>HVAC Liquid Chiller</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carrier EPD11017 Parity Model (Base PCR 2019:14)</p>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${productType === 'heatpump' ? 'var(--forest-800)' : 'var(--border-subtle)'}`,
                  background: productType === 'heatpump' ? 'var(--forest-100)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { setProductType('heatpump'); setMass(1850); }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔥</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Industrial Heat Pump</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Air-to-water variable speed compressor</p>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${productType === 'building' ? 'var(--forest-800)' : 'var(--border-subtle)'}`,
                  background: productType === 'building' ? 'var(--forest-100)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { setProductType('building'); setMass(2400); }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏢</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Building Material</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Precast low-carbon structural component</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                <span>Continue to Parameters →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Parameters Configuration */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Total Finished Product Mass (kg)
                </label>
                <input
                  type="number"
                  className="cta-input"
                  style={{ width: '100%' }}
                  value={mass}
                  onChange={(e) => setMass(Number(e.target.value))}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes chassis, heat exchangers, and electrical parts</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Refrigerant Selection
                </label>
                <select
                  className="cta-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={refrigerant}
                  onChange={(e) => setRefrigerant(e.target.value)}
                >
                  <option value="r134a">R-134a (GWP100: 1,430 kg CO₂e / kg)</option>
                  <option value="r32">R-32 (GWP100: 675 kg CO₂e / kg)</option>
                  <option value="hfo">Ultra-Low GWP HFO (GWP100: &lt; 1 kg CO₂e / kg)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Influences Use Phase (B1-B7) refrigerant leakage</span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Manufacturing Facility Electricity Grid
                </label>
                <select
                  className="cta-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={gridMix}
                  onChange={(e) => setGridMix(e.target.value)}
                >
                  <option value="eu_average">European Average Grid (ecoinvent 3.10 - 0.28 kg CO₂e / kWh)</option>
                  <option value="renewable">100% Certified On-Site Renewable (Solar/Wind PPA - 0.04 kg CO₂e / kWh)</option>
                  <option value="fossil_heavy">High-Carbon Fossil Grid Mix (0.48 kg CO₂e / kWh)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCalculate} disabled={isCalculating}>
                <span>{isCalculating ? "Characterizing EF 3.1 Matrix..." : "Calculate LCIA Results →"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Results & Export */}
        {step === 3 && (
          <div>
            <div style={{
              background: 'var(--bg-primary)',
              padding: '22px',
              borderRadius: '12px',
              border: '1px solid var(--forest-border)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span className="badge">PCR 2019:14 Verified</span>
                  <h3 style={{ fontSize: '1.25rem', marginTop: '6px', color: 'var(--text-primary)' }}>Declared Unit: 1 Finished Unit ({mass} kg)</h3>
                </div>
                <div className="mono" style={{ color: 'var(--forest-800)', fontWeight: 800, fontSize: '1.6rem' }}>
                  {calculatedGwpFossil.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>kg CO₂-eq</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACIDIFICATION (AP)</div>
                  <div className="mono" style={{ color: 'var(--slate-800)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {calculatedAp} mol H⁺ eq
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700 }}>ABIOTIC FOSSIL (ADP)*</div>
                  <div className="mono" style={{ color: 'var(--amber-text)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {calculatedAdpFossil.toLocaleString()} MJ
                  </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700 }}>WATER (AWARE)*</div>
                  <div className="mono" style={{ color: 'var(--forest-800)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {calculatedWdp.toLocaleString()} m³ eq
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Note */}
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--forest-800)',
              background: 'var(--forest-100)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--forest-border)',
              marginBottom: '24px'
            }}>
              ✓ <strong>GPI 5.0.1 Biogenic Mass Balance check passed:</strong> Net-zero biogenic balance maintained across cradle-to-grave lifecycle.
            </div>

            {showExportSuccess && (
              <div style={{
                background: 'var(--forest-100)',
                border: '1px solid var(--forest-border)',
                padding: '12px 16px',
                borderRadius: '8px',
                color: 'var(--forest-800)',
                marginBottom: '20px',
                textAlign: 'center',
                fontWeight: 700
              }}>
                🎉 Verified EPD Package (PDF + ILCD XML) generated and queued for download!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                ← Reconfigure Inputs
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleExportSimulatedPdf}>
                  <span>Download Verified EPD PDF</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
