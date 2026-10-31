import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { API_BASE } from '../config/api';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [certInput, setCertInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-verify if certificate ID is passed in query string: ?c=ECM-...
  useEffect(() => {
    const certFromQuery = searchParams.get('c') || searchParams.get('cert') || searchParams.get('certificate');
    if (certFromQuery) {
      setCertInput(certFromQuery.trim());
      handleVerifyByCertId(certFromQuery.trim());
    }
  }, [searchParams]);

  const handleVerifyByCertId = async (idToVerify) => {
    const targetId = (idToVerify || certInput).trim();
    if (!targetId) {
      setErrorMsg('Please enter a certificate ID.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);

    try {
      const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(targetId)}`);
      if (res.status === 404) {
        setVerificationResult({
          result: 'not_found',
          certificate_id: targetId,
          detail: 'No matching record found in the EcoMetric Registry.',
        });
      } else {
        const data = await res.json();
        setVerificationResult(data);
      }
    } catch (err) {
      setErrorMsg('Network error connecting to verification service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileVerify = async (file) => {
    if (!file) return;
    if (file.size > 64 * 1024 * 1024) {
      setErrorMsg('File exceeds the 64 MB size limit.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to verify file');
      }

      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error verifying file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileVerify(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleCopyCert = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setSelectedFile(null);
    setCertInput('');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderStatusBanner = () => {
    if (!verificationResult) return null;
    const { result, revoke_reason, superseded_by } = verificationResult;

    if (result === 'authentic') {
      return (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#eaf7ee',
            border: '1px solid #c3e8cd',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1f7a4c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#16231b' }}>
              Authentic EcoMetric Declaration
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#2f3b33', lineHeight: '1.5' }}>
              The file cryptographic hash and digital signature match the official EcoMetric provenance registry.
              This file has not been altered since publication.
            </p>
          </div>
        </div>
      );
    }

    if (result === 'modified') {
      return (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ✕
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#991b1b' }}>
              Integrity Check Failed
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5' }}>
              The cryptographic signature or file checksum does not match our records. The file content may have
              been modified, corrupted, or re-exported outside the certified pipeline.
            </p>
          </div>
        </div>
      );
    }

    if (result === 'revoked') {
      return (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#991b1b' }}>
              Declaration Revoked
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5' }}>
              This declaration was formally revoked by the issuing organization and is no longer valid for compliance claims.
            </p>
            {revoke_reason && (
              <p style={{ margin: 0, fontSize: '13px', color: '#991b1b', fontStyle: 'italic' }}>
                Reason: {revoke_reason}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (result === 'superseded') {
      return (
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#b45309',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            ↺
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#92400e' }}>
              Superseded by Newer Revision
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#78350f', lineHeight: '1.5' }}>
              This declaration was replaced by an updated assessment. Please reference the current certificate.
            </p>
            {superseded_by && (
              <button
                onClick={() => handleVerifyByCertId(superseded_by)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#1f7a4c',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View Replacement Certificate: {superseded_by}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: '20px 24px',
          backgroundColor: '#e0f2fe',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          ?
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#075985' }}>
            Record Not Found
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#0369a1', lineHeight: '1.5' }}>
            No certificate matching this file hash or identifier was found in the public ledger.
            Check that the file was generated with EcoMetric sealing enabled.
          </p>
        </div>
      </div>
    );
  };

  const prov = verificationResult?.provenance;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f2f6f0',
        fontFamily: 'Google Sans Flex, system-ui, -apple-system, sans-serif',
        color: '#16231b',
        padding: '32px 16px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header with Centered Logo */}
      <header style={{ marginBottom: '36px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
          <BrandLogo theme="light" height={28} />
        </Link>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 700,
            margin: '18px 0 6px',
            letterSpacing: '-0.02em',
            color: '#16231b',
          }}
        >
          Public EPD Authenticity Verification
        </h1>
        <p style={{ fontSize: '14px', color: '#5b6f62', margin: 0, maxWidth: '580px', lineHeight: '1.5' }}>
          Verify the cryptographic integrity and organization provenance of any Environmental Product
          Declaration (PDF, JSON, or Sealed Container) exported from EcoMetric.
        </p>
      </header>

      {/* Main Card Container */}
      <main
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #dfe7dd',
          boxShadow: '0 4px 20px -4px rgba(22, 35, 27, 0.05)',
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Screen Reader Live Announcement */}
        <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
          {verificationResult ? `Verification complete: ${verificationResult.result}` : ''}
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Input Methods Section (Visible when no result is currently shown) */}
        {!verificationResult && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '24px',
              }}
            >
              {/* Dropzone File Upload */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#1f7a4c' : '#dfe7dd'}`,
                  borderRadius: '12px',
                  backgroundColor: isDragging ? 'rgba(31, 122, 76, 0.04)' : '#f8faf6',
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.json,.xlsx,.ecmx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileVerify(e.target.files[0]);
                    }
                  }}
                />
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(31, 122, 76, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1f7a4c',
                    fontSize: '20px',
                    marginBottom: '12px',
                  }}
                >
                  ↑
                </div>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px', color: '#16231b' }}>
                  {selectedFile ? selectedFile.name : 'Upload or drop EPD PDF'}
                </p>
                <p style={{ fontSize: '12px', color: '#5b6f62', margin: 0 }}>
                  Supports PDF reports, Sealed .ecmx, or JSON declarations (up to 64 MB)
                </p>
              </div>

              {/* Certificate ID Text Lookup */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  backgroundColor: '#f8faf6',
                  borderRadius: '12px',
                  border: '1px solid #dfe7dd',
                  padding: '24px',
                }}
              >
                <label
                  htmlFor="cert-id-input"
                  style={{ fontSize: '13px', fontWeight: 600, color: '#16231b', marginBottom: '8px' }}
                >
                  Or enter Certificate ID
                </label>
                <input
                  id="cert-id-input"
                  type="text"
                  placeholder="ECM-XXXX-XXXX-XXXX-XXXX"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyByCertId()}
                  style={{
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    borderRadius: '8px',
                    border: '1px solid #dfe7dd',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    marginBottom: '12px',
                  }}
                />
                <button
                  onClick={() => handleVerifyByCertId()}
                  disabled={isLoading || !certInput.trim()}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: certInput.trim() ? '#1f7a4c' : '#e0e6df',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: certInput.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify Certificate'}
                </button>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#738077', margin: 0, textAlign: 'center' }}>
              Verification calculates an in-browser SHA-256 fingerprint. No unencrypted document contents are shared.
            </p>
          </div>
        )}

        {/* Loading Spinner / State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #dfe7dd',
                borderTopColor: '#1f7a4c',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: '14px', color: '#5b6f62', fontWeight: 500, margin: 0 }}>
              Checking cryptographic signatures and registry ledger...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Verification Result Display */}
        {verificationResult && (
          <div>
            {renderStatusBanner()}

            {/* Provenance Key-Value Record Table */}
            {prov && (
              <div
                style={{
                  border: '1px solid #dfe7dd',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#f8faf6',
                    borderBottom: '1px solid #dfe7dd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#5b6f62', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Provenance Metadata Record
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(31, 122, 76, 0.08)',
                      color: '#1f7a4c',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    Ed25519 Verified
                  </span>
                </div>

                <div style={{ padding: '8px 18px' }}>
                  {[
                    ['Certificate ID', verificationResult.certificate_id, true],
                    ['Issuing Organization', prov.organization_name],
                    ['Product Name', prov.product_name],
                    ['EPD Declaration ID', prov.epd_id],
                    ['Revision Version', prov.epd_version || '1.0'],
                    ['LCI Background Database', `${prov.lci_database || 'ecoinvent'} ${prov.lci_database_version || '3.12'}`],
                    ['Export Mode', prov.export_mode === 'sealed' ? 'Sealed Container (.ecmx)' : 'Signed Open Document'],
                    ['Software Engine', `EcoMetric Studio v${prov.software_version || '1.0.0'}`],
                    ['Signature Algorithm', prov.signature_algorithm || 'Ed25519'],
                    ['Timestamp (UTC)', prov.created_at ? new Date(prov.created_at).toUTCString() : 'N/A'],
                  ].map(([label, value, isCode], idx) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: idx < 9 ? '1px solid #edf2ec' : 'none',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ color: '#5b6f62', fontWeight: 500 }}>{label}</span>
                      <span
                        style={{
                          color: '#16231b',
                          fontWeight: 600,
                          fontFamily: isCode ? 'monospace' : 'inherit',
                          fontSize: isCode ? '12px' : '13px',
                          letterSpacing: isCode ? '0.04em' : 'normal',
                          textAlign: 'right',
                        }}
                      >
                        {value || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={resetVerification}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  color: '#2f3b33',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Verify Another File
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {verificationResult.certificate_id && (
                  <button
                    onClick={() => handleCopyCert(verificationResult.certificate_id)}
                    style={{
                      padding: '9px 16px',
                      backgroundColor: copied ? '#eaf7ee' : '#f8faf6',
                      border: `1px solid ${copied ? '#c3e8cd' : '#dfe7dd'}`,
                      borderRadius: '8px',
                      color: copied ? '#1f7a4c' : '#2f3b33',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy Certificate ID'}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#1f7a4c',
                    border: '1px solid #1f7a4c',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Print Verification Record
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer style={{ marginTop: '36px', textAlign: 'center' }}>
        <Link
          to="/"
          style={{
            color: '#5b6f62',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Return to EcoMetric Home
        </Link>
      </footer>
    </div>
  );
}

