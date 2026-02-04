'use client';

import { useRef, useState } from 'react';
import { City } from '@/lib/mobile/api';

interface CitySelectorProps {
  cities: City[];
  selectedCity: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CitySelector({ cities, selectedCity, onSelect }: CitySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    dragState.current = {
      isDown: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
    setIsDragging(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    const el = containerRef.current;
    if (!el) return;
    const walk = event.clientX - dragState.current.startX;
    if (!dragState.current.hasMoved) {
      if (Math.abs(walk) < 4) return;
      dragState.current.hasMoved = true;
      setIsDragging(true);
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // no-op
      }
    }
    el.scrollLeft = dragState.current.scrollLeft - walk;
    event.preventDefault();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    const shouldRelease = dragState.current.hasMoved;
    dragState.current.isDown = false;
    dragState.current.hasMoved = false;
    setIsDragging(false);
    if (shouldRelease) {
      try {
        containerRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`city-selector ${isDragging ? 'city-selector--dragging' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <button
        className={`chip ${!selectedCity ? 'chip--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All Cities
      </button>
      {cities.map((city) => (
        <button
          key={city.id}
          className={`chip ${selectedCity === city.slug ? 'chip--active' : ''}`}
          onClick={() => onSelect(city.slug)}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}
