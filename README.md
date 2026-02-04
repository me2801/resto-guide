# Resto Discovery

Mobile-first curated restaurant discovery for Dutch cities. The app has a public
browse page and an authenticated experience with maps, filters, and favorites.

## Structure

```
frontend/   # Next.js App Router PWA
api/        # Express + Supabase REST API
docs/       # API documentation
```

## Features

Public:
- Randomized browse list at `/discover`
- Location detail pages

Authenticated:
- City selector
- Tag and price filters
- Map / list toggle (Mapbox)
- Favorites

Admin:
- Manage tags and locations
- Publish / unpublish locations
- Address lookup (PDOK)

## Quick Start

### 1) Install dependencies

```bash
cd api
npm install

cd ../frontend
npm install
```

### 2) Configure environment

**API** (`api/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=your-very-secure-secret-key
COOKIE_NAME=resto_session
SECURE_COOKIES=false
DB_PREFIX=resto_poc_
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### 3) Create database tables

Run `api/scripts/create_db.sql` in your Supabase SQL Editor.

Tables (with `DB_PREFIX`, default `resto_poc_`):
- `resto_poc_tags`
- `resto_poc_locations`
- `resto_poc_location_tags`
- `resto_poc_favorites`

### 4) Seed sample data

```bash
cd api
npm run db:seed
```

### 5) Run dev servers

```bash
# Terminal 1: API
cd api
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`

## Authentication

Auth is handled by `supabase-auth-js` (cookie-based sessions):
- Login: `/auth/login`
- Logout: `/auth/logout`

Admin access: add `admin` to `app_metadata.roles` for the user in Supabase.

## API

Full docs: `docs/api.md`

Public:
- `GET /api/health`
- `GET /api/cities`
- `GET /api/tags`
- `GET /api/locations`
- `GET /api/locations/:id`

Auth required:
- `GET /api/me`
- `GET /api/me/favorites`
- `POST /api/me/favorites/:locationId`
- `DELETE /api/me/favorites/:locationId`

Admin:
- `POST/PUT/DELETE /api/admin/tags/:id`
- `POST/PUT/DELETE /api/admin/locations/:id`
- `GET /api/admin/address-lookup`

## Deployment Notes

Build commands:
- API: `npm install && npm run build` then `npm start`
- Frontend: `npm install && npm run build` then `npm start`

Make sure production env values are set:
- `FRONTEND_URL` must match your frontend URL
- `SECURE_COOKIES=true` in production
- `NEXT_PUBLIC_API_BASE_URL` points to the API base URL

## Tech Stack

- Frontend: Next.js 14, TypeScript, Mapbox GL JS
- API: Express, TypeScript, express-session
- Database: Supabase (Postgres)
- Auth: supabase-auth-js

## License

MIT
