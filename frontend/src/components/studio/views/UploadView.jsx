import React, { useRef, useState, useCallback } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { UploadIcon, FileIcon, TrashIcon, RefreshCwIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon, ChevronRightIcon } from '../Icons';
import ProcessFlowModal from '../ProcessFlowModal';

export default function UploadView() {
  const {
    uploadedFiles,
    addFiles,
    removeFile,
    extractDocuments,
    setActivePhase,
    isLoading,
    gaps,
    traceabilityFlow,
    isFlowModalOpen,
    setIsFlowModalOpen,
    loadSampleData,
  } = useStudio();

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);


  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleExtractAndProceed = async () => {
    await extractDocuments();
    setActivePhase('extract');
  };

  return (
    <div className="view-container">
      {/* Header & Quick Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 className="view-title" style={{ margin: 0 }}>Upload & Extract Documents</h1>
          <p className="view-subtitle" style={{ marginTop: '6px', marginBottom: 0 }}>
            Upload raw engineering documents — BOM spreadsheets, transport manifests, plant utility reports.
            The parser matches components to verified ecoinvent v3.12 datasets and checks compliance gaps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadSampleData}
            disabled={isLoading}
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCwIcon size={14} />
            <span>Load Sample BOM (500RT Chiller)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsFlowModalOpen(true)}
            style={{
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FDF5F0',
              borderColor: '#E8D5C8',
              color: '#B8531D'
            }}
          >
            <span>View Traceability Flow Map</span>
            <span style={{
              backgroundColor: '#B8531D',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              {traceabilityFlow ? traceabilityFlow.nodes?.length || 14 : 'Active'}
            </span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <UploadIcon size={44} className="upload-zone-icon" />
        <div className="upload-zone-title" style={{ fontSize: '16px', fontWeight: 600 }}>
          Drop files here or click to browse
        </div>
        <div className="upload-zone-desc" style={{ fontSize: '13px', color: '#7A6B63' }}>
          Supports ZIP engineering archives, BOM spreadsheets (Excel .xlsx, CSV), utility bills, or JSON declarations
        </div>
        <div className="upload-zone-formats" style={{ marginTop: '12px' }}>
          <span className="format-tag" style={{ backgroundColor: '#EBF3ED', color: '#275234', fontWeight: 600 }}>ZIP ARCHIVE</span>
          <span className="format-tag">XLSX</span>
          <span className="format-tag">CSV</span>
          <span className="format-tag">PDF</span>
          <span className="format-tag">JSON</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".zip,.pdf,.xlsx,.xls,.csv,.json,.xml"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* PCR Compliance & Missing Data Gaps Notification Banner */}
      {gaps && gaps.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: '#FFF8F2',
          border: '1px solid #F5DEC8',
          boxShadow: '0 2px 8px rgba(184, 83, 29, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#D97706', display: 'flex', alignItems: 'center' }}>
                <AlertTriangleIcon size={18} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#8F4A14' }}>
                PCR & ISO 14025 Data Gap Analysis ({gaps.length} Action Items Detected)
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 600
            }}>
              Pre-Calculation Verification Gate
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gaps.map((gap) => (
              <div key={gap.id} style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EED8C5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: gap.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                      color: gap.severity === 'critical' ? '#991B1B' : '#92400E',
                      textTransform: 'uppercase'
                    }}>
                      {gap.severity || 'Notice'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2C221E' }}>
                      {gap.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9C5832', fontWeight: 500 }}>
                      ({gap.module})
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#5C4E46', margin: '4px 0 2px 0' }}>
                    {gap.message}
                  </p>
                  <p style={{ fontSize: '11px', color: '#8A7A72', margin: 0, fontStyle: 'italic' }}>
                    Recommendation: {gap.action}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #D47A47',
                    backgroundColor: '#FFF7ED',
                    color: '#B8531D',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upload File
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files Table / List */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#7A6B63' }}>
              Files queued for ecoinvent v3.12 characterization
            </span>
          </div>

          <div className="file-list">
            {uploadedFiles.map(file => (
              <div key={file.id} className="file-item">
                <div className="file-item-icon">
                  <FileIcon size={16} />
                </div>
                <div className="file-item-info">
                  <div className="file-item-name" style={{ fontWeight: 600 }}>{file.name}</div>
                  <div className="file-item-meta">{formatSize(file.size)}</div>
                </div>
                <span className={`file-item-status ${file.status}`}>
                  {file.status === 'pending' && 'Pending Extraction'}
                  {file.status === 'extracting' && 'Extracting Parameters...'}
                  {file.status === 'done' && 'Extracted & Mapped'}
                  {file.status === 'error' && 'Extraction Warning'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeFile(file.id)}
                  title="Remove file"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleExtractAndProceed}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>{isLoading ? 'Extracting...' : 'Extract & Proceed to Extracted Data'}</span>
              <ChevronRightIcon size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActivePhase('extract')}
            >
              Skip to Extracted Data
            </button>
          </div>
        </div>
      )}

      {/* Interactive Traceability Flow Modal */}
      <ProcessFlowModal
        isOpen={isFlowModalOpen}
        onClose={() => setIsFlowModalOpen(false)}
        traceabilityFlow={traceabilityFlow}
        gaps={gaps}
      />
    </div>
  );
}


