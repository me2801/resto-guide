'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/basePath';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function WebLogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
      } finally {
        window.location.href = withBase('/web/auth/login');
      }
    };

    logout();
  }, []);

  return <div className="admin-loading">Signing out...</div>;
}
