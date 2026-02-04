'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__content">
          <span className="landing__icon">🍽️</span>
          <h1 className="landing__title">
            Discover Your Next
            <br />
            Favorite Restaurant
          </h1>
          <p className="landing__subtitle">
            Curated restaurants in Dutch cities. Find hidden gems, save your
            favorites, and explore local cuisine with personalized
            recommendations.
          </p>
          <div className="landing__cta">
            <Link href="/auth/login" className="btn btn--primary">
              Sign In to Start
            </Link>
            <Link href="/discover" className="btn btn--secondary">
              Browse Restaurants
            </Link>
          </div>
        </div>
      </section>

      <section className="landing__features">
        <div className="landing__feature">
          <span className="landing__feature-icon">📍</span>
          <h3 className="landing__feature-title">Local Favorites</h3>
          <p className="landing__feature-desc">
            Handpicked restaurants from Amsterdam, Rotterdam, Utrecht, and more
            Dutch cities.
          </p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">❤️</span>
          <h3 className="landing__feature-title">Save & Share</h3>
          <p className="landing__feature-desc">
            Build your personal collection of favorite spots and share with
            friends.
          </p>
        </div>
        <div className="landing__feature">
          <span className="landing__feature-icon">🗺️</span>
          <h3 className="landing__feature-title">Map View</h3>
          <p className="landing__feature-desc">
            Explore restaurants on an interactive map to find places nearby.
          </p>
        </div>
      </section>
    </div>
  );
}
