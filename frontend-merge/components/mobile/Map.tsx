'use client';

import { useEffect, useRef, useState } from 'react';
import { Location } from '@/lib/mobile/api';

interface MapProps {
  locations: Location[];
  onBoundsChange?: (bbox: string) => void;
  onLocationClick?: (locationId: string) => void;
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default function Map({ locations, onBoundsChange, onLocationClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const mapbox = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Mapbox GL JS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return;
    }

    // Load Mapbox CSS
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    const initMapbox = () => {
      mapbox.current = window.mapboxgl;
      mapbox.current.accessToken = mapboxToken;
      initMap();
    };

    // Load Mapbox JS
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js';
      script.onload = initMapbox;
      document.head.appendChild(script);
    } else {
      initMapbox();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapContainer.current || map.current) return;

    if (!mapbox.current) return;
    const mapboxInstance = mapbox.current;

    map.current = new mapboxInstance.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [4.9, 52.37], // Netherlands center
      zoom: 7,
    });

    map.current.addControl(new mapboxInstance.NavigationControl());

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('moveend', () => {
      if (onBoundsChange) {
        const bounds = map.current.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
        onBoundsChange(bbox);
      }
    });
  };

  // Update markers when locations change
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapbox.current) return;
    const mapboxInstance = mapbox.current;

    // Clear existing markers
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    // Add new markers (only with valid numeric coordinates)
    const toNumber = (value: unknown) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const validLocations = locations
      .map((location) => {
        const lat = toNumber(location.lat);
        const lng = toNumber(location.lng);
        return {
          location,
          lat,
          lng,
        };
      })
      .filter(
        (loc): loc is { location: Location; lat: number; lng: number } =>
          loc.lat !== null &&
          loc.lng !== null &&
          Math.abs(loc.lat) <= 90 &&
          Math.abs(loc.lng) <= 180
      );

    validLocations.forEach(({ location, lat, lng }) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: #2563eb;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      `;
      el.innerHTML = location.price_level ? '$'.repeat(location.price_level) : '';

      el.addEventListener('click', () => {
        if (onLocationClick) {
          onLocationClick(location.id);
        }
      });

      const marker = new mapboxInstance.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxInstance.Popup({ offset: 25 }).setHTML(`
            <strong>${location.name}</strong>
            <br/>
            <small>${location.city || ''}</small>
          `)
        )
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validLocations.length > 0) {
      const coords = validLocations.map(({ lat, lng }) => [lng, lat] as [number, number]);
      let [minLng, minLat] = coords[0];
      let [maxLng, maxLat] = coords[0];

      coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });

      if (
        Number.isFinite(minLng) &&
        Number.isFinite(maxLng) &&
        Number.isFinite(minLat) &&
        Number.isFinite(maxLat)
      ) {
        const bounds: [[number, number], [number, number]] = [
          [minLng, minLat],
          [maxLng, maxLat],
        ];
        try {
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        } catch (error) {
          console.warn('Map fitBounds failed, falling back to center', error);
          const [lng, lat] = coords[0];
          map.current.easeTo({
            center: [lng, lat],
            zoom: Math.min(14, map.current.getZoom?.() ?? 14),
          });
        }
      }
    }
  }, [locations, mapLoaded, onLocationClick]);

  return <div ref={mapContainer} className="map-container" />;
}
