import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LayersTwo01, Lock01, Mail01 } from '@untitledui/icons';
import { supabase } from '../../lib/supabase';

export default function Auth3({ initialMode = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode] = useState(initialMode);
  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: '',
    organizationName: '',
  });
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.local.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    const normalizedEmail = form.email.trim().toLowerCase();
    const { data: accountExists, error: accountCheckError } = await supabase.rpc('account_exists', {
      user_email: normalizedEmail,
    });
    if (accountCheckError) {
      setBusy(false);
      setError('Unable to verify this email right now. Please try again.');
      console.error('Unable to check whether the account exists', accountCheckError);
      return;
    }
    if (mode === 'signin' && !accountExists) {
      setBusy(false);
      setError('Account not found. Create an account first.');
      return;
    }
    if (mode === 'signup' && accountExists) {
      setBusy(false);
      navigate('/login', {
        replace: true,
        state: { email: normalizedEmail, message: 'This account already exists. Log in or reset your password.' },
      });
      return;
    }
    if (mode === 'signin') {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: false },
      });
      setBusy(false);
      if (otpError) {
        setError(otpError.message);
        return;
      }
      window.sessionStorage.setItem('pending_otp_email', normalizedEmail);
      navigate('/verify-otp');
      return;
    }

    const result = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: { data: { full_name: form.email.split('@')[0], organization_name: form.organizationName } },
    });
    setBusy(false);
    if (result.error) {
      if (mode === 'signup' && /already registered|already exists/i.test(result.error.message)) {
        navigate('/login', {
          replace: true,
          state: { email: form.email, message: 'This email is already registered. Sign in or reset your password.' },
        });
        return;
      }
      setError(result.error.message);
      return;
    }
    if (mode === 'signup' && result.data.user && result.data.user.identities?.length === 0) {
      navigate('/login', {
        replace: true,
        state: { email: form.email, message: 'This email is already registered. Sign in or reset your password.' },
      });
      return;
    }
    if (mode === 'signup') setMessage('Check your email to confirm your account. Your organization will be created after confirmation.');
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setError('Supabase is not configured. Add the required VITE_SUPABASE_* variables.');
      return;
    }
    if (mode === 'signup') {
      if (!form.organizationName.trim()) {
        setError('Enter your organization name before continuing with Google.');
        return;
      }
      const { data: accountExists, error: accountCheckError } = await supabase.rpc('account_exists', {
        user_email: form.email.trim().toLowerCase(),
      });
      if (accountCheckError) {
        setError('Unable to verify this email right now. Please try again.');
        console.error('Unable to check whether the Google account exists', accountCheckError);
        return;
      }
      if (accountExists) {
        navigate('/login', {
          replace: true,
          state: { email: form.email.trim().toLowerCase(), message: 'This account already exists. Log in or reset your password.' },
        });
        return;
      }
      window.sessionStorage.setItem('pending_organization_name', form.organizationName.trim());
    }
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <main className={`auth3-page ${mode === 'signup' ? 'auth3-page--signup' : ''}`}>
      <section key={mode} className={`auth3-card ${mode === 'signup' ? 'auth3-card--signup' : ''}`} aria-labelledby="auth3-title">
        <div className="brand-lockup"><span className="brand-mark"><LayersTwo01 size={20} /></span><span>EcoMetric</span></div>
        <div className="auth-heading">
          <p className="eyebrow">EPD automation studio</p>
          <h1 id="auth3-title">{mode === 'signin' ? 'Log in' : 'Create your account'}</h1>
          {mode === 'signin' && <p>Continue your environmental product declaration work.</p>}
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && <><label htmlFor="organizationName">Organization name</label><input id="organizationName" value={form.organizationName} onChange={update('organizationName')} required /></>}
          <label htmlFor="email">Work email</label>
          <div className="input-with-icon"><Mail01 size={17} /><input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} required /></div>
          {mode === 'signup' && <><label htmlFor="password">Password</label><div className="input-with-icon"><Lock01 size={17} /><input id="password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} minLength="8" required /></div></>}
          <button className="auth3-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Continue' : 'Create account'} <ArrowRight size={17} /></button>
        </form>
        <div className="auth3-divider"><span>Or</span></div>
        <button className="auth3-provider" type="button" onClick={signInWithGoogle}> <strong>G</strong> Sign in with Google</button>
        <button className="auth3-forgot" type="button" onClick={() => navigate('/forgot-password', { state: { email: form.email } })}>Forgot password?</button>
        {error && <p className="auth3-message auth3-error" role="alert">{error}</p>}
        {message && <p className="auth3-message">{message}</p>}
        <p className="auth3-switch">{mode === 'signin' ? 'New user?' : 'Already have an account?'} <button type="button" onClick={() => navigate(mode === 'signin' ? '/signup' : '/login')}>{mode === 'signin' ? 'Create an account' : 'Log in'}</button></p>
        {mode === 'signin' && <p className="auth-footnote">Access is managed by your EcoMetric organization administrator.</p>}
      </section>
      <section key={`intro-${mode}`} className={`auth3-intro ${mode === 'signup' ? 'auth3-intro--signup' : ''}`} aria-label="About EcoMetric">
        <p className="auth3-intro__eyebrow">Environmental intelligence platform</p>
        <h2>EcoMetric</h2>
        <p>Turn product evidence into accurate, audit-ready Environmental Product Declarations.</p>
      </section>
    </main>
  );
}
