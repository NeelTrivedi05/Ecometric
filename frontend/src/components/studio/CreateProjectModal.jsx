import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { XIcon, CheckIcon, ShieldCheckIcon, LayersIcon, BuildingIcon, ZapIcon } from './Icons';
import { Button } from '@/components/base/buttons/button';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { currentAccount, assembledDatabase } = useStudio();

  const [formData, setFormData] = useState({
    name: '',
    product_model: '',
    capacity_rt: 500,
    refrigerant: assembledDatabase?.default_refrigerant || 'R1233zd',
    refrigerant_charge_kg: 320,
    standard: assembledDatabase?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
    lifespan_years: 25,
    tag: 'Chillers',
    starter_template: 'carrier_19dv_benchmark',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    const newProj = {
      id: `proj-${Date.now()}`,
      name: formData.name.trim(),
      product_model: formData.product_model.trim() || `${formData.name.trim().slice(0, 10).toUpperCase()}-${formData.capacity_rt}RT`,
      capacity_rt: Number(formData.capacity_rt) || 500,
      refrigerant: formData.refrigerant,
      refrigerant_charge_kg: Number(formData.refrigerant_charge_kg) || 250,
      gwp_total: Math.round(Number(formData.capacity_rt) * 76.8),
      status: 'In Calculation',
      standard: formData.standard,
      owner: 'You',
      last_modified: 'Just now by You',
      created_at: new Date().toISOString().split('T')[0],
      tags: [formData.tag, 'Primary Facility LCI'],
      preset_key: formData.starter_template,
      functional_unit: `1 ton chilling capacity over ${formData.lifespan_years} years reference service life`,
      declared_unit: `1 complete chiller unit (${formData.capacity_rt} RT)`,
      facility: assembledDatabase?.facility_name || currentAccount?.facility_name || 'Primary Facility',
      epd_number: null,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      if (onProjectCreated) {
        onProjectCreated(newProj);
      }
      onClose();
    }, 250);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(22, 35, 27, 0.48)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #dfe7dd',
          boxShadow: '0 24px 60px -12px rgba(16, 52, 33, 0.22), 0 2px 8px rgba(16, 52, 33, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'studioFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #dfe7dd',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#f8faf6',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#1f7a4c',
                marginBottom: '4px',
              }}
            >
              LCA Project Initialization
            </div>
            <h2
              style={{
                fontSize: '19px',
                fontWeight: 600,
                color: '#16231b',
                margin: 0,
                letterSpacing: '-0.015em',
              }}
            >
              Create New LCA & EPD Assessment
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: '#5b6f62',
                marginTop: '3px',
              }}
            >
              Parameters assemble automatically based on {currentAccount?.company_name || 'your signed-in account'}.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #dfe7dd',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#5b6f62',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease',
            }}
            title="Close dialog"
            aria-label="Close dialog"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Modal Form Scroll Area */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {/* Assembled Database Banner */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: '#eef7f1',
              borderRadius: '12px',
              border: '1px solid #c8e2d1',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BuildingIcon size={15} style={{ color: '#1f7a4c' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#16231b' }}>
                  {assembledDatabase?.facility_name || 'Carrier Syracuse Plant'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#1f7a4c',
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #c8e2d1',
                }}
              >
                DQR {assembledDatabase?.dqr_score || '1.28'} Lineage
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                fontSize: '11px',
                color: '#2f3b33',
              }}
            >
              <div>
                <span style={{ color: '#5b6f62' }}>Regional Grid: </span>
                <span style={{ fontWeight: 600 }}>{assembledDatabase?.grid_mix_name || 'US-NYUP Clean Grid'}</span>
                <span style={{ fontFamily: 'monospace', color: '#1f7a4c', marginLeft: '4px' }}>
                  ({assembledDatabase?.grid_emission_factor || 0.165} kg CO₂e/kWh)
                </span>
              </div>
              <div>
                <span style={{ color: '#5b6f62' }}>LCI Branch: </span>
                <span style={{ fontWeight: 600 }}>ecoinvent v3.12 Cut-Off</span>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            {/* Project Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Project / Equipment Model Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., AquaEdge 19DV Water-Cooled Centrifugal Chiller Series 2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Model Number / Serial */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Equipment Model Designation
              </label>
              <input
                type="text"
                value={formData.product_model}
                onChange={(e) => setFormData({ ...formData, product_model: e.target.value })}
                placeholder="e.g., 19DV-500RT-CERAMIC"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Capacity RT */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Chilling Capacity (RT - Tons of Refrigeration)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={formData.capacity_rt}
                onChange={(e) => setFormData({ ...formData, capacity_rt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* Refrigerant Type */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Primary Refrigerant Selection
              </label>
              <select
                value={formData.refrigerant}
                onChange={(e) => setFormData({ ...formData, refrigerant: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="R1233zd">R-1233zd(E) Solstice zd (GWP: 1 - Ultra Low)</option>
                <option value="R32">R-32 Difluoromethane (GWP: 675)</option>
                <option value="R514A">R-514A EcoWise Opteon XP30 (GWP: 2)</option>
                <option value="R1234ze">HFO-1234ze(E) Solstice ze (GWP: 1)</option>
                <option value="R134a">R-134a 1,1,1,2-Tetrafluoroethane (GWP: 1430)</option>
                <option value="R513A">R-513A Opteon XP10 (GWP: 631)</option>
                <option value="R454B">R-454B Opteon XL41 (GWP: 466)</option>
              </select>
            </div>

            {/* Refrigerant Charge (kg) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Factory Refrigerant Charge (kg)
              </label>
              <input
                type="number"
                min="1"
                max="2000"
                value={formData.refrigerant_charge_kg}
                onChange={(e) => setFormData({ ...formData, refrigerant_charge_kg: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* PCR Standard */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Applicable PCR Standard & Core Rule
              </label>
              <select
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="UL 10010-4 Part B v2.0 & EN 15804+A2">
                  UL 10010-4 Part B v2.0 & EN 15804+A2 (Commercial HVAC Chillers)
                </option>
                <option value="UL 10010-4 Part B v2.0 (2018)">
                  UL 10010-4 Part B v2.0 (North America Baseline)
                </option>
                <option value="EN 15804+A2:2019 Core Rules">
                  EN 15804+A2:2019 Core Rules (European Construction & HVAC)
                </option>
                <option value="PEP Ecopassport PSR-0001-ed4-EN-2021">
                  PEP Ecopassport PSR-0001 (Electrical & HVAC Equipment)
                </option>
                <option value="ISO 14025:2006 Type III">
                  ISO 14025:2006 Type III General Environmental Declarations
                </option>
              </select>
            </div>

            {/* Starter Template */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#16231b',
                  marginBottom: '6px',
                }}
              >
                Starter Inventory & BOM Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  {
                    key: 'carrier_19dv_benchmark',
                    title: 'Centrifugal Chiller (500 RT)',
                    desc: 'Full BOM (cast steel, copper tubes, VFD, ceramic bearings)',
                  },
                  {
                    key: 'screw_chiller_300rt',
                    title: 'Screw Chiller (300 RT)',
                    desc: 'Dual semi-hermetic screws, economizer, R-134a/R-32',
                  },
                  {
                    key: 'heat_pump_150rt',
                    title: 'Heat Pump (150 RT)',
                    desc: 'Reversible scroll package, microchannel coils',
                  },
                ].map((tpl) => {
                  const isSelected = formData.starter_template === tpl.key;
                  return (
                    <div
                      key={tpl.key}
                      onClick={() => setFormData({ ...formData, starter_template: tpl.key })}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #1f7a4c' : '1px solid #dfe7dd',
                        backgroundColor: isSelected ? '#eef7f1' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isSelected ? '#1f7a4c' : '#16231b',
                          marginBottom: '3px',
                        }}
                      >
                        {tpl.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#5b6f62', lineHeight: 1.35 }}>
                        {tpl.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid #dfe7dd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <Button
              size="md"
              color="secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              size="md"
              color="primary"
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Assembling LCI...' : 'Assemble & Open Studio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
