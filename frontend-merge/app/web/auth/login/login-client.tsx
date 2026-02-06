'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { withBase } from '@/lib/basePath';
import { getSupabaseClient, hasAppAccess } from '@/lib/supabaseClient';

export default function WebLoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorParam = searchParams.get('error');
  const invalidCredsMessage = 'Invalid email or password.';

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next || withBase('/web');
  }, [searchParams]);

  useEffect(() => {
    if (!error && errorParam?.startsWith('not_allowed')) {
      setError(invalidCredsMessage);
    }
  }, [error, errorParam, invalidCredsMessage]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const client = getSupabaseClient();
      if (!client) {
        setError('Supabase is not configured.');
        return;
      }
      const { data, error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !data?.user) {
        setError(invalidCredsMessage);
        return;
      }
      if (!hasAppAccess(data.user)) {
        await client.auth.signOut();
        setError(invalidCredsMessage);
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-web">
      <div className="auth-web__card">
        <div className="auth-web__header">
          <div className="auth-web__brand">Resto Admin</div>
          <h1>Sign In</h1>
          <p>Manage curated restaurants</p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
          <a className="btn btn--ghost" href={withBase('/web')} style={{ marginLeft: 8 }}>
            Back to dashboard
          </a>
        </form>
      </div>
    </div>
  );
}
