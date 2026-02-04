'use client';

import Link from 'next/link';
import { Location } from '@/lib/api';

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const priceDisplay = location.price_level
    ? '$'.repeat(location.price_level)
    : null;

  return (
    <Link href={`/location/${location.id}`} className="card">
      {location.hero_image_url && (
        <img
          src={location.hero_image_url}
          alt={location.name}
          className="card__image"
        />
      )}
      <div className="card__body">
        <h3 className="card__title">{location.name}</h3>
        <p className="card__subtitle">
          {location.city || ''}
          {priceDisplay && <span className="price"> · {priceDisplay}</span>}
        </p>
        {location.tags && location.tags.length > 0 && (
          <div className="chips">
            {location.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className={`chip chip--${tag.kind}`}
                style={{ cursor: 'default' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
