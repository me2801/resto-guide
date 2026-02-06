'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/mobile/Header';
import LandingPage from '@/components/mobile/LandingPage';
import CitySelector from '@/components/mobile/CitySelector';
import FilterBar from '@/components/mobile/FilterBar';
import LocationCard from '@/components/mobile/LocationCard';
import Map from '@/components/mobile/Map';
import { api, City, Tag, Location, User } from '@/lib/mobile/api';
import { withBase } from '@/lib/basePath';

type ViewMode = 'list' | 'map';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([1, 4]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Check auth status
  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Load initial data when authenticated
  useEffect(() => {
    if (!authChecked || !user) return;

    Promise.all([api.getCities(), api.getTags()])
      .then(([citiesData, tagsData]) => {
        setCities(citiesData);
        setTags(tagsData);
      })
      .catch((err) => setError(err.message));
  }, [authChecked, user]);

  // Load locations when filters change
  useEffect(() => {
    if (!authChecked || !user) return;

    setLoading(true);
    api
      .getLocations({
        city: selectedCity || undefined,
        tag_slugs: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        price_min: priceRange[0],
        price_max: priceRange[1],
      })
      .then(setLocations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authChecked, user, selectedCity, selectedTags, priceRange]);

  const handleTagToggle = useCallback((slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const handleLocationClick = useCallback(
    (locationId: string) => {
      router.push(withBase(`/mobile/location/${locationId}`));
    },
    [router]
  );

  // Show nothing while checking auth
  if (!authChecked) {
    return null;
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show discover page for authenticated users
  return (
    <div>
      <Header />

      <CitySelector
        cities={cities}
        selectedCity={selectedCity}
        onSelect={setSelectedCity}
      />

      <div className="toolbar">
        <div className="toolbar__inner">
          <FilterBar
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
          />
          <div className="view-toggle">
            <button
              className={`view-toggle__btn ${viewMode === 'list' ? 'view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`view-toggle__btn ${viewMode === 'map' ? 'view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {viewMode === 'list' ? (
        <div className="location-grid">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="loading">No locations found</div>
          ) : (
            locations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))
          )}
        </div>
      ) : (
        <Map locations={locations} onLocationClick={handleLocationClick} />
      )}
    </div>
  );
}
