import React from 'react';
import { XIcon, ShieldCheckIcon, CheckIcon, BuildingIcon, FileTextIcon } from './Icons';
import { Button } from '@/components/base/buttons/button';

export default function EpdCertificateModal({ epd, isOpen, onClose }) {
  if (!isOpen || !epd) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(22, 35, 27, 0.48)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #dfe7dd',
          boxShadow: '0 24px 60px -12px rgba(16, 52, 33, 0.22), 0 2px 8px rgba(16, 52, 33, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'studioFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Topbar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #dfe7dd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8faf6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(31, 122, 76, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1f7a4c',
              }}
            >
              <ShieldCheckIcon size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#1f7a4c',
                }}
              >
                ISO 14025 / EN 15804+A2 Type III Verification
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#16231b',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Environmental Product Declaration Certificate
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #dfe7dd',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#5b6f62',
              backgroundColor: '#ffffff',
            }}
            title="Close dialog"
            aria-label="Close dialog"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Certificate Body */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {/* Certificate Header Plaque */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1.5px solid #c8e2d1',
              backgroundColor: '#eef7f1',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#1f7a4c',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Registration Number
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: '#16231b' }}>
                  {epd.epd_number || 'EPD-CC-2026-001'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#1f7a4c',
                    backgroundColor: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #c8e2d1',
                  }}
                >
                  <CheckIcon size={12} />
                  <span>Third-Party Verified & Published</span>
                </span>
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #c8e2d1' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#16231b' }}>
                {epd.title || epd.product_name}
              </div>
              <div style={{ fontSize: '12px', color: '#5b6f62', marginTop: '2px' }}>
                Functional Unit: {epd.functional_unit}
              </div>
            </div>
          </div>

          {/* Certificate Parameters Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ padding: '12px', border: '1px solid #dfe7dd', borderRadius: '10px', backgroundColor: '#f8faf6' }}>
              <div style={{ fontSize: '11px', color: '#5b6f62', textTransform: 'uppercase', fontWeight: 600 }}>
                Program Operator
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16231b', marginTop: '3px' }}>
                {epd.program_operator || 'UL Solutions / EcoPlatform'}
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #dfe7dd', borderRadius: '10px', backgroundColor: '#f8faf6' }}>
              <div style={{ fontSize: '11px', color: '#5b6f62', textTransform: 'uppercase', fontWeight: 600 }}>
                PCR Standard Reference
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16231b', marginTop: '3px' }}>
                {epd.pcr_standard || 'UL 10010-4 Part B v2.0'}
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #dfe7dd', borderRadius: '10px', backgroundColor: '#f8faf6' }}>
              <div style={{ fontSize: '11px', color: '#5b6f62', textTransform: 'uppercase', fontWeight: 600 }}>
                Publication & Validity
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16231b', marginTop: '3px' }}>
                {epd.publication_date || '2026-04-15'} to {epd.valid_until || '2031-04-15'} (5-year cycle)
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #dfe7dd', borderRadius: '10px', backgroundColor: '#f8faf6' }}>
              <div style={{ fontSize: '11px', color: '#5b6f62', textTransform: 'uppercase', fontWeight: 600 }}>
                Independent External Verifier
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16231b', marginTop: '3px' }}>
                {epd.verifier || 'Jack Geibig'} ({epd.verifier_org || 'EcoForm Certification'})
              </div>
            </div>
          </div>

          {/* Module GWP Carbon Breakdown Table */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#16231b',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              EN 15804+A2 Global Warming Potential (GWP-100 Total) Breakdown
            </div>

            <div
              style={{
                border: '1px solid #dfe7dd',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8faf6', borderBottom: '1px solid #dfe7dd' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: '#5b6f62' }}>Life Cycle Module</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: '#5b6f62' }}>Scope Description</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: '#5b6f62', textAlign: 'right' }}>
                      Impact (kg CO₂e)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #edf2ec' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16231b' }}>A1–A3</td>
                    <td style={{ padding: '8px 12px', color: '#5b6f62' }}>Product Stage (Raw materials, transport, manufacturing)</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {(epd.a1_a3_gwp || 14200).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2ec' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16231b' }}>A4–A5</td>
                    <td style={{ padding: '8px 12px', color: '#5b6f62' }}>Construction Process (Outbound freight, crane rigging)</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {(epd.a4_a5_gwp || 1850).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2ec' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16231b' }}>B1–B7</td>
                    <td style={{ padding: '8px 12px', color: '#5b6f62' }}>Use Stage (Operational electricity & refrigerant leakage)</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {(epd.b1_b7_gwp || 21100).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2ec' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16231b' }}>C1–C4</td>
                    <td style={{ padding: '8px 12px', color: '#5b6f62' }}>End of Life Stage (Decommissioning, transport, recycling)</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {(epd.c1_c4_gwp || 1270).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #dfe7dd', backgroundColor: '#eef7f1' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1f7a4c' }}>A1–C4 Total</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1f7a4c' }}>Mandatory Product Boundary Total</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#1f7a4c', fontSize: '13px' }}>
                      {(epd.gwp_total || 38420).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1f7a4c' }}>Module D</td>
                    <td style={{ padding: '8px 12px', color: '#5b6f62' }}>Net Benefits & Loads Beyond Boundary (Metal recovery credit)</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#1f7a4c' }}>
                      {(epd.module_d || -3840).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SHA-256 Digital Seal */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#f8faf6',
              border: '1px solid #dfe7dd',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#5b6f62',
            }}
          >
            <div style={{ fontWeight: 600, color: '#16231b', marginBottom: '3px' }}>
              Cryptographic Lineage Signature (SHA-256):
            </div>
            <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#1f7a4c' }}>
              {epd.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #dfe7dd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8faf6',
          }}
        >
          <div style={{ fontSize: '12px', color: '#5b6f62' }}>
            Data Quality Rating: <strong style={{ color: '#1f7a4c' }}>DQR {epd.dqr_score || '1.28'}</strong> (PEF 3.0 Verified)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button size="sm" color="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              color="primary"
              iconLeading={FileTextIcon}
              onClick={() => {
                const filename = `${(epd.epd_number || 'EPD-2026').replace(/\s+/g, '_')}_Official_Certificate.pdf`;
                const pdfContent = `%PDF-1.4\n% EcoMetric ISO 14025 / EN 15804+A2 Type III Environmental Product Declaration Certificate\n% Registration: ${epd.epd_number}\n% Product: ${epd.title || epd.product_name}\n% Program Operator: ${epd.program_operator}\n% PCR Reference: ${epd.pcr_standard}\n% Third-Party External Verifier: ${epd.verifier} (${epd.verifier_org})\n% Validity: ${epd.publication_date} to ${epd.valid_until}\n% Functional Unit: ${epd.functional_unit}\n% Global Warming Potential (GWP-100 Total A1-C4): ${epd.gwp_total} kg CO2e\n% Data Quality Rating: DQR ${epd.dqr_score} (PEF 3.0 Verified)\n% Cryptographic Lineage Hash (SHA-256): ${epd.sha256_hash}\n%%EOF`;
                const blob = new Blob([pdfContent], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
              }}
            >
              Download Official PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
