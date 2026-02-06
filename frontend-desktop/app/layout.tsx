'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, logout, User } from '@/lib/api';
import { withBase } from '@/lib/basePath';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((userData) => {
        setUser(userData);
        if (!userData.roles?.includes('admin')) {
          window.location.href = withBase('/auth/login?error=not_admin');
        }
      })
      .catch(() => {
        window.location.href = withBase('/auth/login');
      })
      .finally(() => setLoading(false));
  }, []);

  const isActive = (target: string) =>
    pathname.replace(/\/$/, '') === withBase(target).replace(/\/$/, '');

  const handleLogout = async () => {
    await logout();
    window.location.href = withBase('/auth/login');
  };

  if (loading) {
    return (
      <html lang="en">
        <head>
          <title>Resto Admin</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <div className="admin-layout">
            <div className="admin-loading">Loading</div>
          </div>
        </body>
      </html>
    );
  }

  if (!user?.roles?.includes('admin')) {
    return null;
  }

  return (
    <html lang="en">
      <head>
        <title>Resto Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar__brand">
              <span className="admin-sidebar__logo">🍽️</span>
              <span>Resto Admin</span>
            </div>
            <nav className="admin-sidebar__nav">
              <Link
                href={withBase('/')}
                className={`admin-sidebar__link ${isActive('/') ? 'admin-sidebar__link--active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                href={withBase('/tags')}
                className={`admin-sidebar__link ${isActive('/tags') ? 'admin-sidebar__link--active' : ''}`}
              >
                Tags
              </Link>
              <Link
                href={withBase('/locations')}
                className={`admin-sidebar__link ${isActive('/locations') ? 'admin-sidebar__link--active' : ''}`}
              >
                Locations
              </Link>
            </nav>
            <div className="admin-sidebar__footer">
              <span className="admin-sidebar__link admin-sidebar__link--muted">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="admin-sidebar__link admin-sidebar__link--muted"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                Logout
              </button>
            </div>
          </aside>
          <main className="admin-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
