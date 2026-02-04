'use client';

import { useEffect } from 'react';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export default function MobileLogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'GET',
          credentials: 'include',
        });
      } finally {
        window.location.href = '/mobile';
      }
    };

    logout();
  }, []);

  return <div className="loading">Signing out...</div>;
}
