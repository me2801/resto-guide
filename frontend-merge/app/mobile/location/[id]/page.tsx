import LocationDetailClient from './location-detail-client';
import { withBase } from '@/lib/basePath';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || withBase('/api')).replace(/\/$/, '');
const STATIC_LOCATION_IDS = (process.env.NEXT_PUBLIC_STATIC_LOCATION_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const FALLBACK_PARAMS = STATIC_LOCATION_IDS.map((id) => ({ id }));
const ensureParams = (params: { id: string }[]) =>
  params.length ? params : FALLBACK_PARAMS.length ? FALLBACK_PARAMS : [{ id: 'placeholder' }];

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  if (!API_BASE) return ensureParams([]);
  try {
    const res = await fetch(`${API_BASE}/locations`, { cache: 'no-store' });
    if (!res.ok) return ensureParams([]);
    const locations = await res.json();
    const params = Array.isArray(locations)
      ? locations.map((loc) => ({ id: String(loc.id) }))
      : [];
    return ensureParams(params);
  } catch {
    return ensureParams([]);
  }
}

export default function LocationDetailPage({ params }: { params: { id: string } }) {
  return <LocationDetailClient id={params.id} />;
}
