import { Router, type Request, type Response, type NextFunction } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AuthUser = {
  user_id: string;
  email: string;
  roles: string[];
  is_admin: boolean;
};

declare module 'express-session' {
  interface SessionData {
    auth?: AuthUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export type AuthConfig = {
  appName: string;
  appShortName: string;
  loginTitle: string;
  loginSubtitle: string;
  logoutTitle: string;
  logoutSubtitle: string;
  logoutRedirectDelayMs: number;
  homePath: string;
  loginPath: string;
  loginApiPath: string;
  logoutPath: string;
};

export const defaultAuthConfig: AuthConfig = {
  appName: 'Resto Discovery',
  appShortName: 'Resto',
  loginTitle: 'Sign In',
  loginSubtitle: 'Discover curated restaurants',
  logoutTitle: 'Signed Out',
  logoutSubtitle: 'You have been signed out.',
  logoutRedirectDelayMs: 1200,
  homePath: '/',
  loginPath: '/auth/login',
  loginApiPath: '/auth/api/login',
  logoutPath: '/auth/logout',
};

function supabaseUrl(): string {
  return (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
}

function supabaseAnonKey(): string {
  return (process.env.SUPABASE_ANON_KEY || '').trim();
}

function supabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export function isConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export function getSessionSecret(): string {
  return process.env.METASUITE_SESSION_SECRET || 'dev-secret-change-in-production';
}

export function getCookieName(): string {
  return process.env.METASUITE_SESSION_COOKIE_NAME
    || process.env.METASUITE_COOKIE_NAME
    || 'metasuite_session';
}

export function getSecureCookies(): boolean {
  const value = (process.env.METASUITE_SECURE_COOKIES || 'false').toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

export function getSessionConfig() {
  return {
    secret: getSessionSecret(),
    name: getCookieName(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: getSecureCookies(),
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };
}

class SupabaseAuthClient {
  private client: SupabaseClient;
  private adminClient: SupabaseClient | null = null;

  constructor(url?: string, anonKey?: string, serviceRoleKey?: string) {
    const _url = url || supabaseUrl();
    const _anonKey = anonKey || supabaseAnonKey();
    const _serviceKey = serviceRoleKey || supabaseServiceRoleKey();

    if (!_url || !_anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    this.client = createClient(_url, _anonKey);

    if (_serviceKey) {
      this.adminClient = createClient(_url, _serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return null;
    return data;
  }

  async validateToken(accessToken: string) {
    const { data: { user }, error } = await this.client.auth.getUser(accessToken);
    if (error || !user) return null;
    return user;
  }
}

let _client: SupabaseAuthClient | null = null;
export function getClient(url?: string, anonKey?: string, serviceRoleKey?: string): SupabaseAuthClient {
  if (url || anonKey || serviceRoleKey) {
    return new SupabaseAuthClient(url, anonKey, serviceRoleKey);
  }
  if (!_client) {
    _client = new SupabaseAuthClient();
  }
  return _client;
}

function normalizeRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) return roles.map(String);
  if (typeof roles === 'string' && roles.trim()) return [roles.trim()];
  return [];
}

function mapUser(user: any, fallbackEmail: string): AuthUser {
  const appMetadata = user?.app_metadata || {};
  const roles = normalizeRoles(appMetadata.roles);
  return {
    user_id: user.id,
    email: user.email || fallbackEmail,
    roles,
    is_admin: roles.map((r) => r.toLowerCase()).includes('admin'),
  };
}

export function getUser(req: Request): AuthUser | null {
  const authUser = req.authUser;
  if (authUser?.user_id) return authUser;

  const auth = (req.session as any)?.auth;
  if (auth && auth.user_id) return auth as AuthUser;
  return null;
}

export function getUserId(req: Request): string | null {
  return getUser(req)?.user_id ?? null;
}

export function getUserEmail(req: Request): string | null {
  return getUser(req)?.email ?? null;
}

export function getUserRoles(req: Request): string[] {
  return getUser(req)?.roles ?? [];
}

export function isAuthenticated(req: Request): boolean {
  return getUser(req) !== null;
}

export function isAdmin(req: Request): boolean {
  return getUser(req)?.is_admin ?? false;
}

async function authenticateBearer(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;

  if (!isConfigured()) return null;

  const client = getClient();
  const user = await client.validateToken(token);
  if (!user) return null;

  const authUser = mapUser(user, user.email || '');
  req.authUser = authUser;
  return authUser;
}

async function ensureAuthUser(req: Request): Promise<AuthUser | null> {
  const existing = getUser(req);
  if (existing) return existing;
  return authenticateBearer(req);
}

export function requireLogin(loginPath = '/login') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await ensureAuthUser(req);
    if (!user) {
      const nextUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`${loginPath}?next=${nextUrl}`);
    }
    next();
  };
}

export function requireAdmin(loginPath = '/login', homePath = '/') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await ensureAuthUser(req);
    if (!user) {
      const nextUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`${loginPath}?next=${nextUrl}`);
    }
    if (!user.is_admin) {
      return res.redirect(homePath);
    }
    next();
  };
}

export function requireAuthApi() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await ensureAuthUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    next();
  };
}

export function requireAdminApi() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await ensureAuthUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (!user.is_admin) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
  };
}

export function registerAuth(config: Partial<AuthConfig> = {}) {
  const cfg = { ...defaultAuthConfig, ...config };
  const router = Router();

  router.get(cfg.loginPath, (_req, res) => {
    res.status(204).end();
  });

  router.get(cfg.logoutPath, (req, res) => {
    if (req.session) {
      req.session.destroy(() => {});
    }
    res.json({ ok: true });
  });

  router.post(cfg.loginApiPath, async (req, res) => {
    const { email, password, next } = req.body || {};
    const redirectPath = next || cfg.homePath;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required.',
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        ok: false,
        error: 'Supabase is not configured.',
      });
    }

    try {
      const client = getClient();
      const data = await client.signInWithPassword(email, password);

      if (!data || !data.user) {
        return res.status(401).json({
          ok: false,
          error: 'Invalid credentials.',
        });
      }

      const authUser = mapUser(data.user, email);
      (req.session as any).auth = authUser;

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.json({
          ok: true,
          redirect: redirectPath,
          token: data.session?.access_token || null,
          expires_in: data.session?.expires_in || null,
          user: {
            id: authUser.user_id,
            email: authUser.email,
            roles: authUser.roles,
          },
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        ok: false,
        error: 'Authentication failed.',
      });
    }
  });

  return router;
}
