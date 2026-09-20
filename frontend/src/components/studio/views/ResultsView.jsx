import React, { useState } from 'react';
import { useStudio, ALL_METHODOLOGIES, getMethodology } from '../../../context/StudioContext';
import { ResultsIcon, ChevronRightIcon, CheckIcon, RefreshCwIcon } from '../Icons';

export default function ResultsView() {
  const {
    lca,
    selectedMethodology,
    changeMethodology,
    setActivePhase,
    showNotif,
    isLoading,
    runCalculation,
  } = useStudio();

  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  const formatValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '—';
    if (val === 0) return '0.00';
    if (Math.abs(val) >= 1000) return Math.round(val).toLocaleString();
    if (Math.abs(val) < 0.001) return val.toExponential(2);
    return val.toFixed(4);
  };

  const currentMethod = getMethodology(selectedMethodology);

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
              Environmental impact indicators across life cycle stages computed directly by the EPD calculation engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => runCalculation()}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCwIcon size={14} className={isLoading ? 'spin' : ''} />
              Recalculate EPD
            </button>

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
                  showNotif(`Characterized using ${getMethodology(e.target.value)?.name || e.target.value}`, 'Methodology Updated');
                }}
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', height: 'auto', background: 'transparent', border: 'none', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}
              >
                {ALL_METHODOLOGIES.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.standard})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Top KPI Header Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            A1 Raw Materials
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {formatValue(lca.a1_gwp)}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>BOM extraction</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            A2 Inbound Logistics
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#E5A93C', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {formatValue(lca.a2_gwp)}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Inbound freight legs</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            A3 Manufacturing
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {formatValue(lca.a3_gwp)}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Plant energy & utility</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Cradle-to-Gate (A1–A3)
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {formatValue(lca.a1_gwp + lca.a2_gwp + lca.a3_gwp)}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Total A1 + A2 + A3</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0, background: 'var(--bg-card2)', border: '1px solid var(--accent-dim)' }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
            Net Life Cycle GWP
          </div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--mono)', margin: '4px 0' }}>
            {formatValue(lca.total_gwp)}{' '}
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>Full lifecycle A1–C4 + D</div>
        </div>
      </div>

      {/* Characterized Matrix Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>EPD Environmental Results Matrix</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({currentMethod.name})
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lca.isCalculated && (
              <span className="item-badge" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                ✓ Synced with epd_results.csv
              </span>
            )}
            <button
              type="button"
              className="btn btn-2xs btn-outline"
              onClick={() => setShowFullBreakdown(!showFullBreakdown)}
            >
              {showFullBreakdown ? 'Summary View' : 'Full Stage Breakdown (A1–D)'}
            </button>
          </div>
        </div>

        <div className="data-table-wrapper" style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="data-table" aria-label="Environmental Indicators Matrix" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '90px', sticky: 'left', background: 'var(--bg-card)', zIndex: 2 }}>Indicator</th>
                <th style={{ minWidth: '220px' }}>Impact Category Name</th>
                <th style={{ minWidth: '90px' }}>Unit</th>
                <th className="num" style={{ color: 'var(--accent)', fontWeight: 700 }}>A1</th>
                <th className="num" style={{ color: '#E5A93C', fontWeight: 700 }}>A2</th>
                <th className="num" style={{ color: 'var(--success)', fontWeight: 700 }}>A3</th>
                <th className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.03)' }}>A1–A3</th>
                <th className="num">A4</th>
                <th className="num">A5</th>
                <th className="num">B1</th>
                <th className="num">B2</th>
                <th className="num">B3</th>
                <th className="num">B4</th>
                <th className="num">B5</th>
                <th className="num">B6</th>
                <th className="num">B7</th>
                <th className="num">C1</th>
                <th className="num">C2</th>
                <th className="num">C3</th>
                <th className="num">C4</th>
                <th className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.03)' }}>C1–C4</th>
                <th className="num" style={{ color: 'var(--success)', fontWeight: 700 }}>Module D</th>
                <th className="num" style={{ fontWeight: 800, color: 'var(--accent)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lca.indicators.map((ind) => {
                const isGwp = ind.code === 'GWP100' || ind.name.toLowerCase().includes('global warming');

                return (
                  <tr key={ind.rawCategory || ind.code} style={{ background: isGwp ? 'var(--accent-dim)' : undefined }}>
                    <td style={{ sticky: 'left', background: 'var(--bg-card)', zIndex: 1 }}>
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
                    <td className="num">{formatValue(ind.a1)}</td>
                    <td className="num">{formatValue(ind.a2)}</td>
                    <td className="num">{formatValue(ind.a3)}</td>
                    <td className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>{formatValue(ind.a1a3)}</td>
                    <td className="num">{formatValue(ind.a4)}</td>
                    <td className="num">{formatValue(ind.a5)}</td>
                    <td className="num">{formatValue(ind.b1)}</td>
                    <td className="num">{formatValue(ind.b2)}</td>
                    <td className="num">{formatValue(ind.b3)}</td>
                    <td className="num">{formatValue(ind.b4)}</td>
                    <td className="num">{formatValue(ind.b5)}</td>
                    <td className="num">{formatValue(ind.b6)}</td>
                    <td className="num">{formatValue(ind.b7)}</td>
                    <td className="num">{formatValue(ind.c1)}</td>
                    <td className="num">{formatValue(ind.c2)}</td>
                    <td className="num">{formatValue(ind.c3)}</td>
                    <td className="num">{formatValue(ind.c4)}</td>
                    <td className="num" style={{ fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>{formatValue(ind.c)}</td>
                    <td className="num" style={{ color: ind.d < 0 ? 'var(--success)' : undefined }}>
                      {formatValue(ind.d)}
                    </td>
                    <td className="num" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatValue(ind.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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

