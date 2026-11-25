import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudio } from '../../../context/StudioContext';
import { DownloadIcon, CheckIcon } from '../Icons';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #dfe7dd',
  padding: '24px 28px',
  marginBottom: 24,
  boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.04)',
};

const PDF_CONTENTS = [
  'Product description and unit',
  'System boundary and modules',
  'Characterization results',
  'PCR compliance and data quality',
];

export default function ExportView() {
  const {
    generateOpenEpdDocument,
    downloadOpenEpdJson,
    setActivePhase,
    canExport,
    exportEpdPdf,
    reportDetails,
    activeProject,
    productProfile,
    projectInfo,
  } = useStudio();

  const [format, setFormat] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  async function download(kind) {
    if (!canExport || format) return;
    setFormat(kind);
    setReceipt(null);
    setError('');
    try {
      if (kind === 'PDF') {
        setReceipt(await exportEpdPdf(reportDetails));
      } else {
        const document = await generateOpenEpdDocument();
        if (!document) throw new Error('The report service could not prepare the openEPD file. Try again.');
        setReceipt(await downloadOpenEpdJson(document));
      }
    } catch (err) {
      setError(err.message || 'The download failed. Please try again.');
    } finally {
      setFormat(null);
    }
  }

  const summaryRows = [
    ['Project', activeProject?.name],
    ['Product category', productProfile?.name],
    ['Manufacturer', projectInfo?.manufacturer],
    ['Functional / declared unit', projectInfo?.declaredUnitStatement],
    ['Product category rules', projectInfo?.pcrRef],
    ['LCIA methodology', projectInfo?.lciaMethod],
    ['Background database', 'ecoinvent v3.12 (cut-off)'],
    ['Reference service life', projectInfo?.rsl],
  ];

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
      {/* Header */}
      <div className="view-section no-print" style={{ marginBottom: 24 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent, #1f7a4c)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Step 8 — Export
        </span>
        <h2
          className="section-title"
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#16231b',
            margin: '4px 0 0',
          }}
        >
          Export EPD
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
          Review the project details and choose a report format.
        </p>
      </div>

      {/* Declaration Summary Card */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#16231b' }}>
          Declaration summary
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px 24px',
          }}
        >
          {summaryRows.map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#5b6f62', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#16231b', lineHeight: 1.4 }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Export Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#16231b' }}>
            Report files
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
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5b6f62', lineHeight: 1.5 }}>
          Use the PDF for document review or openEPD JSON for the calculated impact data.
        </p>

        <div style={{ fontSize: 12, fontWeight: 600, color: '#5b6f62', marginBottom: 8 }}>Included in the PDF</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PDF_CONTENTS.map((item) => (
            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2f3b33' }}>
              <CheckIcon size={14} style={{ color: '#1f7a4c' }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {canExport ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
            {['PDF', 'openEPD JSON'].map(kind => (
              <button key={kind} className="btn btn-outline" disabled={Boolean(format)} onClick={() => download(kind)}>
                <DownloadIcon size={16} /> {format === kind ? 'Preparing file…' : `Download ${kind}`}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p>Complete the input and results checks for the current inventory before downloading.</p>
            <button className="btn btn-outline" onClick={() => setActivePhase('audit')}>Return to pre-audit verification</button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {receipt && <div role="status" style={{ marginTop: 16 }}>
          <p>Downloaded {receipt.filename}.</p>
          {receipt.certificateId
            ? <Link to={`/verify?c=${encodeURIComponent(receipt.certificateId)}`}>View certificate {receipt.certificateId}</Link>
            : <p>This export was issued without a registry certificate.</p>}
        </div>}
      </div>
    </div>
  );
}
