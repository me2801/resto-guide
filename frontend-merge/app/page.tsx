'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withBase } from '@/lib/basePath';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(withBase('/mobile'));
  }, [router]);

  return null;
}
