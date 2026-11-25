import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { API_BASE } from '../config/api';
import '../styles/VerifyPage.css';

const headings = {
  authentic: 'Authentic record', not_found: 'No matching record', modified: 'Signature mismatch',
  revoked: 'Certificate revoked', superseded: 'Certificate replaced',
};

export default function VerifyPage() {
  const [params] = useSearchParams();
  const query = params.get('c') || params.get('cert') || params.get('certificate') || '';
  const [id, setId] = useState(query);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);
  const request = useRef(null);

  const verify = useCallback(async (certificate, file) => {
    if (!file && !certificate.trim()) { setError('Enter the certificate ID printed on your declaration.'); return; }
    if (file && file.size > 64 * 1024 * 1024) { setError('Choose a file smaller than 64 MB.'); return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setError(''); setResult(null); setBusy(true); setCopied(false); setFileName(file?.name || '');
    try {
      const options = { signal: controller.signal };
      let path = '/verify';
      if (file) {
        options.method = 'POST';
        options.body = new FormData();
        options.body.append('file', file);
      } else {
        path += '/' + encodeURIComponent(certificate.trim());
      }
      const response = await fetch(API_BASE + path, options);
      const record = await response.json();
      if ((!response.ok && !(response.status === 404 && record.result === 'not_found')) || !Object.hasOwn(headings, record.result)) {
        throw new Error();
      }
      if (!controller.signal.aborted) setResult(record);
    } catch {
      if (!controller.signal.aborted) setError('The registry could not complete this check. Please try again.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, []);
  useEffect(() => {
    setId(query);
    if (query) verify(query);
    return () => request.current?.abort();
  }, [query, verify]);

  const p = result?.provenance || {};
  const details = [
    ['Certificate ID', result?.certificate_id], ['Product', p.product_name], ['Organization', p.organization_name],
    ['Declaration', p.epd_id], ['Revision', p.epd_version], ['Database', [p.lci_database, p.lci_database_version].filter(Boolean).join(' ')],
    ['Export format', p.export_mode], ['Studio version', p.software_version], ['Signature', p.signature_algorithm],
    ['Issued', p.created_at && new Date(p.created_at).toUTCString()], ['File checked', fileName],
  ];
  return (
    <div className="registry">
      <header className="registry-head"><Link to="/"><BrandLogo height={25} /></Link><Link to="/overview">Platform overview ↗</Link></header>
      <main className="registry-layout">
        <div className="registry-intro">
          <p className="registry-section">Public registry</p>
          <h1>Verify a <br />declaration.</h1>
          <p>Look up an EcoMetric certificate, or check whether a file matches the version on record.</p>
          <Link to="/info/epd">About environmental product declarations ↗</Link>
        </div>
        <section className="registry-panel" aria-label="Declaration verification" aria-busy={busy}>
          {result ? <>
            <p className="registry-section">Registry response</p>
            <h2 aria-live="polite">{headings[result.result]}</h2>
            <p>{result.revoke_reason || result.detail || ({
              authentic: fileName ? 'The file matches the signed registry record.' : 'The registry signature for this certificate is valid.',
              superseded: 'A newer certificate replaces this record.', revoked: 'The issuer has withdrawn this certificate.',
              not_found: 'Check the certificate ID or choose the original exported file.',
            })[result.result]}</p>
            {result.superseded_by && <button onClick={() => { setId(result.superseded_by); verify(result.superseded_by); }}>View replacement certificate</button>}
            <dl>{details.filter(([,value]) => value != null && value !== '').map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
            <div className="registry-tools">
              <button onClick={() => { setResult(null); setError(''); setFileName(''); setId(''); }}>Check another declaration</button>
              {result.certificate_id && <button onClick={async () => {
                try { await navigator.clipboard.writeText(result.certificate_id); setCopied(true); }
                catch { setError('Select and copy the certificate ID above.'); }
              }}>{copied ? 'Copied' : 'Copy ID'}</button>}
              <button onClick={() => window.print()}>Print</button>
            </div>
          </> : <>
            <h2>Certificate lookup</h2>
            <form onSubmit={e => { e.preventDefault(); verify(id); }}>
              <label htmlFor="certificate">Certificate ID</label>
              <input id="certificate" value={id} onChange={e => setId(e.target.value)} placeholder="ECM-XXXX-XXXX-XXXX-XXXX" required disabled={busy} spellCheck={false} />
              <button className="registry-submit" disabled={busy}>{busy && !fileName ? 'Checking…' : 'Look up certificate'} <span aria-hidden="true">→</span></button>
            </form>
            <div className="registry-upload" data-dragging={dragging} onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy && e.dataTransfer.files[0]) verify('', e.dataTransfer.files[0]); }}>
              <h3>Have the original file?</h3>
              <p>Drop a PDF, JSON, XLSX or ECMX file here. Maximum 64 MB.</p>
              <input type="file" hidden ref={fileInput} accept=".pdf,.json,.xlsx,.ecmx" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) verify('', file); }} />
              <button disabled={busy} onClick={() => fileInput.current?.click()}>{busy && fileName ? 'Checking file…' : 'Choose a file'}</button>
            </div>
          </>}
          {error && <p role="alert" className="registry-error">{error}</p>}
        </section>
      </main>
    </div>
  );
}
