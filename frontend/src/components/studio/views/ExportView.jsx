import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { DownloadIcon } from '../Icons';

export default function ExportView() {
  const {
    showNotif,
    setActivePhase,
    previewEpdReport,
    downloadEpdReport,
  } = useStudio();

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [hasCriticalIssues, setHasCriticalIssues] = useState(false);

  // Check the report on open, to flag a DRAFT PDF.
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
    setIsDownloadingPdf(true);
    try {
      await downloadEpdReport({}, {});
    } catch (err) {
      showNotif(`PDF export failed: ${err.message || 'Unknown error'}`, 'Export Error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="phase-container export-view" style={{ maxWidth: 1240, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
      {/* Top Header & Navigation Breadcrumb */}
      <div className="view-section no-print" style={{ marginBottom: 20 }}>
        <div className="section-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent, #1f7a4c)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Phase 7 • Publication &amp; Delivery
              </span>
            </div>
            <h2 className="section-title" style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-0.4px',
              color: '#1D1D1F',
              margin: 0,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
            }}>
              Export EPD &amp; Verification Publishing Suite
            </h2>
            <p className="section-subtitle" style={{ color: '#86868B', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
              Download the EPD report as a PDF.
            </p>
          </div>

          <div className="export-action-group" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setActivePhase('results')}
              style={{
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#FFFFFF',
                border: '1px solid #D2D2D7',
                borderRadius: 9999,
                padding: '6px 14px',
                color: '#1D1D1F',
                cursor: 'pointer'
              }}
            >
              ← Back to Results
            </button>
          </div>
        </div>

        {/* EPD REPORT CARD: ONE-CLICK PDF DOWNLOAD */}
        <div style={{
          marginTop: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E5E5EA',
          padding: '24px 28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div style={{ maxWidth: 620 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: '#1D1D1F', letterSpacing: '-0.3px' }}>
              EPD report
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#636366', lineHeight: 1.5 }}>
              Download your Environmental Product Declaration as a PDF.
            </p>
            {hasCriticalIssues && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#8F5800', lineHeight: 1.45 }}>
                Some required checks are not passing yet, so the PDF will be marked DRAFT.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handlePdfDownload}
              disabled={isDownloadingPdf}
              style={{
                backgroundColor: 'var(--accent, #1f7a4c)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 9999,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: isDownloadingPdf ? 'wait' : 'pointer',
                opacity: isDownloadingPdf ? 0.7 : 1
              }}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Preparing PDF…' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
