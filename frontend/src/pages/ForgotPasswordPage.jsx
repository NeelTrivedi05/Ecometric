import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayersTwo01, Mail01 } from '@untitledui/icons';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.local.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage('If an account exists for this email, a password reset link is on its way.');
  }

  return (
    <main className="auth3-page">
      <section className="auth3-card" aria-labelledby="forgot-password-title">
        <div className="brand-lockup"><span className="brand-mark"><LayersTwo01 size={20} /></span><span>EcoMetric</span></div>
        <div className="auth-heading">
          <p className="eyebrow">Account recovery</p>
          <h1 id="forgot-password-title">Forgot password?</h1>
          <p>Enter your work email and we will send you a secure reset link.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="reset-email">Work email</label>
          <div className="input-with-icon"><Mail01 size={17} /><input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <button className="auth3-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
        {error && <p className="auth3-message auth3-error" role="alert">{error}</p>}
        {message && <p className="auth3-message">{message}</p>}
        <p className="auth3-switch"><button type="button" onClick={() => navigate('/login')}>Back to sign in</button></p>
      </section>
    </main>
  );
}
