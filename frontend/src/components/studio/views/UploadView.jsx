import React, { useRef, useState, useCallback } from 'react';
import { useStudio } from '../../../context/StudioContext';
import {
  UploadIcon,
  FileIcon,
  TrashIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  ChevronRightIcon,
  LayersIcon,
} from '../Icons';
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
    loadPreset,
    currentPresetId,
    PRESET_DATASETS,
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
      <div className="apple-view-header">
        <div>
          <span className="apple-eyebrow">Phase 1 • Document Ingestion</span>
          <h1 className="view-title">Upload & Ingest Chiller Engineering Documents</h1>
          <p className="view-subtitle">
            Upload raw engineering files (BOM spreadsheets, freight manifests, plant utility submetering, and equipment cut sheets).
            The engine parses component masses, links them to verified ecoinvent v3.12 activities, and audits UL 10010-4 completeness.
          </p>
        </div>

        <div className="apple-header-action-group">
          <button
            type="button"
            className="btn-apple-secondary-pill"
            onClick={() => setIsFlowModalOpen(true)}
            title="Inspect Process Supply Chain Entanglement Flow"
          >
            <LayersIcon size={14} />
            <span>Traceability Flow Map</span>
            <span className="apple-pill-counter">
              {traceabilityFlow?.nodes?.length || 14}
            </span>
          </button>
        </div>
      </div>

      {/* Preset Chiller Benchmark Models Gallery (Apple Store Utility Card Grid) */}
      <div className="apple-benchmark-gallery">
        <div className="gallery-header-row">
          <div className="gallery-title-group">
            <span className="gallery-title">Verified Equipment Benchmarks</span>
            <span className="gallery-desc">Instant 1-click loading of UL 10010-4 / EN 15804+A2 test fixtures from test/ suite</span>
          </div>
          <span className="gallery-pill-tag">4 Models Available</span>
        </div>

        <div className="benchmark-card-grid">
          {Object.entries(PRESET_DATASETS || {}).map(([key, item]) => {
            const isSelected = currentPresetId === key;
            return (
              <div
                key={key}
                className={`benchmark-card ${isSelected ? 'active-benchmark' : ''}`}
                onClick={() => loadPreset(key)}
                role="button"
                tabIndex={0}
              >
                <div className="card-top-row">
                  <span className="card-equipment-glyph">
                    {key === 'screw_chiller_300rt' ? '❄️' :
                     key === 'heat_pump_150rt' ? '♨️' :
                     key === 'incomplete_gap_analysis' ? '⚠️' : '💧'}
                  </span>
                  <span
                    className="card-badge"
                    style={{ color: item.badgeColor, backgroundColor: `${item.badgeColor}15` }}
                  >
                    {item.badge}
                  </span>
                </div>

                <div className="card-title">{item.title}</div>
                <div className="card-subtitle">{item.subtitle}</div>

                <div className="card-specs-row">
                  <div className="card-spec-item">
                    <span className="spec-label">Capacity</span>
                    <span className="spec-value">{Math.round(item.capacityRt)} RT</span>
                  </div>
                  <div className="card-spec-item">
                    <span className="spec-label">Mass</span>
                    <span className="spec-value">{item.totalMassKg} kg</span>
                  </div>
                  <div className="card-spec-item">
                    <span className="spec-label">Refrigerant</span>
                    <span className="spec-value">{item.refrigerant.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="card-action-row">
                  <button
                    type="button"
                    className={`btn-card-load ${isSelected ? 'is-selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      loadPreset(key);
                    }}
                    disabled={isLoading}
                  >
                    {isSelected ? '✓ Loaded in Workspace' : 'Load Benchmark →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`apple-upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="upload-icon-circle">
          <UploadIcon size={26} style={{ color: '#0066cc' }} />
        </div>

        <div className="upload-zone-title">
          Drop engineering files here, or click to browse
        </div>

        <div className="upload-zone-desc">
          Supports BOM spreadsheets (Excel .xlsx, CSV), technical cutsheets (vector PDF), multimodal manifests, or complete ZIP packages
        </div>

        <div className="upload-zone-formats">
          <span className="apple-chip-format">.XLSX</span>
          <span className="apple-chip-format">.CSV</span>
          <span className="apple-chip-format">.PDF</span>
          <span className="apple-chip-format">.JSON</span>
          <span className="apple-chip-format">.ZIP</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.pdf,.json,.zip"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Uploaded Documents Queue */}
      {uploadedFiles.length > 0 && (
        <div className="apple-card" style={{ marginTop: '24px' }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-heading-title">Ingested Document Queue ({uploadedFiles.length})</h3>
              <p className="card-heading-sub">Files queued for parsing and ecoinvent v3.12 activity matching</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-apple-secondary-pill"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add More Files
              </button>
            </div>
          </div>

          <div className="apple-files-table-container">
            <table className="apple-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Document Name</th>
                  <th style={{ width: '15%' }}>Size</th>
                  <th style={{ width: '20%' }}>Lifecycle Scope</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="file-name-cell">
                        <span className="file-type-pill">{file.type?.toUpperCase() || 'DOC'}</span>
                        <span className="file-name-text" title={file.name}>{file.name}</span>
                      </div>
                    </td>
                    <td className="num-font">{formatSize(file.size)}</td>
                    <td>
                      <span className="scope-tag">
                        {file.name.includes('A2') ? 'A2 Inbound Transport' :
                         file.name.includes('A4') ? 'A4/A5 Jobsite Logistics' :
                         file.name.includes('B1') ? 'B1–B7 Operational Use' :
                         file.name.includes('C1') ? 'C1–D End of Life' :
                         'A1 Raw Material BOM'}
                      </span>
                    </td>
                    <td>
                      {file.status === 'done' ? (
                        <span className="status-chip success">
                          <CheckCircleIcon size={12} />
                          <span>Extracted</span>
                        </span>
                      ) : file.status === 'extracting' ? (
                        <span className="status-chip pending">
                          <RefreshCwIcon size={12} className="spin" />
                          <span>Parsing...</span>
                        </span>
                      ) : (
                        <span className="status-chip neutral">Ready</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-icon-trash"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        title="Remove Document"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="card-footer-action-row">
            <button
              type="button"
              className="btn-apple-primary-pill"
              onClick={handleExtractAndProceed}
              disabled={isLoading}
            >
              <span>{isLoading ? 'Parsing Engineering Data...' : 'Extract & Analyze Lifecycle Inventory'}</span>
              <ChevronRightIcon size={15} />
            </button>
          </div>
        </div>
      )}

      {/* PCR Completeness Gap Audit Banner if gaps detected */}
      {gaps.length > 0 && (
        <div className="apple-gap-card" style={{ marginTop: '24px' }}>
          <div className="gap-card-top">
            <div className="gap-icon-wrap">
              <AlertTriangleIcon size={18} style={{ color: '#ff9f0a' }} />
            </div>
            <div>
              <div className="gap-title">PCR Gap Warning: {gaps.length} Requirement(s) Detected</div>
              <div className="gap-desc">
                The engine checked the active inventory against UL 10010-4 Part B v2.0 cut-off & reporting requirements.
              </div>
            </div>
          </div>

          <div className="gap-items-list">
            {gaps.map((gap, idx) => (
              <div key={gap.id || idx} className="gap-item-row">
                <span className="gap-module-tag">{gap.module || 'PCR'}</span>
                <div className="gap-item-content">
                  <div className="gap-item-title">{gap.title}</div>
                  <div className="gap-item-msg">{gap.message}</div>
                </div>
                {gap.action && <div className="gap-item-action">{gap.action}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traceability Flow Map Modal */}
      {isFlowModalOpen && (
        <ProcessFlowModal
          isOpen={isFlowModalOpen}
          onClose={() => setIsFlowModalOpen(false)}
        />
      )}
    </div>
  );
}
