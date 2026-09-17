import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { SearchIcon, RefreshCwIcon, CheckIcon, ChevronRightIcon } from './Icons';

const METHODOLOGIES_41 = [
  "CML v4.8 2016","CML v4.8 2016 no LT","Crustal Scarcity Indicator 2020",
  "Cumulative Energy Demand (CED)","Cumulative Exergy Demand (CExD)",
  "EF v3.0","EF v3.0 no LT","EF v3.1","EF v3.1 no LT",
  "EPS 2020d","EPS 2020d no LT","Ecological Footprint",
  "Ecological Scarcity 2021","Ecological Scarcity 2021 no LT","Ecosystem Damage Potential",
  "IMPACT World+ v2.1, footprint version",
  "IPCC 2013","IPCC 2013 no LT","IPCC 2021",
  "IPCC 2021 (incl. biogenic CO2)","IPCC 2021 (incl. biogenic CO2) no LT","IPCC 2021 no LT",
  "Inventory results and indicators",
  "ReCiPe 2016 v1.03, endpoint (E)","ReCiPe 2016 v1.03, endpoint (E) no LT",
  "ReCiPe 2016 v1.03, endpoint (H)","ReCiPe 2016 v1.03, endpoint (H) no LT",
  "ReCiPe 2016 v1.03, endpoint (I)","ReCiPe 2016 v1.03, endpoint (I) no LT",
  "ReCiPe 2016 v1.03, midpoint (E)","ReCiPe 2016 v1.03, midpoint (E) no LT",
  "ReCiPe 2016 v1.03, midpoint (H)","ReCiPe 2016 v1.03, midpoint (H) no LT",
  "ReCiPe 2016 v1.03, midpoint (I)","ReCiPe 2016 v1.03, midpoint (I) no LT",
  "TRACI v2.1","TRACI v2.1 no LT",
  "USEtox v2.13, endpoint","USEtox v2.13, endpoint no LT",
  "USEtox v2.13, midpoint","USEtox v2.13, midpoint no LT"
];

export default function LciaExtractorSection() {
  const { showNotif } = useStudio();

  // Search & provider state
  const [productQuery, setProductQuery]       = useState('steel');
  const [searchResults, setSearchResults]     = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Methodology state
  const [methodologyList, setMethodologyList] = useState(METHODOLOGIES_41);
  const [selectedMethodology, setSelectedMethodology] = useState('TRACI v2.1');

  // Amount state
  const [amount, setAmount] = useState('1');

  // Loading / result state
  const [isSearching, setIsSearching]     = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lciaResult, setLciaResult]       = useState(null);
  const [errorMsg, setErrorMsg]           = useState(null);

  // ── Fetch 41 methodologies & auto-search "steel" on mount ──────────────────
  useEffect(() => {
    fetch('/api/documents/lcia-methodologies')
      .then(r => r.json())
      .then(d => { if (d.status === 'success' && d.methodologies?.length) setMethodologyList(d.methodologies); })
      .catch(() => {});
    handleSearch('steel');
  }, []);

  // ── Product search ──────────────────────────────────────────────────────────
  const handleSearch = async (override) => {
    const q = (override !== undefined ? override : productQuery).trim();
    if (!q) return;
    setIsSearching(true); setErrorMsg(null); setLciaResult(null);
    try {
      const r  = await fetch(`/api/documents/lcia-search?query=${encodeURIComponent(q)}`);
      const d  = await r.json();
      if (d.status === 'success') {
        setSearchResults(d.results || []);
        setSelectedProvider(d.results?.[0] || null);
      } else { setErrorMsg('Search failed — check backend connection.'); }
    } catch { setErrorMsg('Could not reach the backend search API.'); }
    finally  { setIsSearching(false); }
  };

  // ── Calculate EPD ───────────────────────────────────────────────────────────
  const handleCalculateEPD = async () => {
    if (!selectedProvider) {
      showNotif?.('Please select a provider from the list first.', 'Selection Required', 'alert');
      return;
    }
    setIsCalculating(true); setErrorMsg(null);
    try {
      const r = await fetch('/api/documents/lcia-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row_index: selectedProvider.row_index, methodology: selectedMethodology || null }),
      });
      const d = await r.json();
      if (d.status === 'success') {
        setLciaResult(d.result);
        showNotif?.(`EPD calculated for ${selectedProvider.reference_product_name}`, 'Calculation Complete');
      } else { setErrorMsg(d.detail || 'Calculation failed.'); }
    } catch { setErrorMsg('Error running LCIA calculation engine.'); }
    finally  { setIsCalculating(false); }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  // Reference amount from ecoinvent row (usually 1)
  const refAmount = parseFloat(lciaResult?.meta?.['Reference Product Amount'] || '1') || 1;
  const refUnit   = lciaResult?.meta?.['Reference Product Unit'] || 'unit';
  const userAmt   = parseFloat(amount) || 1;
  const scaleFactor = userAmt / refAmount;   // how much to multiply each value

  const isScaled = Math.abs(scaleFactor - 1) > 1e-9;

  const fmt = (raw) => {
    const v = raw * scaleFactor;
    if (typeof v !== 'number' || isNaN(v)) return '—';
    if (Math.abs(v) >= 1e6)  return (v / 1e6).toFixed(3) + 'M';
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    if (Math.abs(v) < 1e-4 && v !== 0) return v.toExponential(4);
    return v.toFixed(5);
  };

  const fmtRaw = (v) => {
    if (typeof v !== 'number' || isNaN(v)) return '—';
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    if (Math.abs(v) < 1e-4 && v !== 0) return v.toExponential(4);
    return v.toFixed(5);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      marginTop: 28,
      borderRadius: 14,
      border: '2px solid #E8D3C3',
      background: '#FEFCFA',
      boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* ── Card Header ── */}
      <div style={{ background: 'linear-gradient(135deg,#9C5832 0%,#C25A23 100%)', padding: '18px 24px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'#FFF', flexShrink:0 }}>
          LCIA
        </div>
        <div>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#FFF', margin:0, letterSpacing:'-0.01em' }}>
            Live ecoinvent LCIA Extractor &amp; EPD Calculator
          </h2>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.78)', margin:'2px 0 0 0' }}>
            Search ecoinvent v3.12 Cut-off · select provider, amount &amp; methodology · run <code style={{background:'rgba(255,255,255,0.15)',padding:'1px 5px',borderRadius:4}}>lcia_extractor.py</code>
          </p>
        </div>
      </div>

      <div style={{ padding: 24 }}>

        {/* ── STEP 1 — Product keyword search ── */}
        <div style={{ marginBottom: 22 }}>
          <StepLabel n="1" text="Enter Product / Material Keyword" />
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <div style={{ position:'relative', flex:1 }}>
              <input
                type="text"
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. steel, copper, insulation, motor, concrete…"
                style={{ width:'100%', height:42, paddingLeft:36, paddingRight:12, fontSize:14, borderRadius:8, border:'1.5px solid #D6C7BC', outline:'none', boxSizing:'border-box' }}
              />
              <SearchIcon size={17} style={{ position:'absolute', left:11, top:12, color:'#9F8070', pointerEvents:'none' }} />
            </div>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching}
              style={{
                height:42, padding:'0 18px', borderRadius:8, border:'none', cursor:isSearching?'not-allowed':'pointer',
                background:'#9C5832', color:'#FFF', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:7,
                opacity: isSearching ? 0.7 : 1, transition:'opacity 0.15s',
              }}
            >
              {isSearching ? <RefreshCwIcon size={15} className="spin-anim" /> : <SearchIcon size={15} />}
              <span>Search Providers</span>
            </button>
          </div>
        </div>

        {/* ── STEP 2 — Provider list ── */}
        {searchResults.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <StepLabel n="2" text={`Select Provider / Activity  (${searchResults.length} found)`} />
            <div style={{ maxHeight:200, overflowY:'auto', marginTop:8, border:'1.5px solid #E5D8CD', borderRadius:8, background:'#FAF7F4', padding:5 }}>
              {searchResults.map(item => {
                const sel = selectedProvider?.row_index === item.row_index;
                return (
                  <div
                    key={item.row_index}
                    onClick={() => setSelectedProvider(item)}
                    style={{
                      padding:'9px 13px', borderRadius:6, marginBottom:3, cursor:'pointer',
                      background: sel ? '#FFF0E6' : '#FFF',
                      border: sel ? '1.5px solid #C25A23' : '1px solid #EFE6DE',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      transition:'background 0.12s,border 0.12s',
                    }}
                  >
                    <div style={{ flex:1, paddingRight:8 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: sel ? '#C25A23' : '#2C221E' }}>
                        [{item.option_number}]&nbsp;{item.reference_product_name}
                      </div>
                      <div style={{ fontSize:11, color:'#6A584F', marginTop:2 }}>
                        Activity: <em>{item.activity_name}</em> &bull; Geo: <strong style={{ color:'#9C5832' }}>{item.geography}</strong>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                      <span style={{ fontSize:10, fontFamily:'monospace', padding:'2px 6px', borderRadius:4, background: sel?'#C25A23':'#E8DDD5', color: sel?'#FFF':'#5C4E46', fontWeight:600 }}>
                        #{item.row_index}
                      </span>
                      {sel && <CheckIcon size={15} style={{ color:'#C25A23' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3 — Amount input ── */}
        <div style={{ marginBottom: 22 }}>
          <StepLabel n="3" text="Enter Product Amount (Quantity to Calculate)" />
          <div style={{
            marginTop:8, padding:'14px 16px', background:'#FFF8F4',
            border:'1.5px solid #E8D3C3', borderRadius:8,
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, alignItems:'end',
          }}>
            {/* amount number input */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6A584F', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                Quantity
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                style={{ width:'100%', height:42, padding:'0 14px', fontSize:15, fontWeight:700, borderRadius:8, border:'1.5px solid #D6C7BC', boxSizing:'border-box', color:'#2C221E', outline:'none' }}
              />
            </div>

            {/* reference unit display */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6A584F', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                Reference Unit (from ecoinvent)
              </label>
              <div style={{ height:42, display:'flex', alignItems:'center', padding:'0 14px', borderRadius:8, background:'#F3EDE7', border:'1.5px solid #D6C7BC', fontSize:14, fontWeight:600, color:'#9C5832' }}>
                {lciaResult
                  ? `${refAmount} ${refUnit}`
                  : selectedProvider
                    ? 'Run calculation to see unit'
                    : '—  (select a provider)'}
              </div>
            </div>
          </div>

          {lciaResult && (
            <div style={{ marginTop:8, fontSize:12, color:'#6A584F', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#C25A23', display:'inline-block', flexShrink:0 }} />
              Values below are scaled by&nbsp;
              <strong style={{ color:'#C25A23' }}>{userAmt.toLocaleString()} {refUnit}</strong>
              &nbsp;÷&nbsp;
              <strong>{refAmount} {refUnit}</strong>
              &nbsp;=&nbsp;
              <strong style={{ color:'#2C221E' }}>×{scaleFactor.toPrecision(4)}</strong>
              {isScaled && <span style={{ marginLeft:4, padding:'1px 7px', background:'#FFF0E6', color:'#C25A23', borderRadius:10, fontSize:10, fontWeight:700 }}>SCALED</span>}
            </div>
          )}
        </div>

        {/* ── STEP 4 — Methodology + Calculate ── */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'end',
          marginBottom:20, background:'#FAF5F0', padding:16, borderRadius:8, border:'1.5px solid #EEDCD0',
        }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6A584F', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>
              4. Select LCIA Methodology ({methodologyList.length} available)
            </label>
            <select
              value={selectedMethodology}
              onChange={e => setSelectedMethodology(e.target.value)}
              style={{ width:'100%', height:42, padding:'0 12px', borderRadius:8, border:'1.5px solid #D6C7BC', fontSize:13, fontWeight:600, color:'#2C221E', background:'#FFF', cursor:'pointer', outline:'none' }}
            >
              <option value="">— ALL Methodologies —</option>
              {methodologyList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCalculateEPD}
            disabled={isCalculating || !selectedProvider}
            style={{
              height:42, padding:'0 22px', borderRadius:8, border:'none',
              background: (!selectedProvider || isCalculating) ? '#D1B9AE' : '#C25A23',
              color:'#FFF', fontWeight:800, fontSize:14, cursor: (!selectedProvider||isCalculating) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
              boxShadow: selectedProvider && !isCalculating ? '0 3px 12px rgba(194,90,35,0.3)' : 'none',
              transition:'all 0.15s',
            }}
          >
            {isCalculating
              ? <><RefreshCwIcon className="spin-anim" size={17} /><span>Calculating…</span></>
              : <><span>Calculate EPD</span><ChevronRightIcon size={17} /></>
            }
          </button>
        </div>

        {/* ── Error banner ── */}
        {errorMsg && (
          <div style={{ padding:'10px 14px', background:'#FDF2F2', color:'#9B1C1C', borderRadius:7, fontSize:12, marginBottom:16, border:'1px solid #F8B4B4' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* ── RESULTS ── */}
        {lciaResult && (
          <div style={{ marginTop:4, borderRadius:10, border:'1.5px solid #C25A23', overflow:'hidden', boxShadow:'0 4px 18px rgba(0,0,0,0.07)' }}>

            {/* Result header */}
            <div style={{ background:'#FFF8F4', padding:'14px 20px', borderBottom:'1px solid #EEDCD0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#C25A23', marginBottom:3 }}>
                  EPD Result · {lciaResult.method_filter || 'All Methodologies'}
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#2C221E', marginBottom:2 }}>
                  {lciaResult.meta?.['Reference Product Name'] || selectedProvider?.reference_product_name}
                </div>
                <div style={{ fontSize:12, color:'#6A584F' }}>
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
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#FAF5F0', position:'sticky', top:0, zIndex:1 }}>
                      <Th>Methodology</Th>
                      <Th>Impact Category</Th>
                      <Th>Indicator</Th>
                      <Th center>Unit</Th>
                      <Th right>Per {refAmount} {refUnit}<br/><span style={{fontSize:10,fontWeight:400,color:'#8F7A6F'}}>(ecoinvent reference)</span></Th>
                      {isScaled && (
                        <Th right>
                          <span style={{ color:'#C25A23' }}>For {userAmt} {refUnit}</span>
                          <br/><span style={{ fontSize:10, fontWeight:400, color:'#C25A23' }}>× {scaleFactor.toPrecision(3)}</span>
                        </Th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lciaResult.indicators.map((ind, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #F0E8E0', background: i%2===0?'#FFFFFF':'#FDFAF8' }}>
                        <td style={{ padding:'8px 12px', fontWeight:600, color:'#9C5832', fontSize:11 }}>{ind.method}</td>
                        <td style={{ padding:'8px 12px', color:'#5C4E46' }}>{ind.category}</td>
                        <td style={{ padding:'8px 12px', fontWeight:500, color:'#2C221E' }}>{ind.indicator}</td>
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <span style={{ fontSize:10, fontFamily:'monospace', padding:'2px 6px', background:'#F3ECE7', borderRadius:4, color:'#5C4E46' }}>
                            {ind.unit}
                          </span>
                        </td>
                        <td style={{ padding:'8px 14px', textAlign:'right', fontFamily:'monospace', fontWeight:600, color:'#6A584F' }}>
                          {fmtRaw(ind.value)}
                        </td>
                        {isScaled && (
                          <td style={{ padding:'8px 14px', textAlign:'right', fontFamily:'monospace', fontWeight:800, fontSize:13, color:'#C25A23' }}>
                            {fmt(ind.value)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding:20, textAlign:'center', color:'#8F7A6F', fontSize:13 }}>
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
      <span style={{ width:22, height:22, borderRadius:'50%', background:'#9C5832', color:'#FFF', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {n}
      </span>
      <span style={{ fontSize:13, fontWeight:700, color:'#2C221E' }}>{text}</span>
    </div>
  );
}

function Chip({ label, accent }) {
  return (
    <span style={{
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
      background: accent ? '#FFF0E6' : '#F3EDE7',
      color: accent ? '#C25A23' : '#6A584F',
      border: `1px solid ${accent ? '#E8C4AD' : '#DDDDD5'}`,
    }}>
      {label}
    </span>
  );
}

function Th({ children, center, right }) {
  return (
    <th style={{
      padding:'10px 12px', fontWeight:700, fontSize:11, color:'#4A3B32',
      textAlign: right ? 'right' : center ? 'center' : 'left',
      borderBottom:'2px solid #EEDCD0', whiteSpace:'nowrap',
    }}>
      {children}
    </th>
  );
}
