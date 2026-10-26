import React, { useState } from 'react';
import { ArrowRight, LayersTwo01, Lock01, Mail01 } from '@untitledui/icons';
import { Button } from '../components/base/buttons/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="brand-lockup">
          <span className="brand-mark"><LayersTwo01 size={20} /></span>
          <span>EcoMetric</span>
        </div>
        <div className="auth-heading">
          <p className="eyebrow">EPD automation studio</p>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to continue your environmental product declaration work.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Work email</label>
          <div className="input-with-icon">
            <Mail01 size={17} />
            <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <label htmlFor="password">Password</label>
          <div className="input-with-icon">
            <Lock01 size={17} />
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className="auth-form-meta">
            <label className="checkbox-label"><input type="checkbox" /> Remember me</label>
            <a href="/login">Forgot password?</a>
          </div>
          <Button type="submit" size="lg" style={{ width: '100%' }} iconTrailing={ArrowRight}>Sign in</Button>
        </form>
        <p className="auth-footnote">Access is managed by your EcoMetric organization administrator.</p>
      </section>
    </main>
  );
}
