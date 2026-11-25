import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function FacilitySettings({ org, account, isAdmin, onSaved }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const assembly = account.database_assembly;
  const editable = isAdmin && supabase && /^[0-9a-f-]{36}$/i.test(org?.id || '');

  async function save(event) {
    event.preventDefault();
    if (!editable || busy) return;
    const values = new FormData(event.currentTarget);
    const name = values.get('facility_name').trim();
    const grid = values.get('grid_mix_name').trim();
    if (!name || !grid) {
      setMessage('Enter a facility name and electricity grid region.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const previous = org.settings || {};
      const settings = {
        ...previous,
        facility_name: name,
        database_assembly: {
          ...previous.database_assembly,
          grid_mix_name: grid,
          grid_emission_factor: Number(values.get('grid_emission_factor')),
          default_refrigerant: values.get('default_refrigerant').trim(),
        },
      };
      const { data, error } = await supabase.from('organizations').update({ settings })
        .eq('id', org.id).eq('settings', JSON.stringify(previous)).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Settings changed or access expired. Refresh before saving again.');
      setMessage('Facility settings saved.');
      await onSaved();
    } catch (error) {
      setMessage(error.message || 'Could not save facility settings. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="apple-card facility-settings" onSubmit={save}>
      <h2>Facility settings</h2>
      <p>{editable ? 'Manage the facility details used in your workspace.' : 'Facility details for this workspace are read-only.'}</p>
      <fieldset disabled={!editable || busy}>
        <label>Manufacturing facility name<input name="facility_name" required defaultValue={account.facility_name || ''} /></label>
        <label>Electricity grid region<input name="grid_mix_name" required defaultValue={assembly.grid_mix_name || ''} /></label>
        <label>Grid emission factor (kg CO2e/kWh)<input name="grid_emission_factor" type="number" required min="0" step="any" defaultValue={assembly.grid_emission_factor ?? ''} /></label>
        <label>Default refrigerant<input name="default_refrigerant" defaultValue={assembly.default_refrigerant || ''} /></label>
      </fieldset>
      {editable && <button className="btn-apple-action-blue" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</button>}
      <p role="status">{message}</p>
    </form>
  );
}
