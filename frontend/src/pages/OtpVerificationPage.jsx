import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayersTwo01 } from '@untitledui/icons';
import { supabase } from '../lib/supabase';
import BrandLogo from '../components/BrandLogo';

const OTP_LIFETIME_SECONDS = 100;

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [email] = useState(() => window.sessionStorage.getItem('pending_otp_email') || '');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(OTP_LIFETIME_SECONDS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
      return undefined;
    }
    inputRefs.current[0]?.focus();
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [email, navigate]);

  async function verify(event) {
    event.preventDefault();
    if (code.length !== 6 || !supabase) return;
    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    window.localStorage.setItem('ecometric_session_login_time', Date.now().toString());
    window.sessionStorage.removeItem('pending_otp_email');
    navigate('/app', { replace: true });
  }

  async function resend() {
    if (!supabase || secondsLeft > 0) return;
    setBusy(true);
    setError('');
    setMessage('');
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setCode('');
    setSecondsLeft(OTP_LIFETIME_SECONDS);
    setMessage('A new verification code was sent.');
    inputRefs.current[0]?.focus();
  }

  function updateDigit(index, value) {
    const digits = code.padEnd(6, ' ').split('');
    digits[index] = value.replace(/\D/g, '').slice(-1);
    const nextCode = digits.join('').replace(/\s/g, '');
    setCode(nextCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pastedCode);
    setError('');
    inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
  }

  return (
    <main className="auth3-page auth3-page--otp">
      <section className="otp-card" aria-labelledby="otp-title">
        <div className="otp-mark"><BrandLogo /></div>
        <p className="eyebrow">Secure sign in</p>
        <h1 id="otp-title">Check your email</h1>
        <p className="otp-description">Enter the 6-digit code we sent to <strong>{email}</strong>. It expires in 100 seconds.</p>
        <form onSubmit={verify}>
          <label className="sr-only" htmlFor="otp-code">6-digit verification code</label>
          <div className="otp-inputs">
            {Array.from({ length: 6 }, (_, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                className={code[index] ? 'filled' : ''}
                value={code[index] || ''}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                inputMode="numeric"
                maxLength="1"
                aria-label={`Verification digit ${index + 1}`}
              />
            ))}
          </div>
          <button className="auth3-submit otp-submit" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : 'Verify code'}</button>
        </form>
        {error && <p className="auth3-message auth3-error" role="alert">{error}</p>}
        {message && <p className="auth3-message">{message}</p>}
        {secondsLeft > 0 ? <p className="otp-resend">Didn't receive it? Resend in {secondsLeft}s</p> : <button className="otp-resend otp-resend-button" type="button" onClick={resend} disabled={busy}>{busy ? 'Sending…' : 'Resend Otp'}</button>}
        <button className="otp-back" type="button" onClick={() => navigate('/login')}><ArrowLeft size={16} /> Back to sign in</button>
      </section>
    </main>
  );
}
