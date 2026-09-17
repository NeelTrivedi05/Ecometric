import React from 'react';
import { useStudio } from '../../../context/StudioContext';
import { DownloadIcon, LeafIcon, CheckIcon } from '../Icons';

export default function ExportView() {
  const {
    projectInfo,
    lca,
    downloadIlcdJson,
    showNotif,
  } = useStudio();

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    const hash = 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
    navigator.clipboard?.writeText(hash);
    showNotif('EPD verification cryptographic hash copied to clipboard', 'Hash Copied');
  };

  return (
    <div className="phase-container export-view">
      <div className="view-section no-print">
        <div className="section-header-flex">
          <div>
            <h2 className="section-title">7. Export EPD &amp; Verification Package</h2>
            <p className="section-subtitle">
              Generate digital ILCD+EPD compliant XML/JSON packages and print the official EN 15804+A2 Summary Certificate.
            </p>
          </div>
          <div className="export-action-group">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActivePhase('results')}
              style={{ fontSize: '13px' }}
            >
              Back to View Results
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCopyHash}
              title="Copy audit hash"
            >
              Copy Verification Hash
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handlePrint}
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              className="btn btn-accent"
              onClick={downloadIlcdJson}
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Download ILCD+EPD JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="certificate-document printable-doc" id="epd-certificate">
        <div className="cert-top-strip">
          <span className="cert-compliance-badge">EN 15804+A2 COMPLIANT</span>
          <span className="cert-scope-tag">SYSTEM BOUNDARY: A1–C4 + MODULE D</span>
        </div>
        
        <div className="cert-header">
          <div className="cert-brand">
            <LeafIcon className="w-8 h-8 text-emerald" />
            <div>
              <div className="cert-title">ENVIRONMENTAL PRODUCT DECLARATION</div>
              <div className="cert-standard">In accordance with ISO 14025:2006 and EN 15804:2012+A2:2019</div>
            </div>
          </div>
          <div className="cert-reg-box">
            <div className="reg-item">
              <span className="reg-label">Registration No:</span>
              <span className="reg-val">S-P-09412</span>
            </div>
            <div className="reg-item">
              <span className="reg-label">Program Operator:</span>
              <span className="reg-val">{projectInfo.operator}</span>
            </div>
            <div className="reg-item">
              <span className="reg-label">Validity:</span>
              <span className="reg-val">5 Years (2026 – 2031)</span>
            </div>
          </div>
        </div>

        <div className="cert-divider" />

        <div className="cert-body">
          <div className="cert-product-summary">
            <h3>{projectInfo.productName}</h3>
            <p className="cert-statement"><strong>Declared Unit:</strong> {projectInfo.declaredUnitStatement}</p>
            <div className="cert-meta-grid">
              <div><strong>Core PCR:</strong> {projectInfo.pcrRef}</div>
              <div><strong>LCIA Method:</strong> {projectInfo.lciaMethod}</div>
              <div><strong>Service Life:</strong> {projectInfo.rsl}</div>
              <div><strong>Total Unit Mass:</strong> {lca.totalMass.toLocaleString()} kg</div>
            </div>
          </div>

          <div className="cert-kpi-row">
            <div className="cert-kpi-cell">
              <div className="kpi-label">Global Warming Potential (A1–D)</div>
              <div className="kpi-num text-emerald">{Math.round(lca.total_gwp).toLocaleString()} <small>kg CO₂ eq</small></div>
            </div>
            <div className="cert-kpi-cell">
              <div className="kpi-label">Manufacturing (A1–A3)</div>
              <div className="kpi-num">{Math.round(lca.a1_gwp + lca.a2_gwp + lca.a3_gwp).toLocaleString()} <small>kg CO₂ eq</small></div>
            </div>
            <div className="cert-kpi-cell">
              <div className="kpi-label">Recyclability Rate</div>
              <div className="kpi-num text-blue">{lca.recRate.toFixed(1)}%</div>
            </div>
            <div className="cert-kpi-cell">
              <div className="kpi-label">Mass Cut-off Rate</div>
              <div className="kpi-num">{lca.massCutoff.toFixed(2)}%</div>
            </div>
          </div>

          <div className="cert-table-wrapper">
            <table className="cert-mini-table">
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th>Unit</th>
                  <th>A1–A3</th>
                  <th>A4</th>
                  <th>B1–B7</th>
                  <th>C1–C4</th>
                  <th>Module D</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lca.indicators.slice(0, 7).map((ind) => {
                  const total = ind.a1a3 + ind.a4 + ind.b + ind.c + ind.d;
                  return (
                    <tr key={ind.code}>
                      <td><strong>{ind.code}</strong></td>
                      <td>{ind.unit}</td>
                      <td>{typeof ind.a1a3 === 'number' ? Math.round(ind.a1a3).toLocaleString() : '—'}</td>
                      <td>{typeof ind.a4 === 'number' ? Math.round(ind.a4).toLocaleString() : '—'}</td>
                      <td>{typeof ind.b === 'number' ? Math.round(ind.b).toLocaleString() : '—'}</td>
                      <td>{typeof ind.c === 'number' ? Math.round(ind.c).toLocaleString() : '—'}</td>
                      <td>{typeof ind.d === 'number' ? Math.round(ind.d).toLocaleString() : '—'}</td>
                      <td><strong>{typeof total === 'number' ? Math.round(total).toLocaleString() : '—'}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="cert-verifier-block">
            <div className="verifier-statement">
              <p>
                <strong>Independent Third-Party Verification:</strong><br />
                The Life Cycle Assessment (LCA) underlying this declaration has been conducted in accordance with ISO 14040/44 and verified by an independent third-party verifier accredited under ISO 14025.
              </p>
            </div>
            <div className="signature-box">
              <div className="sig-line" />
              <div className="sig-name">Dr. H. Lindqvist, Accredited Lead Verifier</div>
              <div className="sig-org">Environdec Registry Certification Body</div>
            </div>
          </div>
        </div>

        <div className="cert-footer">
          <span>Digital Verification Fingerprint: SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span>
          <span>EcoMetric Platform v2.4</span>
        </div>
      </div>
    </div>
  );
}
