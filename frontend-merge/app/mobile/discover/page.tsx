'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/mobile/Header';
import LocationCard from '@/components/mobile/LocationCard';
import { api, Location } from '@/lib/mobile/api';

function randomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffleLocations(items: Location[]): Location[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DiscoverPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api
      .getLocations()
      .then((data) => {
        if (!isMounted) return;
        let shuffled = shuffleLocations(data);
        if (typeof sessionStorage !== 'undefined' && shuffled.length > 1) {
          const lastOrder = sessionStorage.getItem('discover-order');
          const newOrder = shuffled.map((loc) => loc.id).join(',');
          if (lastOrder && lastOrder === newOrder) {
            shuffled = shuffleLocations(data);
          }
          sessionStorage.setItem('discover-order', shuffled.map((loc) => loc.id).join(','));
        }
        setLocations(shuffled);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load locations');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const emptyState = useMemo(() => {
    if (loading) return 'Loading...';
    if (error) return error;
    return locations.length === 0 ? 'No locations found' : null;
  }, [loading, error, locations.length]);

  return (
    <div>
      <Header />

      {emptyState ? (
        <div className={error ? 'error' : 'loading'}>{emptyState}</div>
      ) : (
        <div className="location-grid">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}
