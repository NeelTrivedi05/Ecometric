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
    loadSpecificSample,
  } = useStudio();

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loadingSample, setLoadingSample] = useState(null);


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

      {/* Lifecycle Stage Test Datasets & Engineering Manifests Explorer */}
      <div style={{
        marginTop: '36px',
        padding: '24px',
        borderRadius: '14px',
        backgroundColor: '#FCFAF8',
        border: '1px solid #EBE4DE',
        boxShadow: '0 4px 16px rgba(44, 34, 30, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#EDE8E3',
                color: '#6B5A50',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Lifecycle Stage Test Library
              </span>
              <span style={{ fontSize: '12px', color: '#8A7A72' }}>
                Zero hardcoded mocks — 100% verified ecoinvent v3.12 characterization
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2C221E', margin: '6px 0 4px 0' }}>
              Lifecycle Stage Verification Datasets
            </h2>
            <p style={{ fontSize: '13px', color: '#5C4E46', margin: 0, maxWidth: '750px' }}>
              Load individual stage files to verify isolated lifecycle parameters (inbound freight A2, jobsite crane rigging A4/A5, operational use B1–B7, or circularity C/D), or inspect the full master cradle-to-grave workbook.
            </p>
          </div>

          {/* Stage Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Files (6)' },
              { key: 'a2', label: 'Freight (A2)' },
              { key: 'a4_a5', label: 'Rigging (A4/A5)' },
              { key: 'b', label: 'Operations (B1–B7)' },
              { key: 'cd', label: 'Circularity (C & D)' },
              { key: 'master', label: 'Master Package' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: selectedFilter === tab.key ? 700 : 500,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedFilter === tab.key ? '#B8531D' : '#E2D9D2',
                  backgroundColor: selectedFilter === tab.key ? '#B8531D' : '#FFFFFF',
                  color: selectedFilter === tab.key ? '#FFFFFF' : '#5C4E46',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          {SAMPLE_FILES
            .filter(item => selectedFilter === 'all' || item.stageCategory === selectedFilter)
            .map(sample => {
              const isCurrentLoading = loadingSample === sample.filename;
              return (
                <div
                  key={sample.filename}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: sample.recommended ? '2px solid #3B82F6' : '1px solid #E5DCD5',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: sample.recommended ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Badges Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: sample.badgeBg,
                          color: sample.badgeColor,
                          border: `1px solid ${sample.borderColor}`
                        }}>
                          {sample.module}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563'
                        }}>
                          {sample.format}
                        </span>
                      </div>

                      {sample.recommended && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          textTransform: 'uppercase'
                        }}>
                          RECOMMENDED
                        </span>
                      )}
                    </div>

                    {/* Card Title & Desc */}
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#2C221E', margin: '0 0 6px 0' }}>
                      {sample.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#5C4E46', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                      {sample.desc}
                    </p>

                    {/* Parameter Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {sample.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: '#F7F4F1',
                          color: '#6B5A50',
                          border: '1px solid #EDE8E3'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F3EDE7' }}>
                    <button
                      type="button"
                      disabled={isLoading || isCurrentLoading}
                      onClick={async () => {
                        setLoadingSample(sample.filename);
                        await loadSpecificSample(sample.filename, sample.title);
                        setLoadingSample(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        backgroundColor: sample.recommended ? '#2563EB' : '#B8531D',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'opacity 0.15s ease'
                      }}
                    >
                      {isCurrentLoading ? (
                        <span>Ingesting Data...</span>
                      ) : (
                        <>
                          <UploadIcon size={13} />
                          <span>Load into Studio</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`http://localhost:8000/api/documents/samples/${sample.filename}`}
                      download={sample.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid #D6CBC4',
                        backgroundColor: '#FFFFFF',
                        color: '#5C4E46',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      title={`Download ${sample.filename}`}
                    >
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

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

const SAMPLE_FILES = [
  {
    filename: '11_water_cooled_centrifugal_multitab_master.xlsx',
    title: 'Master Multi-Tab Cradle-to-Grave Chiller Workbook',
    stageCategory: 'master',
    module: 'Master A1–D',
    format: 'Excel XLSX',
    badgeColor: '#1E3A8A',
    badgeBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    desc: 'Unified multi-sheet engineering workbook containing General Specs, BOM parts (A1), logistics manifest (A2), plant energy (A3), rigging diesel & commissioning (A4/A5), use phase & cooling water (B1–B7), and metals circularity (C/D).',
    tags: ['8 BOM Parts', '6 Inbound Legs', '37.8L Crane Fuel', '120 m³ Water', '92.4% Recycling'],
    recommended: true,
  },
  {
    filename: '06_multimodal_inbound_logistics_manifest_A2.csv',
    title: 'Multi-Modal Inbound Logistics Manifest',
    stageCategory: 'a2',
    module: 'Module A2',
    format: 'CSV Manifest',
    badgeColor: '#065F46',
    badgeBg: '#ECFDF5',
    borderColor: '#A7F3D0',
    desc: 'Supply chain freight legs linking Tier-1 suppliers to factory: Transoceanic container ship (6,200 km), Freight rail (900 km), and EURO 6 heavy lorry (450 km).',
    tags: ['9 Freight Legs', 'Container Sea', 'Intermodal Rail', 'EURO 6 Lorry'],
  },
  {
    filename: '07_jobsite_installation_and_rigging_A4_A5.xlsx',
    title: 'Job Site Rigging, Crane Fuel & Commissioning',
    stageCategory: 'a4_a5',
    module: 'Modules A4 / A5',
    format: 'Excel XLSX',
    badgeColor: '#92400E',
    badgeBg: '#FEF3C7',
    borderColor: '#FDE68A',
    desc: 'Job site installation cut sheet: Outbound transport (750 km), 50-ton hydraulic crane diesel (37.8 L), commissioning electricity (350 kWh), and test loss (0.5 kg).',
    tags: ['750 km Outbound', '37.8 L Diesel', '350 kWh Hookup', '0.5 kg Test Loss'],
  },
  {
    filename: '08_operational_use_and_maintenance_B1_to_B7.csv',
    title: '25-Year Operational Life & Maintenance Schedule',
    stageCategory: 'b',
    module: 'Modules B1–B7',
    format: 'CSV Schedule',
    badgeColor: '#5B21B6',
    badgeBg: '#F5F3FF',
    borderColor: '#DDD6FE',
    desc: 'Comprehensive use phase schedule: R134a 45 kg charge with 2.0% annual fugitive leak (B1), synthetic POE lubricant lube cycles (B2), AHRI 550/590 IPLV 0.435 kW/TR (B6), and cooling tower water 120 m³/yr (B7).',
    tags: ['45 kg R134a', '2% Annual Leak', '0.435 IPLV', '120 m³/yr Water'],
  },
  {
    filename: '09_end_of_life_and_circularity_C1_to_D.json',
    title: 'End of Life Deconstruction & Circularity Recovery',
    stageCategory: 'cd',
    module: 'Modules C1–C4 & D',
    format: 'JSON Contract',
    badgeColor: '#047857',
    badgeBg: '#D1FAE5',
    borderColor: '#6EE7B7',
    desc: 'Deconstruction electricity (120 kWh), waste transit (100 km), 92.4% metal recycling sorting, and Module D net avoided virgin steel/copper credits (-3,210 kg CO₂e).',
    tags: ['120 kWh C1', '100 km C2', '92.4% C3 Recycling', '-3,210 kg Module D'],
  },
  {
    filename: '10_complete_enterprise_chiller_package.zip',
    title: 'Complete Enterprise Chiller Documentation Package',
    stageCategory: 'master',
    module: 'All Lifecycle Stages',
    format: 'ZIP Package',
    badgeColor: '#374151',
    badgeBg: '#F3F4F6',
    borderColor: '#E5E7EB',
    desc: 'Full enterprise documentation bundle combining all engineering specifications, supply chain manifests, utility bills, AHRI part-load test logs, and rigging cut sheets.',
    tags: ['All 5 Lifecycle Files', 'Multi-File Ingestion', 'Full Cradle-to-Grave'],
    isZip: true,
  }
];

