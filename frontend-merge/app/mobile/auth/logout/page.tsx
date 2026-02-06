'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/basePath';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function MobileLogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.auth.signOut();
        }
      } finally {
        window.location.href = withBase('/mobile');
      }
    };

    logout();
  }, []);

  return <div className="loading">Signing out...</div>;
}
