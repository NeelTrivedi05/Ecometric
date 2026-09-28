import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { DownloadIcon, RefreshCwIcon, CheckIcon, ShieldCheckIcon, AlertTriangleIcon, InfoIcon, FileIcon } from './Icons';

export default function ReportDetailsModal() {
  const {
    isReportDetailsModalOpen,
    setIsReportDetailsModalOpen,
    reportDetails,
    setReportDetails,
    saveReportDetails,
    validatePreExport,
    exportEpdPdf,
    getEpdPdfPreview,
    isLoading,
    showNotif,
    extractedData,
  } = useStudio();

  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'product' | 'declaration' | 'verification' | 'methodology' | 'validation' | 'preview'
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [confirmWarnings, setConfirmWarnings] = useState(true);

  // New item inputs for repeatable lists
  const [newTechBullet, setNewTechBullet] = useState('');
  const [newPcrReviewer, setNewPcrReviewer] = useState('');
  const [newReference, setNewReference] = useState('');

  // Run validation whenever modal opens or tab changes to 'validation'
  useEffect(() => {
    if (isReportDetailsModalOpen) {
      handleRunValidation();
    }
  }, [isReportDetailsModalOpen]);

  // Load preview when preview tab is clicked
  useEffect(() => {
    if (activeTab === 'preview' && !previewHtml) {
      handleLoadPreview();
    }
  }, [activeTab]);

  if (!isReportDetailsModalOpen) return null;

  const updateField = (field, val) => {
    setReportDetails(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      const res = await validatePreExport(reportDetails);
      setValidationResult(res);
    } catch (err) {
      console.error('Validation gate error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const html = await getEpdPdfPreview(reportDetails);
      setPreviewHtml(html);
    } catch (err) {
      console.error('Failed to load preview:', err);
      showNotif('Failed to load live preview', 'Preview Error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveReportDetails(reportDetails);
      showNotif('Report details saved successfully', 'Saved');
    } catch (err) {
      showNotif('Failed to save report details', 'Error');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Run validation check
      const val = await validatePreExport(reportDetails);
      setValidationResult(val);

      if (!val.valid) {
        showNotif('Pre-export validation gate failed. Please review errors.', 'Export Blocked');
        setActiveTab('validation');
        setIsExporting(false);
        return;
      }

      await saveReportDetails(reportDetails);
      await exportEpdPdf(reportDetails);
      showNotif('EPD11017 Publication PDF generated and downloaded successfully!', 'PDF Exported');
      setIsReportDetailsModalOpen(false);
    } catch (err) {
      console.error('PDF export failed:', err);
      showNotif('Export failed: ' + (err.message || 'Unknown error'), 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Logo & Image upload to base64
  const handleFileUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotif('Image exceeds 5MB limit', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField(field, reader.result);
      showNotif('Image uploaded successfully', 'Uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Repeatable list helpers
  const addTechBullet = () => {
    if (!newTechBullet.trim()) return;
    updateField('technical_data_bullets', [...(reportDetails.technical_data_bullets || []), newTechBullet.trim()]);
    setNewTechBullet('');
  };

  const removeTechBullet = (idx) => {
    const next = [...(reportDetails.technical_data_bullets || [])];
    next.splice(idx, 1);
    updateField('technical_data_bullets', next);
  };

  const addPcrReviewer = () => {
    if (!newPcrReviewer.trim()) return;
    updateField('pcr_review_panel', [...(reportDetails.pcr_review_panel || []), newPcrReviewer.trim()]);
    setNewPcrReviewer('');
  };

  const removePcrReviewer = (idx) => {
    const next = [...(reportDetails.pcr_review_panel || [])];
    next.splice(idx, 1);
    updateField('pcr_review_panel', next);
  };

  const addReference = () => {
    if (!newReference.trim()) return;
    updateField('extra_references', [...(reportDetails.extra_references || []), newReference.trim()]);
    setNewReference('');
  };

  const removeReference = (idx) => {
    const next = [...(reportDetails.extra_references || [])];
    next.splice(idx, 1);
    updateField('extra_references', next);
  };

  const charCount = (reportDetails.description_of_company || '').length;

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'product', label: 'Product' },
    { id: 'declaration', label: 'Declaration' },
    { id: 'verification', label: 'Verification' },
    { id: 'methodology', label: 'Notes & References' },
    {
      id: 'validation',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>Validation Gate</span>
          {validationResult && (
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: validationResult.valid ? '#28CD41' : '#FF3B30',
              display: 'inline-block'
            }} />
          )}
        </span>
      )
    },
    { id: 'preview', label: 'Live Preview' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.38)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '24px 16px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#1D1D1F',
        width: '100%',
        maxWidth: 1060,
        height: '92vh',
        borderRadius: 20,
        boxShadow: '0 30px 90px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
      }}>
        
        {/* MACOS TITLEBAR HEADER */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #E5E5EA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FAFAFC',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* macOS Window Controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F56', display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#27C93F', display: 'inline-block', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
            </div>

            <div style={{ height: 18, width: 1, backgroundColor: '#E5E5EA', margin: '0 4px' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: '#1D1D1F',
                  letterSpacing: '-0.3px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                }}>
                  EPD Publication Settings &amp; Report Details
                </h2>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: '#E8F2FE',
                  color: '#0066CC',
                  padding: '2px 9px',
                  borderRadius: 9999,
                  letterSpacing: '-0.1px'
                }}>
                  EPD11017 Verified Standard
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#86868B', margin: '2px 0 0 0' }}>
                Manufacturer metadata propagation, UL 10010-4 / EN 15804+A2 declaration parameters, and third-party verification sign-off.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReportDetailsModalOpen(false)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#E5E5EA',
              border: 'none',
              color: '#636366',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#D2D2D7'; e.currentTarget.style.color = '#1D1D1F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E5E5EA'; e.currentTarget.style.color = '#636366'; }}
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* APPLE SEGMENTED CONTROL TABS */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#FAFAFC',
          borderBottom: '1px solid #E5E5EA'
        }}>
          <div style={{
            backgroundColor: '#E5E5EA',
            padding: 3,
            borderRadius: 11,
            display: 'inline-flex',
            gap: 2,
            width: '100%',
            overflowX: 'auto'
          }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    minWidth: 'max-content',
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#1D1D1F' : '#636366',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE CONTENT) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          backgroundColor: '#F5F5F7'
        }}>

          {/* TAB 1: COMPANY & BRAND */}
          {activeTab === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Apple Callout Note */}
              <div style={{
                backgroundColor: 'rgba(0, 113, 227, 0.06)',
                border: '1px solid rgba(0, 113, 227, 0.16)',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 12,
                color: '#1D1D1F',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <InfoIcon className="w-4 h-4 text-blue-600" style={{ flexShrink: 0, marginTop: 2, color: '#0071E3' }} />
                <div>
                  <strong style={{ color: '#0071E3' }}>Single Source of Truth Propagation:</strong> Company details automatically populate the EPD Cover Page, Table 1 ("Manufacturer Name &amp; Address"), Section 1 ("Description of Company"), running footers, and verification credentials.
                </div>
              </div>

              {/* Form Card */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E5EA',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Company / Manufacturer Name *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.company_name || ''}
                      onChange={(e) => updateField('company_name', e.target.value)}
                      placeholder="e.g. Carrier Corporation"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Company Website (URL)
                    </label>
                    <input
                      type="url"
                      value={reportDetails.company_website || ''}
                      onChange={(e) => updateField('company_website', e.target.value)}
                      placeholder="e.g. https://www.carrier.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Manufacturer Address *
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails.company_address || ''}
                    onChange={(e) => updateField('company_address', e.target.value)}
                    placeholder="e.g. 13995 Pasteur Boulevard, Palm Beach Gardens, Florida 33418"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* LOGO UPLOAD */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Company Logo (PNG / SVG)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      backgroundColor: '#F2F2F7',
                      border: '1px solid #D2D2D7',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1D1D1F',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}>
                      <span>Choose File...</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg"
                        onChange={(e) => handleFileUpload('company_logo', e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {reportDetails.company_logo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={reportDetails.company_logo}
                          alt="Company Logo Preview"
                          style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain', border: '1px solid #E5E5EA', padding: 4, borderRadius: 6, backgroundColor: '#FFFFFF' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateField('company_logo', '')}
                          style={{ background: 'none', border: 'none', color: '#FF3B30', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#86868B' }}>No logo selected (default text header used)</span>
                    )}
                  </div>
                </div>

                {/* DESCRIPTION OF COMPANY */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#1D1D1F' }}>
                      Description of Company (~600 chars max) *
                    </label>
                    <span style={{ fontSize: 11, color: charCount > 650 ? '#FF3B30' : '#86868B' }}>
                      {charCount} / 600 characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={reportDetails.description_of_company || ''}
                    onChange={(e) => updateField('description_of_company', e.target.value)}
                    placeholder="Describe your organization's sustainability vision, manufacturing footprint, and thermal solutions..."
                    style={{
                      ...inputStyle,
                      border: charCount > 650 ? '1px solid #FF3B30' : '1px solid #D2D2D7',
                      lineHeight: 1.5,
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ paddingTop: 4 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', color: '#1D1D1F' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(reportDetails.save_as_company_defaults)}
                      onChange={(e) => updateField('save_as_company_defaults', e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#0071E3' }}
                    />
                    <span>Save as company defaults (pre-fill organization metadata across future declarations)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT & SPECS */}
          {activeTab === 'product' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E5EA',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Product Name &amp; Model *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.product_name || ''}
                      onChange={(e) => updateField('product_name', e.target.value)}
                      placeholder="e.g. AquaEdge® 19DV Water-Cooled Centrifugal Chiller"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      CSI MasterFormat Division
                    </label>
                    <input
                      type="text"
                      value={reportDetails.csi_code || ''}
                      onChange={(e) => updateField('csi_code', e.target.value)}
                      placeholder="e.g. 23 64 16.16"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Product Description *
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails.product_description || ''}
                    onChange={(e) => updateField('product_description', e.target.value)}
                    placeholder="Technical description of the unit, compressor stages, ceramic bearing architecture, and heat exchange mechanics..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* PRODUCT IMAGE UPLOAD */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Product Image (Rendered on Cover &amp; Figure 1)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      backgroundColor: '#F2F2F7',
                      border: '1px solid #D2D2D7',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1D1D1F',
                      cursor: 'pointer'
                    }}>
                      <span>Upload Product Photo...</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleFileUpload('product_image', e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {reportDetails.product_image && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={reportDetails.product_image}
                          alt="Product Preview"
                          style={{ maxHeight: 48, maxWidth: 100, objectFit: 'contain', border: '1px solid #E5E5EA', padding: 4, borderRadius: 6, backgroundColor: '#FFFFFF' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateField('product_image', '')}
                          style={{ background: 'none', border: 'none', color: '#FF3B30', fontSize: 12, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* TECHNICAL DATA BULLETS */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Technical Specifications &amp; Industry Standards
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      value={newTechBullet}
                      onChange={(e) => setNewTechBullet(e.target.value)}
                      placeholder="e.g. Certified in accordance with AHRI Standard 550/590..."
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTechBullet(); } }}
                    />
                    <button
                      type="button"
                      onClick={addTechBullet}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: '#0071E3',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(reportDetails.technical_data_bullets || []).map((bullet, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F9F9FB',
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #E5E5EA',
                        fontSize: 12,
                        color: '#1D1D1F'
                      }}>
                        <span>• {bullet}</span>
                        <button
                          type="button"
                          onClick={() => removeTechBullet(idx)}
                          style={{ background: 'none', border: 'none', color: '#86868B', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#FF3B30'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#86868B'}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Hazardous Substances Statement
                  </label>
                  <input
                    type="text"
                    value={reportDetails.hazardous_substances_statement || ''}
                    onChange={(e) => updateField('hazardous_substances_statement', e.target.value)}
                    placeholder="e.g. No substances required to be reported as hazardous under RCRA Subtitle 3 are associated..."
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DECLARATION & PCR */}
          {activeTab === 'declaration' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E5EA',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Declaration Number *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.declaration_number || ''}
                      onChange={(e) => updateField('declaration_number', e.target.value)}
                      placeholder="e.g. EPD11017"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Date of Issue *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.date_of_issue || ''}
                      onChange={(e) => updateField('date_of_issue', e.target.value)}
                      placeholder="MM/DD/YYYY"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Period of Validity *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.validity_period || ''}
                      onChange={(e) => updateField('validity_period', e.target.value)}
                      placeholder="e.g. 5 Years from the date of issue"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Intended Application and Use *
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails.intended_application || ''}
                    onChange={(e) => updateField('intended_application', e.target.value)}
                    placeholder="Describe functional unit basis and cooling capacity..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Markets of Applicability
                    </label>
                    <input
                      type="text"
                      value={reportDetails.markets || ''}
                      onChange={(e) => updateField('markets', e.target.value)}
                      placeholder="e.g. North America, Global"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      General Program Instructions (GPI)
                    </label>
                    <input
                      type="text"
                      value={reportDetails.general_program_instructions || ''}
                      onChange={(e) => updateField('general_program_instructions', e.target.value)}
                      placeholder="e.g. Part A: LCA Calculations and Report Requirements v4.0"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Reference PCR and Version Number *
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails.reference_pcr || ''}
                    onChange={(e) => updateField('reference_pcr', e.target.value)}
                    placeholder="Part A & Part B PCR references..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* PCR REVIEW PANEL */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    PCR Review Panel Members
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      value={newPcrReviewer}
                      onChange={(e) => setNewPcrReviewer(e.target.value)}
                      placeholder="e.g. Lise Laurin, EarthShift Global"
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPcrReviewer(); } }}
                    />
                    <button
                      type="button"
                      onClick={addPcrReviewer}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: '#0071E3',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(reportDetails.pcr_review_panel || []).map((panelist, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F9F9FB',
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #E5E5EA',
                        fontSize: 12,
                        color: '#1D1D1F'
                      }}>
                        <span>{panelist}</span>
                        <button
                          type="button"
                          onClick={() => removePcrReviewer(idx)}
                          style={{ background: 'none', border: 'none', color: '#86868B', fontSize: 16, cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#FF3B30'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#86868B'}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROGRAM OPERATOR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Program Operator Name
                    </label>
                    <input
                      type="text"
                      value={reportDetails.program_operator_name || ''}
                      onChange={(e) => updateField('program_operator_name', e.target.value)}
                      placeholder="e.g. NSF Certification, LLC"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Program Operator Website
                    </label>
                    <input
                      type="url"
                      value={reportDetails.program_operator_website || ''}
                      onChange={(e) => updateField('program_operator_website', e.target.value)}
                      placeholder="https://www.nsf.org/"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION & SIGN-OFF */}
          {activeTab === 'verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Apple HIG Verification Mode Card */}
              <div style={{
                backgroundColor: reportDetails.is_verified ? 'rgba(40, 205, 65, 0.08)' : 'rgba(255, 159, 10, 0.08)',
                padding: '18px 20px',
                borderRadius: 14,
                border: reportDetails.is_verified ? '1px solid rgba(40, 205, 65, 0.25)' : '1px solid rgba(255, 159, 10, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheckIcon className="w-5 h-5" style={{ color: reportDetails.is_verified ? '#28CD41' : '#FF9F0A' }} />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                      {reportDetails.is_verified ? 'Third-Party Verified EPD' : 'Declaration in Draft Mode (Unverified)'}
                    </h4>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#636366' }}>
                    {reportDetails.is_verified
                      ? 'Official verifier sign-off credentials and signature block will be rendered on Page 2.'
                      : 'A visible "DRAFT: NOT THIRD-PARTY VERIFIED" watermark appears on all pages until verified.'}
                  </p>
                </div>

                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: '1px solid #D2D2D7',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <input
                    type="checkbox"
                    checked={Boolean(reportDetails.is_verified)}
                    onChange={(e) => updateField('is_verified', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0071E3' }}
                  />
                  <span>Mark as Verified</span>
                </label>
              </div>

              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E5EA',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      LCA Practitioner / Conductor *
                    </label>
                    <input
                      type="text"
                      value={reportDetails.lca_practitioner_name || ''}
                      onChange={(e) => updateField('lca_practitioner_name', e.target.value)}
                      placeholder="e.g. Shashikumar M S, HCLTech"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                      Practitioner Organisation
                    </label>
                    <input
                      type="text"
                      value={reportDetails.lca_practitioner_org || ''}
                      onChange={(e) => updateField('lca_practitioner_org', e.target.value)}
                      placeholder="e.g. HCLTech Sustainability Services"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* VERIFIER DETAILS (ONLY IF VERIFIED) */}
                {reportDetails.is_verified && (
                  <div style={{
                    marginTop: 8,
                    paddingTop: 16,
                    borderTop: '1px solid #E5E5EA',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                  }}>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0071E3' }}>
                      Independent Third-Party Verifier Credentials
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#1D1D1F' }}>
                          Verifier Name &amp; Title *
                        </label>
                        <input
                          type="text"
                          value={reportDetails.verifier_name || ''}
                          onChange={(e) => updateField('verifier_name', e.target.value)}
                          placeholder="e.g. Jack Geibig - EcoForm"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#1D1D1F' }}>
                          Verifier Email *
                        </label>
                        <input
                          type="email"
                          value={reportDetails.verifier_email || ''}
                          onChange={(e) => updateField('verifier_email', e.target.value)}
                          placeholder="jgeibig@ecoform.com"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                        Verifier Signature Image (Optional PNG/JPEG)
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileUpload('verifier_signature', e)}
                        style={{ fontSize: 12, color: '#636366' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: METHODOLOGY & DISCLAIMERS */}
          {activeTab === 'methodology' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #E5E5EA',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Declaration Limitations Text (Page 2) *
                  </label>
                  <textarea
                    rows={4}
                    value={reportDetails.limitations_text || ''}
                    onChange={(e) => updateField('limitations_text', e.target.value)}
                    style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Assumptions and Limitations (Closing Section) *
                  </label>
                  <textarea
                    rows={4}
                    value={reportDetails.assumptions_limitations_text || ''}
                    onChange={(e) => updateField('assumptions_limitations_text', e.target.value)}
                    style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }}
                  />
                </div>

                {/* EXTRA REFERENCES */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#1D1D1F' }}>
                    Extra References (Appended to standard ISO/UL bibliography)
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="e.g. NIST. (2024). Thermophysical Properties of Refrigerants..."
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReference(); } }}
                    />
                    <button
                      type="button"
                      onClick={addReference}
                      style={{
                        padding: '8px 18px',
                        backgroundColor: '#0071E3',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(reportDetails.extra_references || []).map((refText, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F9F9FB',
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #E5E5EA',
                        fontSize: 12,
                        color: '#1D1D1F'
                      }}>
                        <span>{refText}</span>
                        <button
                          type="button"
                          onClick={() => removeReference(idx)}
                          style={{ background: 'none', border: 'none', color: '#86868B', fontSize: 16, cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#FF3B30'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#86868B'}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: VALIDATION GATE */}
          {activeTab === 'validation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>
                    Pre-Export Validation Diagnostics
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#86868B' }}>
                    Automated mass balance reconciliation, indicator module sums, and dataset mapping gate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunValidation}
                  disabled={isValidating}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D2D2D7',
                    borderRadius: 9999,
                    color: '#1D1D1F',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <RefreshCwIcon size={12} className={isValidating ? 'spin' : ''} />
                  <span>Re-check Diagnostics</span>
                </button>
              </div>

              {validationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* OVERALL BANNER */}
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    backgroundColor: validationResult.valid ? 'rgba(40, 205, 65, 0.08)' : 'rgba(255, 59, 48, 0.08)',
                    border: validationResult.valid ? '1px solid rgba(40, 205, 65, 0.25)' : '1px solid rgba(255, 59, 48, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <span style={{
                      fontSize: 16,
                      color: validationResult.valid ? '#28CD41' : '#FF3B30',
                      fontWeight: 700
                    }}>
                      {validationResult.valid ? '✓' : '✕'}
                    </span>
                    <strong style={{ fontSize: 13, color: validationResult.valid ? '#1B5E20' : '#D70015', fontWeight: 600 }}>
                      {validationResult.valid
                        ? 'PRE-EXPORT INTEGRITY GATE PASSED — Document conforms to reference EPD11017'
                        : 'EXPORT GATE BLOCKED — Resolve critical mass balance or dataset mapping errors before compiling PDF'}
                    </strong>
                  </div>

                  {/* CHECKLIST TILES */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {Object.entries(validationResult.checks_passed || {}).map(([checkKey, passed]) => (
                      <div key={checkKey} style={{
                        padding: '12px 16px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        border: '1px solid #E5E5EA',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <span style={{ textTransform: 'capitalize', color: '#1D1D1F', fontWeight: 500 }}>
                          {checkKey.replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          color: passed ? '#28CD41' : '#FF3B30',
                          fontWeight: 600,
                          backgroundColor: passed ? 'rgba(40, 205, 65, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontSize: 11
                        }}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ERRORS */}
                  {validationResult.errors?.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(255, 59, 48, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 59, 48, 0.2)' }}>
                      <strong style={{ color: '#D70015', fontSize: 13 }}>Errors Blocking Export:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#D70015', fontSize: 12 }}>
                        {validationResult.errors.map((err, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* WARNINGS */}
                  {validationResult.warnings?.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(255, 159, 10, 0.08)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 159, 10, 0.25)' }}>
                      <strong style={{ color: '#8F5800', fontSize: 13 }}>Advisory Notices:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#8F5800', fontSize: 12 }}>
                        {validationResult.warnings.map((warn, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#86868B' }}>
                  Evaluating integrity checks...
                </div>
              )}
            </div>
          )}

          {/* TAB 7: LIVE DOCUMENT PREVIEW */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#636366' }}>
                  High-DPI rendered view of the complete document using exact styles, life-cycle matrices, and server-side charts.
                </span>
                <button
                  type="button"
                  onClick={handleLoadPreview}
                  disabled={isLoadingPreview}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D2D2D7',
                    borderRadius: 9999,
                    color: '#1D1D1F',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isLoadingPreview ? 'Refreshing...' : 'Refresh Preview'}
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 480, border: '1px solid #E5E5EA', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {isLoadingPreview ? (
                  <div style={{ padding: 60, textAlign: 'center', color: '#86868B' }}>
                    Compiling server-side charts and assembling HTML preview...
                  </div>
                ) : (
                  <iframe
                    srcDoc={previewHtml}
                    title="Live EPD Preview"
                    style={{ width: '100%', height: '100%', minHeight: 480, border: 'none' }}
                  />
                )}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E5EA',
          backgroundColor: '#FAFAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              backgroundColor: '#FFFFFF',
              color: '#1D1D1F',
              border: '1px solid #D2D2D7',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIsReportDetailsModalOpen(false)}
              style={{
                padding: '8px 16px',
                background: 'none',
                color: '#636366',
                border: 'none',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || (validationResult && !validationResult.valid)}
              style={{
                padding: '10px 24px',
                backgroundColor: validationResult && !validationResult.valid ? '#E5E5EA' : '#0071E3',
                color: validationResult && !validationResult.valid ? '#86868B' : '#FFFFFF',
                border: 'none',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                cursor: validationResult && !validationResult.valid ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: validationResult && !validationResult.valid ? 'none' : '0 2px 8px rgba(0, 113, 227, 0.3)',
                transition: 'all 0.15s ease-in-out'
              }}
            >
              <DownloadIcon className="w-4 h-4" />
              <span>{isExporting ? 'Compiling PDF via Chromium...' : 'Download Verified Publication PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #D2D2D7',
  borderRadius: 10,
  color: '#1D1D1F',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
};
