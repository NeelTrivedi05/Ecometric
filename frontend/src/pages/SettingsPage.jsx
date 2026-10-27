import React, { useState } from 'react';
import { Building07, Check, Save01 } from '@untitledui/icons';
import { Button } from '../components/base/buttons/button';
import { useStudio } from '../context/StudioContext';

export default function SettingsPage() {
  const { reportDetails, setReportDetails, showNotif } = useStudio();
  const [draft, setDraft] = useState({ company_name: reportDetails.company_name || '', company_address: reportDetails.company_address || '', company_website: reportDetails.company_website || '', description_of_company: reportDetails.description_of_company || '' });
  const isDirty = JSON.stringify(draft) !== JSON.stringify({ company_name: reportDetails.company_name || '', company_address: reportDetails.company_address || '', company_website: reportDetails.company_website || '', description_of_company: reportDetails.description_of_company || '' });
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const save = () => { setReportDetails((current) => ({ ...current, ...draft })); showNotif('Company profile updated', 'Saved'); };

  return (
    <main className="settings-page">
      <header className="page-header"><div><p className="eyebrow">Workspace administration</p><h1>Company profile</h1><p>Manage the organization details used in EPD reports and verifier packages.</p></div><span className="status-badge status-success"><Check size={14} /> Active profile</span></header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections"><a className="active" href="#company"><Building07 size={17} /> Company details</a><a href="#reporting">Reporting identity</a><a href="#members">Members and access</a></nav>
        <section className="settings-form" id="company" aria-labelledby="company-title"><div className="section-heading"><div><p className="eyebrow">Organization</p><h2 id="company-title">Company details</h2></div></div><div className="form-grid"><label>Company name<input value={draft.company_name} onChange={(event) => update('company_name', event.target.value)} /></label><label>Website<input type="url" value={draft.company_website} onChange={(event) => update('company_website', event.target.value)} /></label><label className="span-two">Address<textarea rows="3" value={draft.company_address} onChange={(event) => update('company_address', event.target.value)} /></label><label className="span-two">Description<textarea rows="5" value={draft.description_of_company} onChange={(event) => update('description_of_company', event.target.value)} /></label></div></section>
      </div>
      {isDirty && <div className="settings-footer"><span>Unsaved changes</span><Button color="secondary" onClick={() => setDraft({ company_name: reportDetails.company_name || '', company_address: reportDetails.company_address || '', company_website: reportDetails.company_website || '', description_of_company: reportDetails.description_of_company || '' })}>Discard</Button><Button iconLeading={Save01} onClick={save}>Save changes</Button></div>}
    </main>
  );
}
