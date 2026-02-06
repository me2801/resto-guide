'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/mobile/api';
import { withBase } from '@/lib/basePath';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
const AUTH_BASE = API_BASE ? API_BASE.replace(/\/api\/?$/, '') : '';

export default function MobileLoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next || withBase('/mobile');
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const authUrl = AUTH_BASE ? `${AUTH_BASE}/auth/api/login` : withBase('/auth/api/login');
      const res = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, next: nextPath }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Authentication failed.');
        setAuthToken(null);
        return;
      }
      if (payload?.token) {
        setAuthToken(payload.token);
      } else {
        setAuthToken(null);
      }
      window.location.href = payload.redirect || nextPath;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">Resto</span>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Discover curated restaurants</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <a className="auth-link" href={withBase('/mobile')}>Back to home</a>
        </div>
      </div>
    </div>
  );
}
