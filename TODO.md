# Restaurant Discovery POC - Implementation Checklist

## Project Structure
- [x] Create `/frontend` directory (Next.js App Router PWA)
- [x] Create `/api` directory (Node/Express TypeScript)
- [x] Create `/docs` directory (API docs + architecture notes)
- [x] Root README with local run steps and Render deployment notes

## Phase 1: Scaffold Structure + READMEs + Env Examples
- [x] Initialize `/api` with package.json, TypeScript config
- [x] Initialize `/frontend` with Next.js App Router
- [x] Create `.env.example` files for both services
- [x] Create root README.md with setup instructions

## Phase 2: Database Scripts (with DB_PREFIX support)
- [x] Create `/api/scripts/create_db.ts` - idempotent table creation
- [x] Create `/api/scripts/seed.ts` - sample data for Amsterdam/Rotterdam/Utrecht
- [x] Tables to create (all prefixed with DB_PREFIX, default "resto_poc_"):
  - [x] {p}tags: id uuid pk, kind text ("cuisine"|"vibe"), name, slug
  - [x] {p}locations: id uuid pk, city, street, house_number, house_number_addition, postcode, name, slug, description, why_curated, price_level int(1-4), lat, lng, address, hero_image_url, gallery_urls jsonb, is_published bool, featured_rank int, created_at
  - [x] {p}location_tags: location_id, tag_id (unique pair)
  - [x] {p}favorites: user_id uuid, location_id uuid, created_at (unique pair)

## Phase 3: Express API + Auth + Admin Protection
- [x] Install dependencies (express, express-session, cors, supabase-js, etc.)
- [x] Install supabase_auth_js from git repo as dependency
- [x] Configure express-session with SESSION_SECRET
- [x] Integrate registerAuth from supabase_auth_js
- [x] Setup CORS for frontend origin with credentials

### Public Endpoints
- [x] GET /api/health
- [x] GET /api/cities
- [x] GET /api/tags
- [x] GET /api/locations?city=&bbox=&tag_slugs=&price_min=&price_max=
- [x] GET /api/locations/:id

### Auth-Required Endpoints
- [x] GET /api/me
- [x] GET /api/me/favorites
- [x] POST /api/me/favorites/:locationId
- [x] DELETE /api/me/favorites/:locationId

### Admin-Only Endpoints
- [x] POST /api/admin/tags
- [x] PUT /api/admin/tags/:id
- [x] DELETE /api/admin/tags/:id
- [x] POST /api/admin/locations
- [x] PUT /api/admin/locations/:id
- [x] DELETE /api/admin/locations/:id

## Phase 4: Next.js Frontend Pages
- [x] Configure PWA support
- [x] Setup API client with credentials: "include"
- [x] City selector (DB-driven)
- [x] Discover page with map/list toggle
- [x] Filter chips (cuisine, price, vibe tags)
- [x] Location detail page with gallery + "Why this place" + tags + Save CTA
- [x] Saved/favorites page (requires login)
- [x] Admin pages (CRUD locations/tags, publish/unpublish, featured ordering)

## Phase 5: Documentation
- [x] Create `/docs/api.md` with:
  - [x] All endpoints documented
  - [x] Auth/cookies explanation
  - [x] Environment variables
  - [x] DB schema (including prefix rule)

## Phase 6: End-to-End Testing
- [ ] Verify unauthenticated browsing works
- [ ] Verify login enables favorites
- [ ] Verify admin routes are protected
- [ ] Test map/list toggle
- [ ] Test filters

---

## Environment Variables

### API (.env)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
COOKIE_NAME=resto_session
SECURE_COOKIES=false
DB_PREFIX=resto_poc_
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=
```

---

## Deployment (Render)
- API: Node service from `/api`
- Frontend: Static site or Node service from `/frontend`
- Set SECURE_COOKIES=true in production
- Configure CORS for production frontend URL
