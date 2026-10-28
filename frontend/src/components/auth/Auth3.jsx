import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LayersTwo01, Lock01, Mail01 } from '@untitledui/icons';
import { supabase } from '../../lib/supabase';
import Input from '../base/input/input';
import BrandLogo from '../BrandLogo';

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

  // Check if account is already logged in on mount; if so, directly redirect to main console
  useEffect(() => {
    if (!supabase) return;

    // Check if previous presence session expired after 24 hours
    const storedLoginTime = window.localStorage.getItem('ecometric_session_login_time');
    if (storedLoginTime) {
      const elapsed = Date.now() - parseInt(storedLoginTime, 10);
      if (elapsed >= 24 * 60 * 60 * 1000) {
        window.localStorage.removeItem('ecometric_session_login_time');
        supabase.auth.signOut().catch(() => {});
        setMessage('Your presence session expired after 24 hours. Please log in again.');
        return;
      }
    }

    if (location.search.includes('session_expired')) {
      setMessage('Your presence session expired after 24 hours. Please log in again.');
    }

    // Direct redirect to main console if valid active session exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/app', { replace: true });
      }
    });
  }, [navigate, location.search]);

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

    // 1. Check whether account exists in database
    let accountExists = null;
    try {
      const { data, error: accountCheckError } = await supabase.rpc('account_exists', {
        user_email: normalizedEmail,
      });
      if (!accountCheckError) {
        accountExists = data;
      }
    } catch (err) {
      console.warn('account_exists check warning:', err);
    }

    // If account not found in DB
    if (mode === 'signin' && accountExists === false) {
      setBusy(false);
      setError('Account not found. Create an account first.');
      return;
    }

    // If signup requested for existing account
    if (mode === 'signup' && accountExists === true) {
      setBusy(false);
      navigate('/login', {
        replace: true,
        state: { email: normalizedEmail, message: 'This account already exists. Log in or reset your password.' },
      });
      return;
    }

    // 2. Sign In Execution: if account exists in DB, directly authenticate and redirect to main console
    if (mode === 'signin') {
      // If user typed a password, sign in immediately with password
      if (form.password && form.password.trim()) {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: form.password,
        });

        if (signInError) {
          setBusy(false);
          setError(signInError.message);
          return;
        }

        // Stamp 24-hr presence timestamp
        window.localStorage.setItem('ecometric_session_login_time', Date.now().toString());
        setBusy(false);

        // Directly redirect to main console
        navigate('/app', { replace: true });
        return;
      }

      // Password omitted -> send OTP code
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

    // 3. Sign Up Execution
    const result = await supabase.auth.signUp({
      email: normalizedEmail,
      password: form.password,
      options: {
        data: {
          full_name: form.email.split('@')[0],
          organization_name: form.organizationName || 'EcoMetric Organization',
        },
      },
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

    if (result.data.session) {
      // Direct session returned (email confirmation disabled or auto-confirmed)
      window.localStorage.setItem('ecometric_session_login_time', Date.now().toString());
      navigate('/app', { replace: true });
      return;
    }

    if (mode === 'signup') {
      setMessage('Check your email to confirm your account. Your organization will be ready upon verification.');
    }
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
      window.sessionStorage.setItem('pending_organization_name', form.organizationName.trim());
    }
    // Stamp 24-hr presence timestamp for OAuth session
    window.localStorage.setItem('ecometric_session_login_time', Date.now().toString());
    setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (authError) setError(authError.message);
  }

  return (
    <main className={`auth3-page ${mode === 'signup' ? 'auth3-page--signup' : ''}`}>
      <video
        className="auth3-video-background"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <section key={mode} className={`auth3-card ${mode === 'signup' ? 'auth3-card--signup' : ''}`} aria-labelledby="auth3-title">
        <div className="brand-lockup"><BrandLogo theme="light" height={26} /></div>
        <div className="auth-heading">
          <p className="eyebrow">EPD automation studio</p>
          <h1 id="auth3-title">{mode === 'signin' ? 'Log in' : 'Create your account'}</h1>
          {mode === 'signin' && <p>Continue your environmental product declaration work.</p>}
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <Input
              id="organizationName"
              label="Organization name"
              isRequired
              value={form.organizationName}
              onChange={update('organizationName')}
            />
          )}
          <Input
            id="email"
            label="Work email"
            type="email"
            autoComplete="email"
            isRequired
            value={form.email}
            onChange={update('email')}
            leadingIcon={Mail01}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            isRequired={mode === 'signup'}
            value={form.password}
            onChange={update('password')}
            leadingIcon={Lock01}
            hint={mode === 'signin' ? 'Enter password for direct login, or leave blank to receive an email code' : undefined}
          />
          <button className="auth3-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? (form.password ? 'Log in & Open Console' : 'Continue with Email Code') : 'Create account'}{' '}
            <ArrowRight size={17} />
          </button>
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
        <h2>Think<br />Green</h2>
        <p>Turn product evidence into accurate, audit-ready Environmental Product Declarations.</p>
      </section>
    </main>
  );
}
