'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/basePath';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
const AUTH_BASE = API_BASE ? API_BASE.replace(/\/api\/?$/, '') : '';

export default function WebLogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        const authUrl = AUTH_BASE ? `${AUTH_BASE}/auth/logout` : withBase('/auth/logout');
        await fetch(authUrl, {
          method: 'GET',
          credentials: 'include',
        });
      } finally {
        window.location.href = withBase('/web/auth/login');
      }
    };

    logout();
  }, []);

  return <div className="admin-loading">Signing out...</div>;
}
