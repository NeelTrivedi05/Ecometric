import React, { useState } from 'react';
import { CloseIcon, FileIcon, ChevronRightIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon } from './Icons';

export default function ProcessFlowModal({ isOpen, onClose, traceabilityFlow, gaps = [] }) {
  if (!isOpen) return null;

  const [selectedStage, setSelectedStage] = useState('all');

  const nodes = traceabilityFlow?.nodes || [
    { id: 'doc-1', type: 'document', label: 'Product_BOM_Manifest.xlsx', desc: 'Assembly Bill of Materials' },
    { id: 'doc-2', type: 'document', label: 'Factory_Energy_Audit.pdf', desc: 'Energy & Nameplate Specifications' },
    { id: 'param-steel', type: 'parameter', label: 'Steel & Casting (2,100 kg)', module: 'A1' },
    { id: 'param-copper', type: 'parameter', label: 'Copper Tubing (650 kg)', module: 'A1' },
    { id: 'param-motor', type: 'parameter', label: 'Compressor Motor (450 kg)', module: 'A1' },
    { id: 'param-freight', type: 'parameter', label: 'Inbound Freight (485 km avg)', module: 'A2' },
    { id: 'param-elec', type: 'parameter', label: 'Factory Electricity (34,000 kWh)', module: 'A3' },
    { id: 'param-ref', type: 'parameter', label: 'R134a Charge (45 kg, 2% leak)', module: 'B1-B2' },
    { id: 'param-eol', type: 'parameter', label: 'Steel & Copper Recovery (92.4%)', module: 'C & D' },
    { id: 'stage-a1', type: 'stage', label: 'Module A1: Raw Materials' },
    { id: 'stage-a2', type: 'stage', label: 'Module A2: Transport' },
    { id: 'stage-a3', type: 'stage', label: 'Module A3: Manufacturing' },
    { id: 'stage-b', type: 'stage', label: 'Module B: Operational Use' },
    { id: 'stage-cd', type: 'stage', label: 'Module C & D: Circularity' },
  ];

  const docs = nodes.filter(n => n.type === 'document');
  const params = nodes.filter(n => n.type === 'parameter');
  const stages = [
    { id: 'A1', label: 'Module A1', title: 'Raw Material Supply', count: 3 },
    { id: 'A2', label: 'Module A2', title: 'Transport to Factory', count: 1 },
    { id: 'A3', label: 'Module A3', title: 'Assembly & Manufacturing', count: 1 },
    { id: 'B1-B2', label: 'Module B', title: 'Operational Use Phase', count: 1 },
    { id: 'C & D', label: 'Module C/D', title: 'End-of-Life & Circularity', count: 1 },
  ];

  const filteredParams = selectedStage === 'all' 
    ? params 
    : params.filter(p => p.module === selectedStage);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(44, 30, 24, 0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div className="modal-container" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px -12px rgba(92, 60, 40, 0.18)',
        border: '1px solid #F0E6DD',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F2E8DF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FCFAF8'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#FAF0E6',
                color: '#9C5832',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>ISO 14025 Data Lineage</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2C221E', margin: 0 }}>
                End-to-End Traceability Flow Map
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#7A6B63', marginTop: '4px', margin: 0 }}>
              Visual audit map tracing each uploaded document to its extracted engineering parameters and assigned LCA modules.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#8A7A72',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Modal Filter Tabs */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid #F2E8DF',
          display: 'flex',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setSelectedStage('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedStage === 'all' ? '#D47A47' : '#E8DDD4',
              backgroundColor: selectedStage === 'all' ? '#FDF5F0' : '#FFFFFF',
              color: selectedStage === 'all' ? '#C25A23' : '#6A584F',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Life Cycle Stages ({params.length})
          </button>
          {stages.map(stg => (
            <button
              key={stg.id}
              onClick={() => setSelectedStage(stg.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: selectedStage === stg.id ? '#D47A47' : '#E8DDD4',
                backgroundColor: selectedStage === stg.id ? '#FDF5F0' : '#FFFFFF',
                color: selectedStage === stg.id ? '#C25A23' : '#6A584F',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {stg.label} ({stg.title})
            </button>
          ))}
        </div>

        {/* Modal Body: Flow Columns */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          backgroundColor: '#FAF7F4'
        }}>
          {/* Column 1: Ingested Source Documents */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
              1. Source Documents ({docs.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {docs.map(doc => (
                <div key={doc.id} style={{
                  padding: '14px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #EBE2D8',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#FAF0E6',
                      color: '#C25A23',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileIcon size={16} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E', wordBreak: 'break-all' }}>
                      {doc.label}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A7A72', paddingLeft: '36px' }}>
                    {doc.desc}
                  </div>
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#2E7D32',
                    paddingLeft: '36px'
                  }}>
                    <CheckCircleIcon size={13} />
                    <span>Parsed & Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Extracted Engineering Parameters */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
              2. Extracted Attributes ({filteredParams.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredParams.map(param => (
                <div key={param.id} style={{
                  padding: '12px 14px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #EBE2D8',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2C221E' }}>
                      {param.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9C5832', marginTop: '2px', fontWeight: 500 }}>
                      Assigned to {param.module}
                    </div>
                  </div>
                  <ChevronRightIcon size={16} color="#B0A299" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Lifecycle Stage Aggregation */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#8A7A72', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
              3. EN 15804+A2 Modules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stages.map(stg => (
                <div key={stg.id} style={{
                  padding: '14px',
                  backgroundColor: selectedStage === stg.id || selectedStage === 'all' ? '#FFFFFF' : '#F5EFEA',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: selectedStage === stg.id ? '#D47A47' : '#EBE2D8',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#2C221E' }}>
                      {stg.label}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#FAF0E6',
                      color: '#C25A23',
                      fontWeight: 600
                    }}>
                      {stg.count} parameters
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#7A6B63', marginTop: '4px' }}>
                    {stg.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F2E8DF',
          backgroundColor: '#FCFAF8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7A6B63' }}>
            <InfoIcon size={15} />
            <span>Audit trail cryptographically hashed for Third-Party Verifier review.</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Close Flow Map
          </button>
        </div>
      </div>
    </div>
  );
}
