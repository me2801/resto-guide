import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { getSessionConfig } from 'supabase-auth-js';
import { registerAuth, isAuthenticated, isAdmin } from 'supabase-auth-js/api';
import { publicRoutes } from './routes/public.js';
import { userRoutes } from './routes/user.js';
import { adminRoutes } from './routes/admin.js';
import { openapiSpec } from './openapi.js';

if (config.debug) {
  console.log('[DEBUG] Debug mode enabled');
  console.log('[DEBUG] Config:', {
    port: config.port,
    supabaseUrl: config.supabaseUrl ? '***set***' : '***missing***',
    supabaseAnonKey: config.supabaseAnonKey ? '***set***' : '***missing***',
    frontendUrl: config.frontendUrl,
    dbPrefix: config.dbPrefix,
  });
}

// Auth middleware for API routes
function requireAuthApi() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}

function requireAdminApi() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Parse JSON bodies (except for upload routes which handle raw data)
app.use('/api/admin/upload', express.raw({ type: ['image/*'], limit: '5mb' }));
app.use(express.json({ limit: '10mb' })); // Increased for base64 uploads
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Resto API Docs',
}));
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));
app.get('/api/redoc', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html><head>
  <title>Resto API - Redoc</title>
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>body { margin: 0; padding: 0; }</style>
</head><body>
  <redoc spec-url="/api/docs.json"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body></html>`);
});

// Session middleware
app.use(session(getSessionConfig()));

// Custom static files (serve before auth to override default CSS)
const staticDir = existsSync(join(__dirname, '..', 'static'))
  ? join(__dirname, '..', 'static')
  : join(__dirname, '..', '..', 'static');
app.use('/static', express.static(staticDir));

// Auth routes (login/logout pages and API)
app.use(registerAuth({
  appName: 'Resto Discovery',
  appShortName: 'Resto',
  loginTitle: 'Sign In',
  loginSubtitle: 'Discover curated restaurants',
  homePath: '/',
  loginPath: '/auth/login',
  loginApiPath: '/auth/api/login',
  logoutPath: '/auth/logout',
}));

// Health check
app.get('/api/health', async (_req, res) => {
  const checks: Record<string, any> = {};

  // Check auth service
  try {
    const { getClient } = await import('supabase-auth-js');
    const client = getClient();
    checks.auth = await client.checkAuthHealth();
  } catch (err: any) {
    checks.auth = { ok: false, error: err.message };
  }

  // Check database
  try {
    const { getDb } = await import('./db.js');
    const sql = getDb();
    const start = Date.now();
    await sql`SELECT 1`;
    checks.database = { ok: true, latency: Date.now() - start };
  } catch (err: any) {
    checks.database = { ok: false, error: err.message };
  }

  const healthy = checks.auth?.ok && checks.database?.ok;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Public routes
app.use('/api', publicRoutes);

// User routes (auth required)
app.use('/api/me', requireAuthApi(), userRoutes);

// Admin routes (admin required)
app.use('/api/admin', requireAdminApi(), adminRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(config.debug && { message: err.message, stack: err.stack }),
  });
});

if (process.env.SINGLE_SERVICE !== 'true') {
  app.listen(config.port, () => {
    console.log(`API server running on http://localhost:${config.port}`);
  });
}

export default app;
