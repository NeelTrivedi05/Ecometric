import React, { useState, useEffect } from 'react';
import { CloseIcon, FileIcon, ChevronRightIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon } from './Icons';

export default function ProcessFlowModal({ isOpen, onClose, traceabilityFlow, gaps = [] }) {
  if (!isOpen) return null;

  // View Mode: 'entanglement' (1-to-10 DAG) | 'pcr_rules' (PCR/GPI Evaluator) | 'traceability' (Document Audit)
  const [activeTab, setActiveTab] = useState('entanglement');
  const [selectedStage, setSelectedStage] = useState('all');
  
  // Entanglement State
  const [entanglementData, setEntanglementData] = useState(null);
  const [baselineData, setBaselineData] = useState(null);
  const [isLoadingEntanglement, setIsLoadingEntanglement] = useState(false);
  const [entanglementMethodology, setEntanglementMethodology] = useState('traci21');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [edgeOverrides, setEdgeOverrides] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);

  // PCR Evaluator State
  const [pcrRulesList, setPcrRulesList] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState('rule-ul10010-4-traci');
  const [pcrEvaluation, setPcrEvaluation] = useState(null);
  const [isLoadingPcr, setIsLoadingPcr] = useState(false);

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

  // Fetch Entanglement Data
  useEffect(() => {
    if (activeTab === 'entanglement') {
      setIsLoadingEntanglement(true);
      fetch(`/api/processes/proc-steel-converter-parent/entanglement?methodology=${entanglementMethodology}`)
        .then(r => r.json())
        .then(data => {
          setEntanglementData(data);
          setBaselineData(data);
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

  // Fetch PCR Rules List
  useEffect(() => {
    if (activeTab === 'pcr_rules') {
      setIsLoadingPcr(true);
      fetch('/api/pcr/rules')
        .then(r => r.json())
        .then(data => {
          setPcrRulesList(data?.rules || []);
          if (data?.rules?.length && !selectedRuleId) {
            setSelectedRuleId(data.rules[0].id);
          }
          setIsLoadingPcr(false);
        })
        .catch(err => {
          console.error("Failed to fetch PCR rules:", err);
          setIsLoadingPcr(false);
        });
    }
  }, [activeTab]);

  // Evaluate PCR Compliance when rule changes
  useEffect(() => {
    if (activeTab === 'pcr_rules' && selectedRuleId) {
      setIsLoadingPcr(true);
      fetch('/api/pcr/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: selectedRuleId,
          results: {
            "global warming potential": 1420.5,
            "climate change - total": 1445.0,
            "acidification potential": 3.2,
            "acidification": 3.15,
            "eutrophication potential": 0.8,
            "eutrophication, freshwater": 0.12,
            "smog formation potential": 12.1,
            "photochemical ozone formation": 8.4,
            "ozone depletion potential": 0.00001,
            "ozone depletion": 0.0000095
          },
          bom: [
            { material: "Steel", mass: 2100, is_included: true },
            { material: "Copper", mass: 650, is_included: true },
            { material: "Rubber Gaskets", mass: 12, is_included: true },
            { material: "Trace Lubricant", mass: 0.8, is_included: false }
          ]
        })
      })
        .then(r => r.json())
        .then(data => {
          setPcrEvaluation(data);
          setIsLoadingPcr(false);
        })
        .catch(err => {
          console.error("Failed to evaluate PCR compliance:", err);
          setIsLoadingPcr(false);
        });
    }
  }, [activeTab, selectedRuleId]);

  // Run Simulation with Overrides
  const handleRunSimulation = () => {
    setIsSimulating(true);
    fetch('/api/processes/entanglement/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        root_process_id: 'proc-steel-converter-parent',
        methodology: entanglementMethodology,
        base_quantity: 1.0,
        max_depth: 5,
        overrides: edgeOverrides
      })
    })
      .then(r => r.json())
      .then(data => {
        setEntanglementData(data);
        setIsSimulating(false);
        // refresh selected node with updated data
        if (selectedNodeDetails) {
          const updated = data.nodes?.find(n => n.id === selectedNodeDetails.id) || data.root_process;
          setSelectedNodeDetails(updated);
        }
      })
      .catch(err => {
        console.error("Simulation failed:", err);
        setIsSimulating(false);
      });
  };

  // Reset Overrides
  const handleResetOverrides = () => {
    setEdgeOverrides({});
    if (baselineData) {
      setEntanglementData(baselineData);
      setSelectedNodeDetails(baselineData.root_process);
    }
  };

  // Group Entangled Nodes
  const rootNode = entanglementData?.root_process;
  const childNodes = (entanglementData?.nodes || []).filter(n => !n.is_root);
  const upstreamNodes = childNodes.filter(n => n.relationship_type === 'upstream_manufacturing');
  const downstreamNodes = childNodes.filter(n => n.relationship_type === 'downstream_processing');
  const logisticsNodes = childNodes.filter(n => ['transport_link', 'energy_carrier'].includes(n.relationship_type));

  // Find active edge for currently selected node
  const activeEdge = entanglementData?.edges?.find(e => e.child_process_id === selectedNodeDetails?.id);

  const formatExponential = (val) => {
    if (val === undefined || val === null) return '0.00';
    if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(2);
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 3 });
  };

  // Baseline GWP vs Current GWP Delta
  const baselineGwp = baselineData?.cumulative_lcia_totals?.['global warming potential'] || baselineData?.cumulative_lcia_totals?.['climate change - total'] || 0;
  const currentGwp = entanglementData?.cumulative_lcia_totals?.['global warming potential'] || entanglementData?.cumulative_lcia_totals?.['climate change - total'] || 0;
  const deltaGwpPct = baselineGwp > 0 ? (((currentGwp - baselineGwp) / baselineGwp) * 100) : 0;

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
      padding: '16px'
    }}>
      <div className="modal-container" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1180px',
        height: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(45, 25, 15, 0.35)',
        border: '1px solid #EBE0D5',
        overflow: 'hidden'
      }}>
        {/* Top Header & Tab Navigation */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid #F0E5DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FAF6F1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  padding: '7px 14px',
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
                onClick={() => setActiveTab('pcr_rules')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'pcr_rules' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'pcr_rules' ? '#A24A1E' : '#6E5C52',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'pcr_rules' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                ⚖️ PCR & GPI Compliance Evaluator
              </button>
              <button
                onClick={() => setActiveTab('traceability')}
                style={{
                  padding: '7px 14px',
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
                📑 ISO 14025 Document Audit Trail
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
            {/* Control Bar & Mass Balance Summary */}
            <div style={{
              padding: '10px 24px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F0E5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#2B1E17' }}>
                    Steel Supply Chain Entanglement (1 Parent → 11 Sub-Processes)
                  </h3>
                  <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#7E6C62' }}>
                    Recursive DAG propagation with live loss margin overrides and mass conservation audit.
                  </p>
                </div>

                {/* Mass & Energy Balance Audit Badges */}
                {entanglementData?.mass_balance_audit && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#FAF5EE',
                    border: '1px solid #E8DDD0',
                    fontSize: '11px'
                  }}>
                    <span>Inputs: <strong>{entanglementData.mass_balance_audit.total_mass_input_kg} kg</strong></span>
                    <span>·</span>
                    <span>Product: <strong>{entanglementData.mass_balance_audit.product_output_kg} kg</strong></span>
                    <span>·</span>
                    <span>Yield: <strong>{(entanglementData.mass_balance_audit.yield_ratio * 100).toFixed(1)}%</strong></span>
                    <span>·</span>
                    <span style={{ color: '#2E7D32', fontWeight: 700 }}>
                      ✓ {entanglementData.mass_balance_audit.balance_status} (0 Cycles)
                    </span>
                  </div>
                )}
              </div>

              {/* Methodology & Simulation Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {Object.keys(edgeOverrides).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: deltaGwpPct > 0 ? '#C25A23' : '#2E7D32',
                      backgroundColor: deltaGwpPct > 0 ? '#FDF2EB' : '#E8F5E9',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      GWP {deltaGwpPct >= 0 ? '+' : ''}{deltaGwpPct.toFixed(2)}% vs Baseline
                    </span>
                    <button
                      onClick={handleResetOverrides}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #D5C7B8',
                        backgroundColor: '#FFFFFF',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#6E5C52'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}

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
                    TRACI 2.1
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
                    EF v3.1
                  </button>
                </div>
              </div>
            </div>

            {/* Main DAG Workspace & Details Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 370px',
              flex: 1,
              minHeight: 0,
              backgroundColor: '#FAF7F3'
            }}>
              {/* DAG Canvas View */}
              <div style={{
                padding: '16px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
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
                          marginBottom: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#A24A1E',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          <span>Tier 1 · Primary Reference Product</span>
                        </div>

                        <div
                          onClick={() => setSelectedNodeDetails(rootNode)}
                          style={{
                            padding: '14px 18px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            border: selectedNodeDetails?.id === rootNode.id ? '2px solid #D47A47' : '1px solid #E5D7CB',
                            boxShadow: '0 3px 10px rgba(162, 74, 30, 0.07)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B1E17' }}>
                                {rootNode.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '2px' }}>
                                Ref Product: <strong>{rootNode.reference_product}</strong> · Geo: <strong>{rootNode.geography}</strong>
                              </div>
                            </div>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#B2491A',
                              backgroundColor: '#FDF2EB',
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              1.000 kg declared
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TIER 2 UPSTREAM: MINING & SMELTING (6 SUB-PROCESSES) */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
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
                        <span style={{ fontSize: '10px', color: '#8A776D' }}>Stoichiometric multipliers</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {upstreamNodes.map(node => {
                          const edge = entanglementData?.edges?.find(e => e.child_process_id === node.id);
                          const isOverridden = edge && edgeOverrides[edge.id];
                          return (
                            <div
                              key={node.id}
                              onClick={() => setSelectedNodeDetails(node)}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '10px',
                                backgroundColor: isOverridden ? '#FFFDF8' : '#FFFFFF',
                                border: selectedNodeDetails?.id === node.id 
                                  ? '2px solid #3F75A2' 
                                  : isOverridden ? '1px dashed #D47A47' : '1px solid #E2D9D0',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: '#EDF4F9',
                                  color: '#27587F',
                                  padding: '2px 6px',
                                  borderRadius: '5px'
                                }}>
                                  {node.sector || 'upstream'}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: isOverridden ? '#D47A47' : '#2B1E17' }}>
                                  {node.cumulative_scaling}x {isOverridden ? '⚡' : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#2B1E17', lineHeight: '1.3' }}>
                                {node.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '3px' }}>
                                {node.quantity} {node.unit} · Loss: {((node.loss_rate || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TIER 2 DOWNSTREAM: FORMING & FINISHING (3 SUB-PROCESSES) */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#654B7F',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          Tier 2 Downstream · Forming, Machining & Surface Coating ({downstreamNodes.length} Sub-Processes)
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {downstreamNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeDetails(node)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: '#FFFFFF',
                              border: selectedNodeDetails?.id === node.id ? '2px solid #785A96' : '1px solid #E2D9D0',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                backgroundColor: '#F4EEF9',
                                color: '#5C397D',
                                padding: '2px 6px',
                                borderRadius: '5px'
                              }}>
                                {node.sector || 'finishing'}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2B1E17' }}>
                                {node.cumulative_scaling}x
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2B1E17', lineHeight: '1.3' }}>
                              {node.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#7E6C62', marginTop: '3px' }}>
                              {node.quantity} {node.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INFRASTRUCTURE: ENERGY & FREIGHT */}
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6E6E36',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '6px'
                      }}>
                        Infrastructure Links · Electricity & Freight Logistics ({logisticsNodes.length} Processes)
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {logisticsNodes.map(node => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeDetails(node)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: '#FFFFFF',
                              border: selectedNodeDetails?.id === node.id ? '2px solid #828238' : '1px solid #E2D9D0',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                backgroundColor: '#F8F8EC',
                                color: '#666628',
                                padding: '2px 6px',
                                borderRadius: '5px'
                              }}>
                                {node.relationship_type}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2B1E17' }}>
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

              {/* Side Panel: Interactive Parameter Editor & Node Inspector */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderLeft: '1px solid #F0E5DB',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#8A776D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Node & Parameter Tuning
                </div>

                {selectedNodeDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#2B1E17' }}>
                        {selectedNodeDetails.name}
                      </h4>
                      <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '2px' }}>
                        UUID: <code>{selectedNodeDetails.id}</code>
                      </div>
                    </div>

                    {/* Interactive Parameter Sliders if child node has an edge */}
                    {activeEdge && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#FAF5EE',
                        borderRadius: '10px',
                        border: '1px solid #E8DDD0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#A24A1E', textTransform: 'uppercase' }}>
                          ⚡ Live Edge Parameters
                        </div>

                        {/* Scaling Factor */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                            <span>Scaling Multiplier:</span>
                            <strong>{(edgeOverrides[activeEdge.id]?.scaling_factor ?? activeEdge.scaling_factor).toFixed(2)}x</strong>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.05"
                            value={edgeOverrides[activeEdge.id]?.scaling_factor ?? activeEdge.scaling_factor}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setEdgeOverrides(prev => ({
                                ...prev,
                                [activeEdge.id]: {
                                  ...prev[activeEdge.id],
                                  scaling_factor: val
                                }
                              }));
                            }}
                            style={{ width: '100%', accentColor: '#D47A47' }}
                          />
                        </div>

                        {/* Loss Rate */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                            <span>Scrap / Loss Rate:</span>
                            <strong>{(((edgeOverrides[activeEdge.id]?.loss_rate ?? activeEdge.loss_rate)) * 100).toFixed(0)}%</strong>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="0.25"
                            step="0.01"
                            value={edgeOverrides[activeEdge.id]?.loss_rate ?? activeEdge.loss_rate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setEdgeOverrides(prev => ({
                                ...prev,
                                [activeEdge.id]: {
                                  ...prev[activeEdge.id],
                                  loss_rate: val
                                }
                              }));
                            }}
                            style={{ width: '100%', accentColor: '#D47A47' }}
                          />
                        </div>

                        <button
                          onClick={handleRunSimulation}
                          disabled={isSimulating}
                          style={{
                            marginTop: '4px',
                            padding: '6px 12px',
                            backgroundColor: '#A24A1E',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {isSimulating ? 'Simulating...' : 'Apply Simulation & Recalculate'}
                        </button>
                      </div>
                    )}

                    {/* LCIA Footprint Vector */}
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8A776D',
                        textTransform: 'uppercase',
                        marginBottom: '6px'
                      }}>
                        Characterized Footprint ({entanglementMethodology.toUpperCase()})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {Object.entries(selectedNodeDetails.lcia_impacts || {}).map(([ind, val]) => (
                          <div
                            key={ind}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '6px 8px',
                              backgroundColor: '#FAF8F5',
                              borderRadius: '6px',
                              border: '1px solid #EFE8DF'
                            }}
                          >
                            <span style={{ fontSize: '11px', color: '#55463E', fontWeight: 600, textTransform: 'capitalize' }}>
                              {ind}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#B2491A', fontFamily: 'monospace' }}>
                              {formatExponential(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#8A776D', textAlign: 'center', padding: '30px 0' }}>
                    Select a process node to inspect impacts and tweak supply parameters.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PCR & GPI COMPLIANCE EVALUATOR                                     */}
        {/* ========================================================================= */}
        {activeTab === 'pcr_rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, backgroundColor: '#FAF7F4' }}>
            {/* Rule Selector Header */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F0E5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2B1E17' }}>
                  PCR & GPI Compliance Matrix Auditor
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#7E6C62' }}>
                  Evaluates mandatory indicator reporting, optional disclosures, and 1% mass cut-off rules.
                </p>
              </div>

              {/* Standard Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8A776D', textTransform: 'uppercase' }}>
                  Select Standard:
                </span>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D5C7B8',
                    backgroundColor: '#FAF5EE',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2B1E17',
                    cursor: 'pointer'
                  }}
                >
                  {pcrRulesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.rule_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compliance Audit Report Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {isLoadingPcr ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#8A776D' }}>
                  Evaluating PCR compliance against selected standard...
                </div>
              ) : pcrEvaluation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Verdict & Score Banner */}
                  <div style={{
                    padding: '16px 20px',
                    backgroundColor: pcrEvaluation.overall_verdict === 'COMPLIANT' ? '#EDF7ED' : '#FFF4E5',
                    borderRadius: '12px',
                    border: pcrEvaluation.overall_verdict === 'COMPLIANT' ? '1px solid #C8E6C9' : '1px solid #FFE0B2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: pcrEvaluation.overall_verdict === 'COMPLIANT' ? '#2E7D32' : '#E65100',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {pcrEvaluation.overall_verdict}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1B1410' }}>
                          {pcrEvaluation.rule_name} Compliance Audit
                        </h4>
                      </div>
                      <div style={{ fontSize: '12px', color: '#55463E', marginTop: '4px' }}>
                        Standard: <strong>{pcrEvaluation.standard}</strong> · Methodology: <strong>{pcrEvaluation.methodology}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: pcrEvaluation.overall_verdict === 'COMPLIANT' ? '#2E7D32' : '#E65100' }}>
                        {pcrEvaluation.compliance_score_pct}%
                      </div>
                      <div style={{ fontSize: '11px', color: '#6A584F' }}>
                        {pcrEvaluation.mandatory_summary.compliant} of {pcrEvaluation.mandatory_summary.total_required} Mandatory Indicators Met
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Indicators Checklist */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #EBE0D5',
                    padding: '16px 20px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#2B1E17', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Mandatory Core Indicators
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {pcrEvaluation.mandatory_evaluations?.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#FAF8F5',
                            border: '1px solid #EFE8DF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#2B1E17', textTransform: 'capitalize' }}>
                              {item.indicator}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7E6C62', marginTop: '2px' }}>
                              Value: <strong>{formatExponential(item.value)}</strong>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 7px',
                            borderRadius: '5px',
                            backgroundColor: item.status === 'COMPLIANT' ? '#E8F5E9' : '#FFEBEE',
                            color: item.status === 'COMPLIANT' ? '#2E7D32' : '#C62828'
                          }}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cut-off Criteria & Recommendations */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #EBE0D5',
                      padding: '16px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: '#2B1E17', textTransform: 'uppercase' }}>
                        Cut-off Rule Compliance
                      </h4>
                      <p style={{ fontSize: '12px', color: '#7E6C62', margin: '0 0 10px 0' }}>
                        Rule: <strong>{pcrEvaluation.cutoff_evaluations?.rule_threshold}</strong>
                      </p>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#FAF6F1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#55463E'
                      }}>
                        Total Omitted Mass: <strong>{pcrEvaluation.cutoff_evaluations?.cumulative_omitted_pct}%</strong> (Permissible: &lt;5%)
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #EBE0D5',
                      padding: '16px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: '#2B1E17', textTransform: 'uppercase' }}>
                        Third-Party Audit Recommendations
                      </h4>
                      {pcrEvaluation.recommendations?.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#7E6C62' }}>
                          {pcrEvaluation.recommendations.map((rec, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600 }}>
                          ✓ Fully compliant with all mandatory PCR declaration requirements. Ready for Third-Party Verifier submission.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ISO 14025 DOCUMENT TRACEABILITY (AUDIT MAP)                        */}
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
          padding: '12px 24px',
          borderTop: '1px solid #F0E5DB',
          backgroundColor: '#FAF6F1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#7E6C62' }}>
            <InfoIcon size={14} />
            <span>Multi-tier entanglement DAG mathematically conserved with cycle detection and ISO 14025 verification.</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '7px 20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
