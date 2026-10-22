import React, { useEffect, useState } from 'react';
import { CheckCircle, Edit05, Lock01, XClose } from '@untitledui/icons';
import { Button } from '../base/buttons/button';
import { useStudio } from '../../context/StudioContext';

const editableFields = {
  company: [
    ['company_name', 'Company name', 'input'],
    ['company_address', 'Company address', 'textarea'],
    ['company_website', 'Company website', 'input'],
    ['description_of_company', 'Company description', 'textarea'],
  ],
  product: [
    ['product_name', 'Product title', 'input'],
    ['product_description', 'Product description', 'textarea'],
    ['intended_application', 'Intended application', 'textarea'],
  ],
};

export default function ReportDetailsModal() {
  const {
    isReportDetailsModalOpen,
    setIsReportDetailsModalOpen,
    reportDetails,
    setReportDetails,
    saveReportDetails,
    validatePreExport,
    exportEpdPdf,
    isLoading,
    showNotif,
    projectInfo,
    lca,
    selectedMethodology,
  } = useStudio();
  const [activeTab, setActiveTab] = useState('company');
  const [validationResult, setValidationResult] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isReportDetailsModalOpen) return;
    validatePreExport(reportDetails).then(setValidationResult).catch(() => setValidationResult(null));
  }, [isReportDetailsModalOpen]);

  if (!isReportDetailsModalOpen) return null;

  const updateField = (field, value) => setReportDetails((current) => ({ ...current, [field]: value }));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await validatePreExport(reportDetails);
      setValidationResult(result);
      if (!result.valid) {
        showNotif('Complete the blocking report checks before exporting.', 'Export Blocked');
        return;
      }
      await saveReportDetails(reportDetails);
      await exportEpdPdf(reportDetails);
      showNotif('PDF generated with locked calculation values and edited text details.', 'PDF Exported');
      setIsReportDetailsModalOpen(false);
    } catch (error) {
      showNotif(`PDF export failed: ${error.message || 'Unknown error'}`, 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  const fields = editableFields[activeTab];

  return (
    <div className="pdf-editor-backdrop" role="presentation" onClick={() => setIsReportDetailsModalOpen(false)}>
      <section className="pdf-editor" role="dialog" aria-modal="true" aria-labelledby="pdf-editor-title" onClick={(event) => event.stopPropagation()}>
        <header className="pdf-editor-header">
          <div><p className="eyebrow">PDF content editor</p><h2 id="pdf-editor-title">Edit report text before generating</h2><p>Only company and product copy can be changed. Calculated values are embedded from the current EPD results.</p></div>
          <button type="button" className="pdf-editor-close" onClick={() => setIsReportDetailsModalOpen(false)} aria-label="Close PDF editor"><XClose size={18} /></button>
        </header>
        <div className="pdf-editor-tabs" role="tablist" aria-label="Editable report sections">
          {['company', 'product'].map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab === 'company' ? 'Company details' : 'Product details'}</button>)}
        </div>
        <div className="pdf-editor-body">
          <div className="pdf-editor-form">
            <div className="pdf-editor-heading"><Edit05 size={18} /><div><h3>{activeTab === 'company' ? 'Company copy' : 'Product copy'}</h3><p>These text fields are editable in the report.</p></div></div>
            {fields.map(([field, label, type]) => <label key={field}>{label}{type === 'textarea' ? <textarea rows={field.includes('description') || field.includes('application') ? 5 : 3} value={reportDetails[field] || ''} onChange={(event) => updateField(field, event.target.value)} /> : <input type="text" value={reportDetails[field] || ''} onChange={(event) => updateField(field, event.target.value)} />}</label>)}
          </div>
          <aside className="pdf-editor-locked" aria-label="Locked generated report data">
            <div className="pdf-editor-heading"><Lock01 size={18} /><div><h3>Generated data locked</h3><p>These values are read-only and will be embedded in the PDF.</p></div></div>
            <dl>
              <div><dt>Software</dt><dd>EcoMetric</dd></div>
              <div><dt>Version</dt><dd>EPD Studio v1.0</dd></div>
              <div><dt>LCIA method</dt><dd>{selectedMethodology || projectInfo.lciaMethod}</dd></div>
              <div><dt>Declared unit</dt><dd>{projectInfo.declaredUnitStatement}</dd></div>
              <div><dt>Total GWP</dt><dd>{Number(lca.total_gwp || 0).toLocaleString()} kg CO2e</dd></div>
              <div><dt>Database</dt><dd>ecoinvent v3.12 Cut-Off</dd></div>
            </dl>
          </aside>
        </div>
        <footer className="pdf-editor-footer">
          <span className={validationResult?.valid ? 'editor-validation valid' : 'editor-validation'}>{validationResult?.valid ? <><CheckCircle size={15} /> Ready to generate</> : 'Validation runs before export'}</span>
          <Button color="secondary" onClick={() => setIsReportDetailsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting || isLoading}>{isExporting ? 'Generating PDF...' : 'Generate PDF'}</Button>
        </footer>
      </section>
    </div>
  );
}
