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
import { PRODUCT_LIST } from '../../../data/products';

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
    productCategory,
    selectProduct,
    productProfile,
  } = useStudio();
  const hasProduct = Boolean(productCategory);
  const product = hasProduct ? productProfile : null;

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingPresetKey, setLoadingPresetKey] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (hasProduct && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles, hasProduct]);

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
          <h1 className="view-title">
            {product ? `Upload & Ingest ${product.name} Documents` : 'Select Your Product, Then Upload Documents'}
          </h1>
          <p className="view-subtitle">
            Choose the product first so the right PCR, functional unit and life-cycle rules are applied. Then upload raw files
            (BOM spreadsheets, freight manifests, plant utility data, specification sheets). The engine reads component masses,
            matches each material to the best ecoinvent v3.12 dataset by name, and audits {product ? product.pcrShort : 'PCR'} completeness.
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

      {/* Step 1: Product selection (required before upload) */}
      <div className="apple-benchmark-gallery">
        <div className="gallery-header-row">
          <div className="gallery-title-group">
            <span className="gallery-title">Step 1 · Select the product for this EPD</span>
            <span className="gallery-desc">
              Each product has its own PCR, functional unit, life-cycle stages and ecoinvent material mapping.
            </span>
          </div>
          <span className="gallery-pill-tag">
            {product ? `Selected: ${product.name}` : `${PRODUCT_LIST.length} products available`}
          </span>
        </div>

        <div className="benchmark-card-grid">
          {PRODUCT_LIST.map((item) => {
            const isSelected = productCategory === item.id;
            return (
              <div
                key={item.id}
                className={`benchmark-card ${isSelected ? 'active-benchmark' : ''}`}
                onClick={() => selectProduct(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectProduct(item.id); }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="card-top-row">
                  <span className="card-equipment-glyph" aria-hidden="true">{item.icon}</span>
                  <span className="card-badge" style={{ color: '#0066cc', backgroundColor: '#0066cc15' }}>
                    {item.pcrShort}
                  </span>
                </div>
                <div className="card-title">{item.name}</div>
                <div className="card-subtitle">{item.examples}</div>
                <div className="card-specs-row">
                  <div className="card-spec-item">
                    <span className="spec-label">Unit</span>
                    <span className="spec-value">{item.fuShort}</span>
                  </div>
                  <div className="card-spec-item">
                    <span className="spec-label">Use stage</span>
                    <span className="spec-value">
                      {item.useStage.refrigerant ? 'Refrigerant + energy' : item.useStage.b6 === 'none' ? 'Not modelled' : 'Declared use'}
                    </span>
                  </div>
                </div>
                <div className="card-action-row">
                  <button
                    type="button"
                    className={`btn-card-load ${isSelected ? 'is-selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); selectProduct(item.id); }}
                    disabled={isLoading}
                  >
                    {isSelected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckIcon size={12} /> Selected
                      </span>
                    ) : 'Select →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Chiller Benchmark Models Gallery (chiller only) */}
      {product?.isChiller && (
      <div className="apple-benchmark-gallery">
        <div className="gallery-header-row">
          <div className="gallery-title-group">
            <span className="gallery-title">Verified Equipment Benchmarks</span>
            <span className="gallery-desc">Pre-configured engineering models compliant with UL 10010-4 Part B v2.0, EN 15804+A2, and ecoinvent v3.12</span>
          </div>
          <span className="gallery-pill-tag">{Object.keys(PRESET_DATASETS || {}).length} Models Available</span>
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
      )}

      {/* Upload Dropzone (enabled once a product is selected) */}
      <div
        className={`apple-upload-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => hasProduct && fileInputRef.current?.click()}
        style={{ cursor: hasProduct ? 'pointer' : 'not-allowed', opacity: hasProduct ? 1 : 0.5 }}
        aria-disabled={!hasProduct}
      >
        <div className="upload-icon-circle">
          <UploadIcon size={26} style={{ color: 'var(--accent, #1f7a4c)' }} />
        </div>

        <div className="upload-zone-title">
          {hasProduct ? `Step 2 · Drop ${product.name} files here, or click to browse` : 'Select a product above to enable upload'}
        </div>

        <div className="upload-zone-desc">
          {hasProduct
            ? `Expected: ${product.bomHint} Also accepted: freight manifests, utility data, spec sheets, ZIP packages.`
            : 'Supports BOM spreadsheets (Excel .xlsx, CSV), specification sheets (PDF), manifests, or complete ZIP packages'}
        </div>

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
              disabled={isLoading || !hasProduct}
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
                The engine checked the active inventory against {productProfile.pcrLabel} cut-off & reporting requirements.
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
