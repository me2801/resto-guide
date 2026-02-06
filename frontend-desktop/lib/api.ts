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
}

export interface User {
  id: string;
  email: string;
  roles?: string[];
}

export interface StorageInfo {
  bucket: string;
  maxFileSize: number;
  maxFileSizeMB: number;
  allowedTypes: string[];
  idealSizes: {
    hero: { width: number; height: number; description: string };
    gallery: { width: number; height: number; description: string };
    thumbnail: { width: number; height: number; description: string };
  };
}

export interface UploadResult {
  url: string;
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
  getLocations: () => apiFetch<Location[]>('/admin/locations'),

  getLocation: (id: string) => apiFetch<Location>(`/locations/${id}`),

  // User
  getMe: () => apiFetch<User>('/me'),

  // Admin
  admin: {
    createTag: (data: Partial<Tag>) =>
      apiFetch<Tag>('/admin/tags', { method: 'POST', body: JSON.stringify(data) }),
    updateTag: (id: string, data: Partial<Tag>) =>
      apiFetch<Tag>(`/admin/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTag: (id: string) =>
      apiFetch<{ message: string }>(`/admin/tags/${id}`, { method: 'DELETE' }),

    createLocation: (data: Partial<Location> & { tag_ids?: string[] }) =>
      apiFetch<Location>('/admin/locations', { method: 'POST', body: JSON.stringify(data) }),
    updateLocation: (id: string, data: Partial<Location> & { tag_ids?: string[] }) =>
      apiFetch<Location>(`/admin/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLocation: (id: string) =>
      apiFetch<{ message: string }>(`/admin/locations/${id}`, { method: 'DELETE' }),

    lookupAddress: (params: { postcode: string; house_number: string; house_number_addition?: string }) =>
      apiFetch<{
        street: string | null;
        city: string | null;
        postcode: string | null;
        house_number: string | null;
        house_number_addition: string | null;
        lat: number | null;
        lng: number | null;
        address: string | null;
      }>('/admin/address-lookup', { params }),

    // Storage
    getStorageInfo: () => apiFetch<StorageInfo>('/admin/storage/info'),

    uploadImage: async (file: File, folder: string = 'general'): Promise<UploadResult> => {
      debug.log(`Uploading image: ${file.name} (${file.size} bytes) to ${folder}`);

      const response = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-File-Type': file.type,
          'X-Folder': folder,
        },
        body: file,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },

    deleteImage: (url: string) =>
      apiFetch<{ message: string }>('/admin/upload', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
      }),
  },
};

export async function logout(): Promise<void> {
  debug.log('Logging out...');
  const res = await fetch(withBase('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
  debug.log('Logout response:', res.status);
}
