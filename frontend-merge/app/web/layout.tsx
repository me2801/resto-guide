'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, logout, User } from '@/lib/web/api';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const basePath = '/web';

  useEffect(() => {
    api.getMe()
      .then((userData) => {
        setUser(userData);
        if (!userData.roles?.includes('admin')) {
          window.location.href = `${basePath}/auth/login?error=not_admin`;
        }
      })
      .catch(() => {
        window.location.href = `${basePath}/auth/login`;
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = `${basePath}/auth/login`;
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="admin-loading">Loading</div>
      </div>
    );
  }

  if (!user?.roles?.includes('admin')) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">🍽️</span>
          <span>Resto Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          <Link
            href={basePath}
            className={`admin-sidebar__link ${pathname === basePath ? 'admin-sidebar__link--active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            href={`${basePath}/tags`}
            className={`admin-sidebar__link ${pathname === `${basePath}/tags` ? 'admin-sidebar__link--active' : ''}`}
          >
            Tags
          </Link>
          <Link
            href={`${basePath}/locations`}
            className={`admin-sidebar__link ${pathname === `${basePath}/locations` ? 'admin-sidebar__link--active' : ''}`}
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
  );
}
