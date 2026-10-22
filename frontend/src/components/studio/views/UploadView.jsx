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
  DropletIcon,
  SnowflakeIcon,
  ThermalIcon,
  CheckIcon,
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
  const [loadingPresetKey, setLoadingPresetKey] = useState(null);

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

  const totalSize = uploadedFiles.reduce((total, file) => total + (file.size || 0), 0);
  const completedSize = uploadedFiles
    .filter((file) => file.status === 'done')
    .reduce((total, file) => total + (file.size || 0), 0);

  const handleExtractAndProceed = async () => {
    await extractDocuments();
    setActivePhase('extract');
  };

  const handleSelectPreset = async (key) => {
    setLoadingPresetKey(key);
    try {
      await loadPreset(key);
    } finally {
      setLoadingPresetKey(null);
    }
  };

  const formatRefrigerant = (refrig) => {
    if (!refrig) return 'None';
    const clean = refrig.trim();
    if (clean.toLowerCase().startsWith('not') || clean.toLowerCase().startsWith('none') || clean.includes('0 kg')) {
      return 'None';
    }
    return clean.split(' ')[0];
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
            The automated engine parses component masses, links them to verified ecoinvent v3.12 activities, and audits UL 10010-4 Part B v2.0 &amp; EN 15804+A2 completeness.
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
            <span className="gallery-desc">Pre-configured engineering models compliant with UL 10010-4 Part B v2.0, EN 15804+A2, and ecoinvent v3.12</span>
          </div>
          <span className="gallery-pill-tag">4 Models Available</span>
        </div>

        <div className="benchmark-card-grid">
          {Object.entries(PRESET_DATASETS || {}).map(([key, item]) => {
            const isSelected = currentPresetId === key;
            const isCurrentLoading = loadingPresetKey === key;

            return (
              <div
                key={key}
                className={`benchmark-card ${isSelected ? 'active-benchmark' : ''}`}
                onClick={() => handleSelectPreset(key)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="card-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="card-equipment-glyph">
                      {key === 'screw_chiller_300rt' ? <SnowflakeIcon size={18} style={{ color: 'var(--accent, #1f7a4c)' }} /> :
                       key === 'heat_pump_150rt' ? <ThermalIcon size={18} style={{ color: '#d97706' }} /> :
                       key === 'incomplete_gap_analysis' ? <AlertTriangleIcon size={18} style={{ color: '#dc2626' }} /> :
                       <DropletIcon size={18} style={{ color: 'var(--accent, #1f7a4c)' }} />}
                    </span>
                    {isSelected && (
                      <span className="card-active-pill">
                        <span className="card-active-dot" /> Active
                      </span>
                    )}
                  </div>
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
                  <div className="card-spec-item" title={`Refrigerant: ${item.refrigerant}`}>
                    <span className="spec-label">Refrigerant</span>
                    <span className="spec-value">{formatRefrigerant(item.refrigerant)}</span>
                  </div>
                </div>

                <div className="card-action-row">
                  <button
                    type="button"
                    className={`btn-card-load ${isSelected ? 'is-selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(key);
                    }}
                    disabled={isLoading || isCurrentLoading}
                  >
                    {isCurrentLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCwIcon size={12} className="spin" /> Loading Model...
                      </span>
                    ) : isSelected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <CheckIcon size={12} /> Loaded in Workspace
                      </span>
                    ) : (
                      <span>Load Benchmark →</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        className={`apple-upload-zone file-manager-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="upload-icon-circle">
          <UploadIcon size={26} style={{ color: 'var(--accent, #1f7a4c)' }} />
        </div>

        <div className="upload-zone-title">Drop files here or click to browse</div>

        <div className="upload-zone-desc">Up to 2 GB per file. Supports spreadsheets, technical PDFs, JSON payloads, and archives.</div>

        <div className="upload-zone-formats">
          <span className="apple-chip-format" title="Multi-tab Excel workbooks (BOM, Transport, Utilities, EOL)">
            <span className="chip-ext">.XLSX / .XLS</span>
            <span className="chip-desc">Workbooks</span>
          </span>
          <span className="apple-chip-format" title="Comma / tab separated parts lists, freight manifests, and utility logs">
            <span className="chip-ext">.CSV / .TSV</span>
            <span className="chip-desc">Manifests</span>
          </span>
          <span className="apple-chip-format" title="Vector technical cutsheets, nameplate ratings, and equipment specs">
            <span className="chip-ext">.PDF</span>
            <span className="chip-desc">Cutsheets</span>
          </span>
          <span className="apple-chip-format" title="Standard and flexible customer LCA JSON schemas">
            <span className="chip-ext">.JSON</span>
            <span className="chip-desc">LCA Payloads</span>
          </span>
          <span className="apple-chip-format" title="Nested archives automatically unzipped and batch ingested">
            <span className="chip-ext">.ZIP</span>
            <span className="chip-desc">Archives</span>
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf,.json,.zip"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Uploaded Documents Queue */}
      {uploadedFiles.length > 0 && (
        <div className="file-manager-card">
          <div className="file-manager-header">
            <div>
              <span className="file-manager-eyebrow">Document workspace</span>
              <h3>Engineering files <span>{uploadedFiles.length}</span></h3>
              <p>Track ingestion progress before matching data to ecoinvent v3.12 activities.</p>
            </div>
            <button type="button" className="btn-apple-secondary-pill" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon size={14} />
              Add files
            </button>
          </div>

          <div className="file-manager-list">
            {uploadedFiles.map((file) => {
              const isExtracted = file.status === 'done';
              const isParsing = file.status === 'extracting';
              const progress = isExtracted ? 100 : isParsing ? 62 : 0;
              const scope = file.name.includes('A2') ? 'A2 Inbound Transport' :
                file.name.includes('A4') ? 'A4/A5 Jobsite Logistics' :
                file.name.includes('B1') ? 'B1–B7 Operational Use' :
                file.name.includes('C1') ? 'C1–D End of Life' :
                'A1 Raw Material BOM';

              return (
                <div className="file-manager-row" key={file.id}>
                  <div className="file-manager-icon"><FileIcon size={19} /></div>
                  <div className="file-manager-main">
                    <div className="file-manager-name-line">
                      <strong title={file.name}>{file.name}</strong>
                      <span>{formatSize(file.size)}</span>
                    </div>
                    <div className="file-manager-meta">
                      <span>{file.type?.toUpperCase() || 'DOCUMENT'}</span>
                      <span>{scope}</span>
                    </div>
                    <div className="file-manager-progress-row">
                      <div className="file-manager-progress">
                        <span style={{ width: `${progress}%` }} className={isParsing ? 'is-loading' : ''} />
                      </div>
                      <small>{isExtracted ? 'Uploaded' : isParsing ? `${progress}%` : 'Waiting'}</small>
                    </div>
                  </div>
                  <div className={`file-manager-status ${isExtracted ? 'is-done' : isParsing ? 'is-parsing' : ''}`}>
                    {isExtracted ? <CheckCircleIcon size={14} /> : isParsing ? <RefreshCwIcon size={14} className="spin" /> : null}
                    <span>{isExtracted ? 'Extracted' : isParsing ? 'Parsing' : 'Ready'}</span>
                  </div>
                  <button
                    type="button"
                    className="file-manager-remove"
                    onClick={() => removeFile(file.id)}
                    title={`Remove ${file.name}`}
                    aria-label={`Remove ${file.name}`}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="file-manager-footer">
            <span><CheckCircleIcon size={14} /> {formatSize(completedSize)} of {formatSize(totalSize)} transferred</span>
            <button type="button" className="btn-apple-primary-pill" onClick={handleExtractAndProceed} disabled={isLoading}>
              <span>{isLoading ? 'Parsing engineering data...' : 'Extract & analyze inventory'}</span>
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
