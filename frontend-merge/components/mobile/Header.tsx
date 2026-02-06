'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, User } from '@/lib/mobile/api';
import { withBase } from '@/lib/basePath';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Check for saved theme preference
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link href={withBase('/mobile')} className="header__logo">
          Resto
        </Link>
        <nav className="header__nav">
          {loading ? null : user ? (
            <>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <Link href={withBase('/mobile/favorites')} className="btn btn--ghost btn--small">
                Saved
              </Link>
              <Link href={withBase('/mobile/auth/logout')} className="btn btn--secondary btn--small">
                Logout
              </Link>
            </>
          ) : (
            <Link href={withBase('/mobile/auth/login')} className="btn btn--primary btn--small">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
