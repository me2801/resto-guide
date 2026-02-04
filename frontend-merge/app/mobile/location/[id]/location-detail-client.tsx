'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/mobile/Header';
import { api, Location, User } from '@/lib/mobile/api';

export default function LocationDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [location, setLocation] = useState<Location | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load location
    api.getLocation(id)
      .then(setLocation)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Check if user is logged in and if location is favorited
    api.getMe()
      .then((userData) => {
        setUser(userData);
        return api.getFavorites();
      })
      .then((favorites) => {
        setIsFavorite(favorites.some((f) => f.id === id));
      })
      .catch(() => setUser(null));
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/mobile/auth/login';
      return;
    }

    setSaving(true);
    try {
      if (isFavorite) {
        await api.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await api.addFavorite(id);
        setIsFavorite(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div>
        <Header />
        <div className="error">{error || 'Location not found'}</div>
      </div>
    );
  }

  const priceDisplay = location.price_level
    ? '$'.repeat(location.price_level)
    : null;

  const streetLine = [
    location.street,
    location.house_number ? `${location.house_number}${location.house_number_addition || ''}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  const cityLine = [location.postcode, location.city].filter(Boolean).join(' ').trim();

  return (
    <div>
      <Header />

      {location.hero_image_url && (
        <img
          src={location.hero_image_url}
          alt={location.name}
          className="detail-hero"
        />
      )}

      <div className="detail-content">
        <div className="detail-header">
          <div>
            <h1 className="detail-title">{location.name}</h1>
            <p className="detail-address">
              {location.city || ''}
              {priceDisplay && <span className="price"> · {priceDisplay}</span>}
            </p>
          </div>
          <button
            className={`btn btn--small ${isFavorite ? 'btn--primary' : 'btn--secondary'}`}
            onClick={handleToggleFavorite}
            disabled={saving}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </button>
        </div>

        {(streetLine || cityLine || location.address) && (
          <div>
            {streetLine && <p className="detail-address">{streetLine}</p>}
            {cityLine && <p className="detail-address">{cityLine}</p>}
            {!streetLine && !cityLine && location.address && (
              <p className="detail-address">{location.address}</p>
            )}
          </div>
        )}

        {location.tags && location.tags.length > 0 && (
          <div className="detail-section">
            <div className="chips">
              {location.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`chip chip--${tag.kind}`}
                  style={{ cursor: 'default' }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {location.why_curated && (
          <div className="detail-section">
            <h2 className="detail-section__title">Why This Place</h2>
            <p className="detail-section__content">{location.why_curated}</p>
          </div>
        )}

        {location.description && (
          <div className="detail-section">
            <h2 className="detail-section__title">About</h2>
            <p className="detail-section__content">{location.description}</p>
          </div>
        )}

        {location.gallery_urls && location.gallery_urls.length > 0 && (
          <div className="detail-section">
            <h2 className="detail-section__title">Gallery</h2>
            <div className="gallery">
              {location.gallery_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${location.name} ${index + 1}`}
                  className="gallery__image"
                />
              ))}
            </div>
          </div>
        )}

        <button className="btn btn--ghost" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>
    </div>
  );
}
