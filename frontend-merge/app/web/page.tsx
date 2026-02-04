'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/web/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tags: 0, locations: 0, cities: 0 });

  useEffect(() => {
    Promise.all([api.getTags(), api.getLocations()])
      .then(([tags, locations]) => {
        const cityCount = new Set(
          locations
            .map((loc) => (loc.city || '').trim().toLowerCase())
            .filter(Boolean)
        ).size;
        setStats({
          tags: tags.length,
          locations: locations.length,
          cities: cityCount,
        });
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Overview of your restaurant directory</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__label">Tags</div>
          <div className="admin-stat-card__value">{stats.tags}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__label">Cities</div>
          <div className="admin-stat-card__value">{stats.cities}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__label">Locations</div>
          <div className="admin-stat-card__value">{stats.locations}</div>
        </div>
      </div>
    </div>
  );
}
