'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LocationCard from '@/components/LocationCard';
import { api, Location, User } from '@/lib/api';

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((userData) => {
        setUser(userData);
        return api.getFavorites();
      })
      .then(setFavorites)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header />
        <div className="favorites-empty">
          <h2>Sign in to see your saved places</h2>
          <p style={{ marginTop: 16 }}>
            <Link href="/auth/login" className="btn btn--primary">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Saved Places</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <h2>No saved places yet</h2>
          <p>Start exploring and save your favorite restaurants!</p>
        </div>
      ) : (
        <div className="location-grid">
          {favorites.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}
