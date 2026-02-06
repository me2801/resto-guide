import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export const appTag = (process.env.NEXT_PUBLIC_RESTO_TAG || '').trim();

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}

export async function getAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token || null;
}

function normalizeHiddenTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag));
  if (typeof tags === 'string' && tags.trim()) return [tags.trim()];
  return [];
}

export function getHiddenTags(user: User | null | undefined): string[] {
  if (!user) return [];
  const appMetadata = (user.app_metadata || {}) as Record<string, unknown>;
  return normalizeHiddenTags(appMetadata.hidden_tags);
}

export function hasAppAccess(user: User | null | undefined): boolean {
  if (!appTag) return true;
  const tags = getHiddenTags(user).map((tag) => tag.toLowerCase());
  return tags.includes(appTag.toLowerCase());
}
