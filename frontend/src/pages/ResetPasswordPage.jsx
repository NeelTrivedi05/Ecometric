import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayersTwo01, Lock01 } from '@untitledui/icons';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return undefined;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setReady(Boolean(data.session));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Your password has been updated. You can now sign in.');
    setTimeout(() => navigate('/login'), 1200);
  }

  return (
    <main className="auth3-page">
      <section className="auth3-card" aria-labelledby="reset-password-title">
        <div className="brand-lockup"><span className="brand-mark"><LayersTwo01 size={20} /></span><span>EcoMetric</span></div>
        <div className="auth-heading"><p className="eyebrow">Account recovery</p><h1 id="reset-password-title">Set a new password</h1><p>Choose a new password for your EcoMetric account.</p></div>
        {!ready && !error && <p className="auth3-message">Validating your reset link…</p>}
        {ready && <form className="auth-form" onSubmit={submit}>
          <label htmlFor="new-password">New password</label>
          <div className="input-with-icon"><Lock01 size={17} /><input id="new-password" type="password" autoComplete="new-password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <label htmlFor="confirm-password">Confirm password</label>
          <div className="input-with-icon"><Lock01 size={17} /><input id="confirm-password" type="password" autoComplete="new-password" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
          <button className="auth3-submit" type="submit">Update password</button>
        </form>}
        {error && <p className="auth3-message auth3-error" role="alert">{error}</p>}
        {message && <p className="auth3-message">{message}</p>}
      </section>
    </main>
  );
}
