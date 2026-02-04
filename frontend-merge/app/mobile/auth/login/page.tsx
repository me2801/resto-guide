import { Suspense } from 'react';
import MobileLoginClient from './login-client';

export default function MobileLoginPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <MobileLoginClient />
    </Suspense>
  );
}
