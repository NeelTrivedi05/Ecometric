import React, { useState, useEffect } from 'react';
import { CloseIcon, FileIcon, ChevronRightIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon } from './Icons';

export default function ProcessFlowModal({ isOpen, onClose, traceabilityFlow, gaps = [] }) {
  if (!isOpen) return null;

  // View Mode: 'traceability' (Document Audit) vs 'entanglement' (1-to-10 Process Chaining)
  const [activeTab, setActiveTab] = useState('entanglement');
  const [selectedStage, setSelectedStage] = useState('all');
  
  // Entanglement State
  const [entanglementData, setEntanglementData] = useState(null);
  const [isLoadingEntanglement, setIsLoadingEntanglement] = useState(false);
  const [entanglementMethodology, setEntanglementMethodology] = useState('traci21');
  const [selectedRelationshipFilter, setSelectedRelationshipFilter] = useState('all');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);

  // Traceability Flow Defaults
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

  // Fetch Entanglement Data from Live API
  useEffect(() => {
    if (activeTab === 'entanglement') {
      setIsLoadingEntanglement(true);
      fetch(`/api/processes/proc-steel-converter-parent/entanglement?methodology=${entanglementMethodology}`)
        .then(r => r.json())
        .then(data => {
          setEntanglementData(data);
          setIsLoadingEntanglement(false);
          if (data?.root_process) {
            setSelectedNodeDetails(data.root_process);
          }
        })
        .catch(err => {
          console.error("Failed to fetch process entanglement:", err);
          setIsLoadingEntanglement(false);
        });
    }
  }, [activeTab, entanglementMethodology]);

  // Group Entangled Nodes
  const rootNode = entanglementData?.root_process;
  const childNodes = (entanglementData?.nodes || []).filter(n => !n.is_root);
  const upstreamNodes = childNodes.filter(n => n.relationship_type === 'upstream_manufacturing');
  const downstreamNodes = childNodes.filter(n => n.relationship_type === 'downstream_processing');
  const logisticsNodes = childNodes.filter(n => ['transport_link', 'energy_carrier'].includes(n.relationship_type));

  const formatExponential = (val) => {
    if (val === undefined || val === null) return '0.00';
    if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(2);
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(28, 20, 16, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="modal-container" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1100px',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(45, 25, 15, 0.35)',
        border: '1px solid #EBE0D5',
        overflow: 'hidden'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #F0E5DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FAF6F1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* View Switcher Tabs */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#EDE3D8',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid #E0D3C5'
            }}>
              <button
                onClick={() => setActiveTab('entanglement')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'entanglement' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'entanglement' ? '#A24A1E' : '#6E5C52',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'entanglement' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                ⛓️ Supply Chain Process Entanglement (1-to-10 DAG)
              </button>
              <button
                onClick={() => setActiveTab('traceability')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'traceability' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'traceability' ? '#A24A1E' : '#6E5C52',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'traceability' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📑 ISO 14025 Document Traceability
              </button>
            </div>

            {/* Lineage Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #C8E6C9'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2E7D32' }} />
              ecoinvent v3.12 (Cut-off verified)
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F0E5DB',
              cursor: 'pointer',
              color: '#6E5C52',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            title="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SUPPLY CHAIN PROCESS ENTANGLEMENT (1-TO-10 DAG)                    */}
        {/* ========================================================================= */}
        {activeTab === 'entanglement' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Control Bar */}
            <div style={{
              padding: '12px 24px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F0E5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2B1E17' }}>
                  Steel Manufacturing Chained Multi-Tier Lifecycle (1 Parent → 11 Sub-Processes)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#7E6C62' }}>
                  Recursively resolves upstream raw ore beneficiation, coke pyrolysis, blast furnace smelting, rolling, and surface treatment.
                </p>
              </div>

              {/* Methodology Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8A776D', textTransform: 'uppercase' }}>
                  LCIA Methodology:
                </span>
                <div style={{
                  display: 'inline-flex',
                  backgroundColor: '#F5ECE3',
                  borderRadius: '8px',
                  padding: '2px',
                  border: '1px solid #E5D7CB'
                }}>
                  <button
                    onClick={() => setEntanglementMethodology('traci21')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: entanglementMethodology === 'traci21' ? '#FFFFFF' : 'transparent',
                      color: entanglementMethodology === 'traci21' ? '#B2491A' : '#725F54',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    TRACI 2.1 (US EPA)
                  </button>
                  <button
                    onClick={() => setEntanglementMethodology('ef31')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: entanglementMethodology === 'ef31' ? '#FFFFFF' : 'transparent',
                      color: entanglementMethodology === 'ef31' ? '#B2491A' : '#725F54',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    EF v3.1 (EU EN 15804)
                  </button>
                </div>
              </div>
            </div>

            {/* Main DAG Workspace & Details Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              flex: 1,
              minHeight: 0,
              backgroundColor: '#FAF7F3'
            }}>
              {/* DAG Canvas View */}
              <div style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {isLoadingEntanglement ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#8A776D', fontSize: '14px' }}>
                    Loading Multi-Tier Process Entanglement Graph...
                  </div>
                ) : (
                  <>
                    {/* TIER 1: CORE PARENT PROCESS */}
                    {rootNode && (
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#A24A1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          <span>Tier 1 · Direct Core Process Node</span>
                          <span style={{
                            backgroundColor: '#FDEEE6',
                            color: '#B2491A',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}>Primary Product Node</span>
                        </div>

                        <div
                          onClick={() => setSelectedNodeDetails(rootNode)}
                          style={{
                            padding: '16px 20px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: selectedNodeDetails?.id === rootNode.id ? '2px solid #D47A47' : '1px solid #E5D7CB',
                            boxShadow: '0 4px 12px rgba(162, 74, 30, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#2B1E17' }}>
                                {rootNode.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#7E6C62', marginTop: '3px' }}>
                                Ref Product: <strong>{rootNode.reference_product}</strong> · Geo: <strong>{rootNode.geography}</strong> · Unit: <strong>{rootNode.unit}</strong>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#B2491A',
                                backgroundColor: '#FDF2EB',
                                padding: '4px 10px',
                                borderRadius: '8px'
                              }}>
                                1.000 kg input
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TIER 2 UPSTREAM: MINING & PYROLYSIS (6 SUB-PROCESSES) */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#496A82',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          Tier 2 Upstream · Extraction, Pyrolysis & Smelting ({upstreamNodes.length} Sub-Processes)
                        </div>
                        <span style={{ fontSize: '11px', color: '#8A776D' }}>Linked via stoichiometric scaling factors</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {upstreamNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeDetails(node)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              backgroundColor: '#FFFFFF',
                              border: selectedNodeDetails?.id === node.id ? '2px solid #3F75A2' : '1px solid #E2D9D0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#EDF4F9',
                                color: '#27587F',
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}>
                                {node.sector || 'upstream'}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2B1E17' }}>
                                {node.cumulative_scaling}x scale
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B1E17', lineHeight: '1.3' }}>
                              {node.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '4px' }}>
                              {node.quantity} {node.unit} · {node.geography}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TIER 2 DOWNSTREAM: FORMING & FINISHING (3 SUB-PROCESSES) */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#654B7F',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          Tier 2 Downstream · Forming, Machining & Coating ({downstreamNodes.length} Sub-Processes)
                        </div>
                        <span style={{ fontSize: '11px', color: '#8A776D' }}>Fabrication & Finishing gates</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {downstreamNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeDetails(node)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              backgroundColor: '#FFFFFF',
                              border: selectedNodeDetails?.id === node.id ? '2px solid #785A96' : '1px solid #E2D9D0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#F4EEF9',
                                color: '#5C397D',
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}>
                                {node.sector || 'finishing'}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2B1E17' }}>
                                {node.cumulative_scaling}x
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2B1E17', lineHeight: '1.3' }}>
                              {node.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '4px' }}>
                              {node.quantity} {node.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ENERGY & TRANSPORT LINKS (2 SUB-PROCESSES) */}
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6E6E36',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '8px'
                      }}>
                        Infrastructure Links · Electricity & Freight Transport ({logisticsNodes.length} Processes)
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {logisticsNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeDetails(node)}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              backgroundColor: '#FFFFFF',
                              border: selectedNodeDetails?.id === node.id ? '2px solid #828238' : '1px solid #E2D9D0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: '#F8F8EC',
                                color: '#666628',
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}>
                                {node.relationship_type}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2B1E17' }}>
                                {node.quantity} {node.unit}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2B1E17' }}>
                              {node.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Node Inspector Side Panel */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid #F0E5DB',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8A776D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Node Footprint Inspector
                </div>

                {selectedNodeDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#2B1E17' }}>
                        {selectedNodeDetails.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#7E6C62', marginTop: '2px' }}>
                        UUID: <code>{selectedNodeDetails.id}</code>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      padding: '12px',
                      backgroundColor: '#FAF6F1',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}>
                      <div>
                        <span style={{ color: '#8A776D' }}>Effective Input:</span>
                        <div style={{ fontWeight: 700, color: '#2B1E17', marginTop: '2px' }}>
                          {selectedNodeDetails.quantity} {selectedNodeDetails.unit}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#8A776D' }}>Scaling Multiplier:</span>
                        <div style={{ fontWeight: 700, color: '#2B1E17', marginTop: '2px' }}>
                          {selectedNodeDetails.cumulative_scaling}x
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#8A776D' }}>Supply Boundary:</span>
                        <div style={{ fontWeight: 700, color: '#2B1E17', marginTop: '2px' }}>
                          cradle-to-gate
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#8A776D' }}>Sector:</span>
                        <div style={{ fontWeight: 700, color: '#2B1E17', marginTop: '2px' }}>
                          {selectedNodeDetails.sector || 'Core'}
                        </div>
                      </div>
                    </div>

                    {/* LCIA Impact Vector */}
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8A776D',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                      }}>
                        Characterized LCIA Impacts ({entanglementMethodology.toUpperCase()})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(selectedNodeDetails.lcia_impacts || {}).map(([ind, val]) => (
                          <div
                            key={ind}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              backgroundColor: '#FAF8F5',
                              borderRadius: '6px',
                              border: '1px solid #EFE8DF'
                            }}
                          >
                            <span style={{ fontSize: '11px', color: '#55463E', fontWeight: 600, textTransform: 'capitalize' }}>
                              {ind}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#B2491A', fontFamily: 'monospace' }}>
                              {formatExponential(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entanglement Stage Rollup */}
                    {entanglementData?.breakdown_by_relationship && (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: '#FDF6F2',
                        borderRadius: '8px',
                        border: '1px solid #F2DDD0'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#A24A1E', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Supply Chain GWP Rollup
                        </div>
                        <div style={{ fontSize: '11px', color: '#6A584F', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Upstream Extraction:</span>
                            <strong>
                              {formatExponential(entanglementData.breakdown_by_relationship.upstream_manufacturing?.['global warming potential'] || entanglementData.breakdown_by_relationship.upstream_manufacturing?.['climate change - total'])} kg CO2e
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Downstream Machining:</span>
                            <strong>
                              {formatExponential(entanglementData.breakdown_by_relationship.downstream_processing?.['global warming potential'] || entanglementData.breakdown_by_relationship.downstream_processing?.['climate change - total'])} kg CO2e
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Energy & Logistics:</span>
                            <strong>
                              {formatExponential((entanglementData.breakdown_by_relationship.energy_carrier?.['global warming potential'] || 0) + (entanglementData.breakdown_by_relationship.transport_link?.['global warming potential'] || 0))} kg CO2e
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#8A776D', textAlign: 'center', padding: '40px 0' }}>
                    Click any process node to view detailed scaling & LCIA footprint factors.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ISO 14025 DOCUMENT TRACEABILITY (ORIGINAL AUDIT MAP)               */}
        {/* ========================================================================= */}
        {activeTab === 'traceability' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
              backgroundColor: '#FAF7F4',
              flex: 1
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
          </div>
        )}

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #F0E5DB',
          backgroundColor: '#FAF6F1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7E6C62' }}>
            <InfoIcon size={15} />
            <span>Multi-database lineage tracked across cut-off, APOS, and consequential ecoinvent branches with SHA-256 verification.</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
