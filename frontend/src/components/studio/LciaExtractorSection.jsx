import React, { useState, useEffect } from 'react';
import { SearchIcon, RefreshCwIcon, CheckIcon, ChevronRightIcon } from './Icons';

export default function LciaExtractorSection() {
  const [productQuery, setProductQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [amount, setAmount] = useState('1000');
  const [selectedMethodology, setSelectedMethodology] = useState('');
  const [methodologyList, setMethodologyList] = useState([]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [lciaResult, setLciaResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill default search on first mount
  useEffect(() => {
    handleSearch('steel');
  }, []);

  const handleSearch = async (overrideQuery) => {
    const q = (overrideQuery !== undefined ? overrideQuery : productQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/processes/search-ecoinvent?q=${encodeURIComponent(q)}&limit=15`);
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      if (data.results?.length > 0) {
        setSelectedProvider(data.results[0]);
      }
    } catch (err) {
      console.warn('Ecoinvent search failed:', err);
      setErrorMsg('Could not reach backend search endpoint. Ensure backend is running.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCalculateEPD = async () => {
    if (!selectedProvider) return;
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg('Please enter a valid numeric product amount greater than 0.');
      return;
    }

    setIsCalculating(true);
    setErrorMsg('');
    setLciaResult(null);

    try {
      const payload = {
        row_index: selectedProvider.row_index,
        amount: numAmt,
        methodology: selectedMethodology || null,
      };

      const res = await fetch('http://127.0.0.1:8000/api/processes/calculate-lcia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setLciaResult(data);

      if (data.available_methodologies?.length > 0) {
        setMethodologyList(data.available_methodologies);
      }
    } catch (err) {
      console.error('LCIA calculation error:', err);
      setErrorMsg(err.message || 'Calculation failed. Verify backend logs.');
    } finally {
      setIsCalculating(false);
    }
  };

  const fmt = (val) => {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.001 && num !== 0)) {
      return num.toExponential(3);
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const fmtRaw = (val) => {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.001 && num !== 0)) {
      return num.toExponential(3);
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 5 });
  };

  const refUnit = lciaResult?.reference_unit || selectedProvider?.unit || 'unit';
  const refAmount = lciaResult?.reference_amount ?? 1;
  const userAmt = parseFloat(amount) || 1;
  const scaleFactor = lciaResult?.scale_factor ?? (userAmt / refAmount);
  const isScaled = Math.abs(scaleFactor - 1.0) > 1e-6;

  return (
    <div style={{
      marginTop: 28,
      borderRadius: 'var(--radius-lg, 18px)',
      border: '1px solid var(--border, #e0e0e0)',
      background: '#FFFFFF',
      boxShadow: 'none',
      overflow: 'hidden',
    }}>
      {/* ── Card Header (Apple Near-Black Tile 1) ── */}
      <div style={{ background: 'var(--apple-surface-tile-1, #272729)', padding: '20px 24px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:13, color:'#FFF', flexShrink:0, fontFamily:'var(--mono)' }}>
          LCI
        </div>
        <div>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#FFF', margin:0, letterSpacing:'-0.2px', fontFamily:'var(--font-display)' }}>
            Live ecoinvent LCIA Extractor &amp; EPD Calculator
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.72)', margin:'3px 0 0 0' }}>
            Search ecoinvent v3.12 Cut-off · select provider, amount &amp; methodology · run <code style={{background:'rgba(255,255,255,0.12)',padding:'1px 5px',borderRadius:4,fontFamily:'var(--mono)'}}>lcia_extractor.py</code>
          </p>
        </div>
      </div>

      <div style={{ padding: 24 }}>

        {/* ── STEP 1 — Product keyword search ── */}
        <div style={{ marginBottom: 24 }}>
          <StepLabel n="1" text="Enter Product / Material Keyword" />
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            <div style={{ position:'relative', flex:1 }}>
              <input
                type="text"
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. steel, copper, insulation, motor, concrete…"
                style={{ width:'100%', height:42, paddingLeft:38, paddingRight:14, fontSize:14, borderRadius:'var(--radius-pill, 9999px)', border:'1px solid var(--border, #e0e0e0)', outline:'none', boxSizing:'border-box', fontFamily:'var(--font)' }}
              />
              <SearchIcon size={16} style={{ position:'absolute', left:14, top:13, color:'var(--text-muted, #7a7a7a)', pointerEvents:'none' }} />
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="btn btn-primary"
              style={{
                height:42, padding:'0 22px', border:'none', cursor:isSearching?'not-allowed':'pointer',
                opacity: isSearching ? 0.7 : 1, transition:'opacity 0.15s',
              }}
            >
              {isSearching ? <RefreshCwIcon size={14} className="spin-anim" /> : <SearchIcon size={14} />}
              <span>Search Providers</span>
            </button>
          </div>
        </div>

        {/* ── STEP 2 — Provider list ── */}
        {searchResults.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <StepLabel n="2" text={`Select Provider / Activity  (${searchResults.length} found)`} />
            <div style={{ maxHeight:210, overflowY:'auto', marginTop:10, border:'1px solid var(--border, #e0e0e0)', borderRadius:'var(--radius-sm, 8px)', background:'var(--bg-base, #f5f5f7)', padding:6 }}>
              {searchResults.map(item => {
                const sel = selectedProvider?.row_index === item.row_index;
                return (
                  <div
                    key={item.row_index}
                    onClick={() => setSelectedProvider(item)}
                    style={{
                      padding:'10px 14px', borderRadius:'var(--radius-sm, 8px)', marginBottom:4, cursor:'pointer',
                      background: sel ? '#FFFFFF' : 'transparent',
                      border: sel ? '1.5px solid var(--accent, #0066cc)' : '1px solid transparent',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      transition:'all 0.12s ease',
                    }}
                  >
                    <div style={{ flex:1, paddingRight:8 }}>
                      <div style={{ fontSize:14, fontWeight: sel ? 600 : 400, color: sel ? 'var(--accent, #0066cc)' : 'var(--text-primary, #1d1d1f)' }}>
                        [{item.option_number}]&nbsp;{item.reference_product_name}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted, #7a7a7a)', marginTop:2 }}>
                        Activity: {item.activity_name} &bull; Geo: <strong style={{ color:'var(--text-primary, #1d1d1f)' }}>{item.geography}</strong>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      <span style={{ fontSize:11, fontFamily:'var(--mono)', padding:'2px 8px', borderRadius:'var(--radius-pill, 9999px)', background: sel?'var(--accent, #0066cc)':'#e0e0e0', color: sel?'#FFF':'#333', fontWeight:600 }}>
                        #{item.row_index}
                      </span>
                      {sel && <CheckIcon size={15} style={{ color:'var(--accent, #0066cc)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3 — Amount input ── */}
        <div style={{ marginBottom: 24 }}>
          <StepLabel n="3" text="Enter Product Amount (Quantity to Calculate)" />
          <div style={{
            marginTop:10, padding:'16px 20px', background:'var(--bg-base, #f5f5f7)',
            border:'1px solid var(--border, #e0e0e0)', borderRadius:'var(--radius-lg, 18px)',
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'end',
          }}>
            {/* amount number input */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted, #7a7a7a)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                style={{ width:'100%', height:42, padding:'0 14px', fontSize:15, fontWeight:600, borderRadius:'var(--radius-sm, 8px)', border:'1px solid var(--border, #e0e0e0)', boxSizing:'border-box', color:'var(--text-primary, #1d1d1f)', outline:'none', background:'#FFFFFF', fontFamily:'var(--font)' }}
              />
            </div>

            {/* reference unit display */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted, #7a7a7a)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                Reference Unit (from ecoinvent)
              </label>
              <div style={{ height:42, display:'flex', alignItems:'center', padding:'0 14px', borderRadius:'var(--radius-sm, 8px)', background:'#FFFFFF', border:'1px solid var(--border, #e0e0e0)', fontSize:14, fontWeight:600, color:'var(--accent, #0066cc)', fontFamily:'var(--mono)' }}>
                {lciaResult
                  ? `${refAmount} ${refUnit}`
                  : selectedProvider
                    ? 'Run calculation to see unit'
                    : '—  (select a provider)'}
              </div>
            </div>
          </div>

          {lciaResult && (
            <div style={{ marginTop:8, fontSize:13, color:'var(--text-muted, #7a7a7a)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent, #0066cc)', display:'inline-block', flexShrink:0 }} />
              Values below are scaled by&nbsp;
              <strong style={{ color:'var(--accent, #0066cc)' }}>{userAmt.toLocaleString()} {refUnit}</strong>
              &nbsp;÷&nbsp;
              <strong>{refAmount} {refUnit}</strong>
              &nbsp;=&nbsp;
              <strong style={{ color:'var(--text-primary, #1d1d1f)' }}>×{scaleFactor.toPrecision(4)}</strong>
              {isScaled && <span style={{ marginLeft:4, padding:'1px 8px', background:'var(--accent-dim)', color:'var(--accent, #0066cc)', borderRadius:'var(--radius-pill)', fontSize:11, fontWeight:600 }}>SCALED</span>}
            </div>
          )}
        </div>

        {/* ── STEP 4 — Methodology + Calculate ── */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'end',
          marginBottom:20, background:'var(--bg-base, #f5f5f7)', padding:18, borderRadius:'var(--radius-lg, 18px)', border:'1px solid var(--border, #e0e0e0)',
        }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted, #7a7a7a)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              4. Select LCIA Methodology ({methodologyList.length} available)
            </label>
            <select
              value={selectedMethodology}
              onChange={e => setSelectedMethodology(e.target.value)}
              style={{ width:'100%', height:42, padding:'0 14px', borderRadius:'var(--radius-sm, 8px)', border:'1px solid var(--border, #e0e0e0)', fontSize:13, fontWeight:400, color:'var(--text-primary, #1d1d1f)', background:'#FFF', cursor:'pointer', outline:'none', fontFamily:'var(--font)' }}
            >
              <option value="">— ALL Methodologies —</option>
              {methodologyList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCalculateEPD}
            disabled={isCalculating || !selectedProvider}
            className="btn btn-primary"
            style={{
              height:42, padding:'0 24px',
              cursor: (!selectedProvider||isCalculating) ? 'not-allowed' : 'pointer',
              opacity: (!selectedProvider || isCalculating) ? 0.6 : 1,
              fontSize:14,
            }}
          >
            {isCalculating
              ? <><RefreshCwIcon className="spin-anim" size={15} /><span>Calculating…</span></>
              : <><span>Calculate EPD</span><ChevronRightIcon size={15} /></>
            }
          </button>
        </div>

        {/* ── Error banner ── */}
        {errorMsg && (
          <div style={{ padding:'12px 16px', background:'var(--error-soft)', color:'var(--error)', borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:16, border:'1px solid rgba(255, 59, 48, 0.25)' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* ── RESULTS ── */}
        {lciaResult && (
          <div style={{ marginTop:4, borderRadius:'var(--radius-lg, 18px)', border:'1px solid var(--border, #e0e0e0)', overflow:'hidden' }}>

            {/* Result header */}
            <div style={{ background:'var(--bg-card2, #fafafc)', padding:'16px 22px', borderBottom:'1px solid var(--border, #e0e0e0)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', color:'var(--accent, #0066cc)', marginBottom:4 }}>
                  EPD Result · {lciaResult.method_filter || 'All Methodologies'}
                </div>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary, #1d1d1f)', marginBottom:2 }}>
                  {lciaResult.meta?.['Reference Product Name'] || selectedProvider?.reference_product_name}
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted, #7a7a7a)' }}>
                  <strong>{lciaResult.meta?.['Activity Name']}</strong> · {lciaResult.meta?.['Geography']}
                </div>
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <Chip label={`Reference: ${refAmount} ${refUnit}`} accent={false} />
                <Chip label={`Your amount: ${userAmt} ${refUnit}`} accent />
                <Chip label={`${lciaResult.indicator_count} indicators`} accent={false} />
              </div>
            </div>

            {/* Table */}
            {lciaResult.indicators?.length > 0 ? (
              <div style={{ overflowX:'auto', maxHeight:420, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'var(--bg-card2, #fafafc)', position:'sticky', top:0, zIndex:1 }}>
                      <Th>Methodology</Th>
                      <Th>Impact Category</Th>
                      <Th>Indicator</Th>
                      <Th center>Unit</Th>
                      <Th right>Per {refAmount} {refUnit}<br/><span style={{fontSize:10,fontWeight:400,color:'var(--text-muted)'}}>(ecoinvent reference)</span></Th>
                      {isScaled && (
                        <Th right>
                          <span style={{ color:'var(--accent, #0066cc)' }}>For {userAmt} {refUnit}</span>
                          <br/><span style={{ fontSize:10, fontWeight:400, color:'var(--accent, #0066cc)' }}>× {scaleFactor.toPrecision(3)}</span>
                        </Th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lciaResult.indicators.map((ind, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border, #e0e0e0)', background: '#FFFFFF' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600, color:'var(--accent, #0066cc)', fontSize:12 }}>{ind.method}</td>
                        <td style={{ padding:'10px 14px', color:'var(--text-secondary, #333333)' }}>{ind.category}</td>
                        <td style={{ padding:'10px 14px', fontWeight:400, color:'var(--text-primary, #1d1d1f)' }}>{ind.indicator}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <span style={{ fontSize:11, fontFamily:'var(--mono)', padding:'2px 8px', background:'var(--bg-base, #f5f5f7)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)' }}>
                            {ind.unit}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:'var(--mono)', fontWeight:400, color:'var(--text-secondary)' }}>
                          {fmtRaw(ind.value)}
                        </td>
                        {isScaled && (
                          <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:'var(--mono)', fontWeight:600, fontSize:13, color:'var(--accent, #0066cc)' }}>
                            {fmt(ind.value)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                No non-zero indicators found for this methodology. Try "— ALL Methodologies —".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function StepLabel({ n, text }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--text-primary, #1d1d1f)', color:'#FFF', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {n}
      </span>
      <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary, #1d1d1f)', letterSpacing:'-0.1px' }}>{text}</span>
    </div>
  );
}

function Chip({ label, accent }) {
  return (
    <span style={{
      padding:'4px 12px', borderRadius:'var(--radius-pill, 9999px)', fontSize:12, fontWeight: accent ? 600 : 400,
      background: accent ? 'var(--accent-dim)' : 'var(--bg-base, #f5f5f7)',
      color: accent ? 'var(--accent, #0066cc)' : 'var(--text-secondary, #333)',
      border: `1px solid ${accent ? 'rgba(0, 102, 204, 0.25)' : 'var(--border, #e0e0e0)'}`,
    }}>
      {label}
    </span>
  );
}

function Th({ children, center, right }) {
  return (
    <th style={{
      padding:'12px 14px', fontWeight:600, fontSize:11, color:'var(--text-primary, #1d1d1f)',
      textAlign: right ? 'right' : center ? 'center' : 'left',
      borderBottom:'1px solid var(--border, #e0e0e0)', whiteSpace:'nowrap',
    }}>
      {children}
    </th>
  );
}
