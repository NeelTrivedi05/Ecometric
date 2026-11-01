import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { DownloadIcon } from '../Icons';

export default function ExportView() {
  const {
    showNotif,
    setActivePhase,
    previewEpdReport,
    downloadEpdReport,
    downloadIlcdJson,
    downloadOpenEpdJson,
    openepdDocument,
    generateOpenEpdDocument,
  } = useStudio();

  const [exportMode, setExportMode] = useState('sealed'); // 'sealed' | 'signed_open'
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingIlcd, setIsExportingIlcd] = useState(false);
  const [isExportingOpenEpd, setIsExportingOpenEpd] = useState(false);
  const [hasCriticalIssues, setHasCriticalIssues] = useState(false);
  const [lastExportSeal, setLastExportSeal] = useState(null); // { certificateId, verifyUrl, filename }
  const [copied, setCopied] = useState(false);

  // Check the report on open to flag DRAFT PDF if checks fail
  useEffect(() => {
    const controller = new AbortController();
    previewEpdReport({}, {}, controller.signal)
      .then((data) => {
        setHasCriticalIssues((data.warnings || []).some((w) => w.level === 'error'));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [previewEpdReport]);

  const handlePdfDownload = async () => {
    setIsExportingPdf(true);
    try {
      const res = await downloadEpdReport({}, { exportMode });
      if (res && res.certificateId) {
        setLastExportSeal(res);
      }
    } catch (err) {
      showNotif(`PDF export failed: ${err.message || 'Unknown error'}`, 'Export Error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleIlcdDownload = async () => {
    setIsExportingIlcd(true);
    try {
      const res = await downloadIlcdJson(exportMode);
      if (res && res.certificateId) {
        setLastExportSeal(res);
      }
    } catch (err) {
      showNotif(`ILCD export failed: ${err.message || 'Unknown error'}`, 'Export Error');
    } finally {
      setIsExportingIlcd(false);
    }
  };

  const handleOpenEpdDownload = async () => {
    setIsExportingOpenEpd(true);
    try {
      let doc = openepdDocument;
      if (!doc && generateOpenEpdDocument) {
        doc = await generateOpenEpdDocument();
      }
      const res = await downloadOpenEpdJson(doc, exportMode);
      if (res && res.certificateId) {
        setLastExportSeal(res);
      }
    } catch (err) {
      showNotif(`openEPD export failed: ${err.message || 'Unknown error'}`, 'Export Error');
    } finally {
      setIsExportingOpenEpd(false);
    }
  };

  const handleCopyCert = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="phase-container export-view"
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        fontFamily: 'Google Sans Flex, system-ui, -apple-system, sans-serif',
        color: '#16231b',
      }}
    >
      {/* Top Header & Navigation */}
      <div className="view-section no-print" style={{ marginBottom: 24 }}>
        <div
          className="section-header-flex"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent, #1f7a4c)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Phase 7 — Publication &amp; Delivery Suite
              </span>
            </div>
            <h2
              className="section-title"
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#16231b',
                margin: 0,
              }}
            >
              Export EPD &amp; Cryptographic Sealing
            </h2>
            <p
              className="section-subtitle"
              style={{
                color: '#5b6f62',
                fontSize: 13,
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              Generate certified EPD documents with immutable Ed25519 provenance signatures and optional AES-256 envelope encryption.
            </p>
          </div>

          <div
            className="export-action-group"
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => setActivePhase('results')}
              style={{
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
                border: '1px solid #dfe7dd',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#2f3b33',
                cursor: 'pointer',
              }}
            >
              ← Back to Results
            </button>
          </div>
        </div>
      </div>

      {/* Post-Export Certificate Notification Banner */}
      {lastExportSeal && (
        <div
          style={{
            marginBottom: 24,
            padding: '20px 24px',
            backgroundColor: '#eaf7ee',
            border: '1px solid #c3e8cd',
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#1f7a4c',
                }}
              >
                File Sealed &amp; Registered
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #c3e8cd',
                  color: '#16231b',
                }}
              >
                {lastExportSeal.certificateId}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#2f3b33' }}>
              Artifact <strong>{lastExportSeal.filename}</strong> has been signed with the active Ed25519 key.
              Anyone can verify its integrity without login.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleCopyCert(lastExportSeal.certificateId)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #c3e8cd',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#1f7a4c',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy Certificate ID'}
            </button>
            <a
              href={`/verify?c=${encodeURIComponent(lastExportSeal.certificateId)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#1f7a4c',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Open Verify Page →
            </a>
          </div>
        </div>
      )}

      {/* Protection Selector Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #dfe7dd',
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.04)',
        }}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#16231b' }}>
          Cryptographic Protection Mode
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5b6f62', lineHeight: 1.5 }}>
          Choose how outgoing declaration files are packaged. Both modes are registered in the provenance ledger.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {/* Sealed Option */}
          <div
            onClick={() => setExportMode('sealed')}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: `2px solid ${exportMode === 'sealed' ? '#1f7a4c' : '#dfe7dd'}`,
              backgroundColor: exportMode === 'sealed' ? 'rgba(31, 122, 76, 0.04)' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#16231b' }}>
                Sealed Container (.ecmx)
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: exportMode === 'sealed' ? '#1f7a4c' : '#e0e6df',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                Default
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#5b6f62', lineHeight: 1.45 }}>
              AES-256-GCM encrypted envelope. Only authorized EcoMetric users can unlock the content; prevents unauthorized dissemination.
            </p>
          </div>

          {/* Signed Open Option */}
          <div
            onClick={() => setExportMode('signed_open')}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: `2px solid ${exportMode === 'signed_open' ? '#1f7a4c' : '#dfe7dd'}`,
              backgroundColor: exportMode === 'signed_open' ? 'rgba(31, 122, 76, 0.04)' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#16231b' }}>
                Signed Open Document
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: exportMode === 'signed_open' ? '#1f7a4c' : '#e0e6df',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                Standard
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#5b6f62', lineHeight: 1.45 }}>
              Standard PDF/JSON with embedded certificate ID. Readable in any viewer (Acrobat, browser); verifiable on the public ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* PDF Export Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #dfe7dd',
            padding: '24px',
            boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#16231b' }}>
                Type III EPD Report (PDF)
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: '#eaf7ee',
                  color: '#1f7a4c',
                }}
              >
                ISO 14025
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5b6f62', lineHeight: 1.5 }}>
              Full Environmental Product Declaration publication with characterization tables, system boundaries, and verified PCR compliance.
            </p>
            {hasCriticalIssues && (
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '6px 10px',
                  borderRadius: 6,
                }}
              >
                Some checks require review; PDF will be exported in DRAFT status.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handlePdfDownload}
            disabled={isExportingPdf}
            style={{
              marginTop: 16,
              backgroundColor: '#1f7a4c',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '11px 20px',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isExportingPdf ? 'wait' : 'pointer',
              opacity: isExportingPdf ? 0.7 : 1,
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            <span>
              {isExportingPdf
                ? 'Sealing PDF...'
                : exportMode === 'sealed'
                  ? 'Download Sealed PDF (.ecmx)'
                  : 'Download PDF'}
            </span>
          </button>
        </div>

        {/* ILCD+EPD JSON Export Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #dfe7dd',
            padding: '24px',
            boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#16231b' }}>
                ILCD+EPD Package (JSON)
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                }}
              >
                EN 15804+A2
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5b6f62', lineHeight: 1.5 }}>
              European Commission ILCD compliant data format. Compatible with EcoPlatform, ÖKOBAUDAT, and European LCA portals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleIlcdDownload}
            disabled={isExportingIlcd}
            style={{
              marginTop: 16,
              backgroundColor: '#ffffff',
              color: '#1f7a4c',
              border: '1px solid #1f7a4c',
              borderRadius: 8,
              padding: '11px 20px',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isExportingIlcd ? 'wait' : 'pointer',
              opacity: isExportingIlcd ? 0.7 : 1,
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{isExportingIlcd ? 'Sealing ILCD...' : `Export ILCD JSON (${exportMode === 'sealed' ? '.ecmx' : 'Open'})`}</span>
          </button>
        </div>

        {/* openEPD v2.0 JSON Export Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #dfe7dd',
            padding: '24px',
            boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#16231b' }}>
                openEPD v2.0 (JSON)
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                }}
              >
                Building Transparency
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5b6f62', lineHeight: 1.5 }}>
              Standardized digital EPD schema for Building Transparency EC3 integration, procurement analysis, and API ingestion.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenEpdDownload}
            disabled={isExportingOpenEpd}
            style={{
              marginTop: 16,
              backgroundColor: '#ffffff',
              color: '#2f3b33',
              border: '1px solid #dfe7dd',
              borderRadius: 8,
              padding: '11px 20px',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isExportingOpenEpd ? 'wait' : 'pointer',
              opacity: isExportingOpenEpd ? 0.7 : 1,
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{isExportingOpenEpd ? 'Sealing openEPD...' : `Export openEPD (${exportMode === 'sealed' ? '.ecmx' : 'Open'})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
