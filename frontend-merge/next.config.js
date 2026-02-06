/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const publicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const publicRestoTag = process.env.NEXT_PUBLIC_RESTO_TAG || process.env.RESTO_TAG || '';

const nextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  output: 'export',
  env: {
    NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnonKey,
    NEXT_PUBLIC_RESTO_TAG: publicRestoTag,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
