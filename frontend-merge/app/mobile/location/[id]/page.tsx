import LocationDetailClient from './location-detail-client';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  if (!API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/locations`, { cache: 'no-store' });
    if (!res.ok) return [];
    const locations = await res.json();
    return Array.isArray(locations) ? locations.map((loc) => ({ id: loc.id })) : [];
  } catch {
    return [];
  }
}

export default function LocationDetailPage({ params }: { params: { id: string } }) {
  return <LocationDetailClient id={params.id} />;
}
