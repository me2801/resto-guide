import { debug } from './debug';
import { withBase } from './basePath';

// Use base-path aware relative paths - Next.js rewrites will proxy to API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || withBase('/api');

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  debug.log(`API Request: ${fetchOptions.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  debug.log(`API Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    debug.error(`API Error:`, error);
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  debug.log(`API Data:`, data);
  return data;
}

// Types
export interface City {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  kind: 'cuisine' | 'vibe';
  name: string;
  slug: string;
}

export interface Location {
  id: string;
  city: string | null;
  street: string | null;
  house_number: string | null;
  house_number_addition: string | null;
  postcode: string | null;
  name: string;
  slug: string;
  description: string | null;
  why_curated: string | null;
  price_level: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  hero_image_url: string | null;
  gallery_urls: string[];
  is_published: boolean;
  featured_rank: number | null;
  created_at: string;
  tags?: Tag[];
  favorited_at?: string;
}

export interface User {
  id: string;
  email: string;
  roles?: string[];
}

// API functions
export const api = {
  // Health
  health: () => apiFetch<{ status: string; timestamp: string }>('/health'),

  // Cities
  getCities: () => apiFetch<City[]>('/cities'),

  // Tags
  getTags: () => apiFetch<Tag[]>('/tags'),

  // Locations
  getLocations: (params?: {
    city?: string;
    bbox?: string;
    tag_slugs?: string;
    price_min?: number;
    price_max?: number;
  }) => apiFetch<Location[]>('/locations', { params }),

  getLocation: (id: string) => apiFetch<Location>(`/locations/${id}`),

  // User
  getMe: () => apiFetch<User>('/me'),

  getFavorites: () => apiFetch<Location[]>('/me/favorites'),

  addFavorite: (locationId: string) =>
    apiFetch<{ message: string }>(`/me/favorites/${locationId}`, { method: 'POST' }),

  removeFavorite: (locationId: string) =>
    apiFetch<{ message: string }>(`/me/favorites/${locationId}`, { method: 'DELETE' }),
};
