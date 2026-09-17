import React from 'react';
import { useStudio, METHODOLOGIES } from '../../../context/StudioContext';
import { ResultsIcon, ChevronRightIcon, CheckIcon, RefreshCwIcon } from '../Icons';
import LciaExtractorSection from '../LciaExtractorSection';

export default function ResultsView() {
  const {
    lca,
    selectedMethodology,
    changeMethodology,
    setActivePhase,
    showNotif,
    isLoading,
  } = useStudio();

  const formatValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '—';
    if (Math.abs(val) >= 1000) return Math.round(val).toLocaleString();
    if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(2);
    return val.toFixed(2);
  };

  const currentMethod = METHODOLOGIES[selectedMethodology] || METHODOLOGIES.ef31;

  return (
    <div className="view-container">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ResultsIcon size={24} style={{ color: 'var(--accent)' }} />
              6. View Results
            </h1>
            <p className="view-subtitle" style={{ marginBottom: 0 }}>
              Environmental impact indicators across life cycle stages (pure characterization metrics, prior to provider export declaration).
            </p>
          </div>

          {/* Interactive Quick Methodology Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Methodology:
            </span>
            <select
              className="form-input"
              value={selectedMethodology}
              onChange={(e) => {
                changeMethodology(e.target.value);
                showNotif(`Characterized using ${METHODOLOGIES[e.target.value]?.name || e.target.value}`, 'Methodology Updated');
              }}
              style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', height: 'auto', background: 'transparent', border: 'none', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}
            >
              {Object.entries(METHODOLOGIES).map(([k, m]) => (
                <option key={k} value={k}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top KPI Header Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Production (A1–A3)
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {Math.round(lca.a1_gwp + lca.a2_gwp + lca.a3_gwp).toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Cradle-to-gate impact</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Transport (A4)
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {Math.round(lca.a4_gwp).toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Logistics to site</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Use Stage (B1–B7)
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#4A7ABF', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {Math.round(lca.b_stage_gwp).toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>20 yr operating life</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Module D Credit
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {Math.round(lca.module_d_gwp).toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Avoided virgin burden</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0, background: 'var(--bg-card2)', border: '1px solid var(--accent-dim)' }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
            Net Life Cycle GWP
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {Math.round(lca.total_gwp).toLocaleString()}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Full lifecycle A1–C4 + D</div>
        </div>
      </div>

      {/* Characterized Matrix Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>Core Environmental Indicators</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({currentMethod.name})
            </span>
          </div>
          <span className="item-badge">ecoinvent 3.12 cutoff</span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table" aria-label="Environmental Indicators Matrix">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Indicator</th>
                <th>Impact Category Name</th>
                <th style={{ width: '110px' }}>Unit</th>
                <th style={{ width: '90px' }} className="num">A1–A3</th>
                <th style={{ width: '80px' }} className="num">A4</th>
                <th style={{ width: '90px' }} className="num">Stage B</th>
                <th style={{ width: '80px' }} className="num">Stage C</th>
                <th style={{ width: '90px' }} className="num">Module D</th>
                <th style={{ width: '100px' }} className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {lca.indicators.map((ind) => {
                const total = ind.a1a3 + ind.a4 + ind.b + ind.c + ind.d;
                const isGwp = ind.code.startsWith('GWP');

                return (
                  <tr key={ind.code} style={{ background: isGwp ? 'var(--accent-dim)' : undefined }}>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'var(--text-2xs)', color: 'var(--accent)' }}>
                        {ind.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: isGwp ? 600 : 400 }}>{ind.name}</span>
                    </td>
                    <td>
                      <span className="item-badge" style={{ fontSize: '0.65rem' }}>{ind.unit}</span>
                    </td>
                    <td className="num">{formatValue(ind.a1a3)}</td>
                    <td className="num">{formatValue(ind.a4)}</td>
                    <td className="num">{formatValue(ind.b)}</td>
                    <td className="num">{formatValue(ind.c)}</td>
                    <td className="num" style={{ color: ind.d < 0 ? 'var(--success)' : undefined }}>
                      {formatValue(ind.d)}
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatValue(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live ecoinvent LCIA Extractor & EPD Calculator Component */}
      <LciaExtractorSection />

      {/* Action Footer */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={() => setActivePhase('methodology')}
        >
          Change Methodology
        </button>

        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => {
            showNotif('Proceeding to EPD Declaration Certificate', 'Results Confirmed');
            setActivePhase('export');
          }}
        >
          <span>Proceed to Export EPD</span>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
