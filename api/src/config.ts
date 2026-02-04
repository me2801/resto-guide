import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  debug: process.env.DEBUG === 'true',
  databaseUrl: process.env.SUPABASE_DB_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  sessionSecret: process.env.METASUITE_SESSION_SECRET || 'dev-secret-change-in-production',
  cookieName: process.env.METASUITE_SESSION_COOKIE_NAME || 'metasuite_session',
  secureCookies: process.env.METASUITE_SECURE_COOKIES === 'true',
  dbPrefix: process.env.DB_PREFIX || 'resto_poc_',
  // TODO: hardcoded fallback for Render test; replace with envs when confirmed.
  frontendUrl: process.env.FRONTEND_URL || 'https://resto-guide.onrender.com',
  frontendUrls: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_MOBILE_URL,
    process.env.FRONTEND_WEB_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
  ]
    .map((url) => (url || '').trim())
    .filter(Boolean),
};

// Debug logger
export const debug = {
  log: (...args: any[]) => {
    if (config.debug) console.log('[DEBUG]', ...args);
  },
  error: (...args: any[]) => {
    if (config.debug) console.error('[DEBUG ERROR]', ...args);
  },
  info: (...args: any[]) => {
    if (config.debug) console.info('[DEBUG INFO]', ...args);
  },
};

export function getTableName(table: string): string {
  return `${config.dbPrefix}${table}`;
}
