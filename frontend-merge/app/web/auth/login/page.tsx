import { Suspense } from 'react';
import WebLoginClient from './login-client';

export default function WebLoginPage() {
  return (
    <Suspense fallback={<div className="admin-loading">Loading...</div>}>
      <WebLoginClient />
    </Suspense>
  );
}
