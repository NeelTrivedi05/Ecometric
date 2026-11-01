import React, { useMemo, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { CheckIcon, CloseIcon, FileIcon, InfoIcon, LayersIcon } from './Icons';

const STAGES = [
  { id: 'A1', label: 'A1–A3', title: 'Product & manufacturing' },
  { id: 'A4–A5', label: 'A4–A5', title: 'Delivery & installation' },
  { id: 'B1–B7', label: 'B1–B7', title: 'Use stage' },
  { id: 'C1–C4', label: 'C1–C4', title: 'End of life' },
  { id: 'D', label: 'D', title: 'Circularity benefits' },
];

function moduleForNode(node) {
  if (node.module) return node.module;
  const label = String(node.label || '').toLowerCase();
  if (label.includes('transport') || label.includes('delivery')) return 'A4–A5';
  if (label.includes('refrigerant') || label.includes('energy') || label.includes('power')) return 'B1–B7';
  if (label.includes('recycl') || label.includes('waste')) return 'C1–C4';
  return 'A1';
}

export default function ProcessFlowModal({ isOpen, onClose, traceabilityFlow, gaps = [] }) {
  const { activeProject, currentAccount, productProfile, uploadedFiles, extractedData } = useStudio();
  const [activeStage, setActiveStage] = useState('all');

  const nodes = traceabilityFlow?.nodes || [];
  const documents = nodes.filter((node) => node.type === 'document');
  const parameters = nodes.filter((node) => node.type !== 'document');
  const visibleParameters = activeStage === 'all'
    ? parameters
    : parameters.filter((node) => moduleForNode(node) === activeStage);
  const mappedCount = parameters.length;
  const sourceCount = documents.length || uploadedFiles.length;
  const bomCount = extractedData?.bom?.length || 0;
  const activeProduct = productProfile?.name || extractedData?.project_info?.product_category_name || 'Selected product';

  const stageCounts = useMemo(() => STAGES.reduce((counts, stage) => {
    counts[stage.id] = parameters.filter((node) => moduleForNode(node) === stage.id).length;
    return counts;
  }, {}), [parameters]);

  if (!isOpen) return null;

  return (
    <div className="process-flow-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="process-flow-modal" role="dialog" aria-modal="true" aria-labelledby="process-flow-title">
        <header className="process-flow-header">
          <div className="process-flow-heading">
            <div className="process-flow-icon"><LayersIcon size={18} /></div>
            <div>
              <span className="apple-eyebrow">Project traceability</span>
              <h2 id="process-flow-title">Evidence &amp; lifecycle mapping</h2>
              <p>{activeProject?.name || activeProduct}</p>
            </div>
          </div>
          <button type="button" className="process-flow-close" onClick={onClose} aria-label="Close traceability flow">
            <CloseIcon size={17} />
          </button>
        </header>

        <div className="process-flow-summary">
          <div><span>Product</span><strong>{activeProduct}</strong></div>
          <div><span>Sources</span><strong>{sourceCount}</strong><small>documents</small></div>
          <div><span>Mapped inputs</span><strong>{mappedCount || bomCount}</strong><small>inventory items</small></div>
          <div><span>Lineage</span><strong className="process-flow-success"><CheckIcon size={13} /> Ready</strong><small>{currentAccount?.database_assembly?.background_database || 'ecoinvent v3.12 Cut-Off'}</small></div>
        </div>

        <div className="process-flow-body">
          <aside className="process-flow-stages" aria-label="Lifecycle stages">
            <button type="button" className={activeStage === 'all' ? 'active' : ''} onClick={() => setActiveStage('all')}>
              <span className="process-stage-index">All</span>
              <span><strong>All evidence</strong><small>{sourceCount + mappedCount} linked records</small></span>
            </button>
            {STAGES.map((stage) => (
              <button type="button" key={stage.id} className={activeStage === stage.id ? 'active' : ''} onClick={() => setActiveStage(stage.id)}>
                <span className="process-stage-index">{stage.label}</span>
                <span><strong>{stage.title}</strong><small>{stageCounts[stage.id] || 0} mapped inputs</small></span>
              </button>
            ))}
          </aside>

          <div className="process-flow-content">
            <div className="process-flow-section-heading">
              <div>
                <span className="apple-eyebrow">Traceability chain</span>
                <h3>{activeStage === 'all' ? 'Source documents to lifecycle inputs' : `${activeStage} evidence and inputs`}</h3>
              </div>
              <span className="process-flow-status"><span /> Synced to workspace</span>
            </div>

            {documents.length > 0 && (
              <div className="process-flow-documents">
                {documents.map((document) => (
                  <div className="process-flow-document" key={document.id}>
                    <span className="process-flow-document-icon"><FileIcon size={15} /></span>
                    <div><strong>{document.label}</strong><small>{document.desc || 'Source document'} · verified source</small></div>
                    <CheckIcon size={15} />
                  </div>
                ))}
              </div>
            )}

            <div className="process-flow-input-grid">
              {visibleParameters.length > 0 ? visibleParameters.map((node) => (
                <article className="process-flow-input" key={node.id}>
                  <div className="process-flow-input-top">
                    <span className="process-flow-module">{moduleForNode(node)}</span>
                    <span className="process-flow-linked"><CheckIcon size={11} /> Linked</span>
                  </div>
                  <strong>{node.label}</strong>
                  <small>{node.desc || 'Mapped to project inventory and lifecycle rules'}</small>
                </article>
              )) : (
                <div className="process-flow-empty">
                  <InfoIcon size={17} />
                  <span>No traceability records are available for this stage yet.</span>
                </div>
              )}
            </div>

            {gaps.length > 0 && (
              <div className="process-flow-gap">
                <InfoIcon size={15} />
                <span><strong>{gaps.length} review item{gaps.length === 1 ? '' : 's'}</strong> still need attention before publication.</span>
              </div>
            )}
          </div>
        </div>

        <footer className="process-flow-footer">
          <span><InfoIcon size={14} /> Traceability follows the active product PCR and project lifecycle boundary.</span>
          <button type="button" className="btn-apple-action-blue" onClick={onClose}>Close inspector</button>
        </footer>
      </section>
    </div>
  );
}
