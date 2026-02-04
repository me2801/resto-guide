# Restaurant Discovery API Documentation

## Base URL

- Development: `http://localhost:3001`
- Production: `https://your-api.onrender.com`

## Authentication

The API uses cookie-based authentication via `express-session` and `supabase_auth_js`.

### Session Cookie

- Name: `resto_session` (configurable via `COOKIE_NAME`)
- HTTP-only for security
- Secure cookies enabled in production (`SECURE_COOKIES=true`)

### Auth Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /auth/login` | Login page |
| `POST /auth/api/login` | Login API (form submission) |
| `GET /auth/logout` | Logout page |

### CORS Configuration

The API allows credentials from the configured `FRONTEND_URL`. Frontend requests must include:

```javascript
fetch(url, { credentials: 'include' })
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | - | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Supabase service role key (for admin ops) |
| `SESSION_SECRET` | Yes | - | Secret for signing session cookies |
| `COOKIE_NAME` | No | `resto_session` | Name of the session cookie |
| `SECURE_COOKIES` | No | `false` | Set to `true` in production |
| `DB_PREFIX` | No | `resto_poc_` | Prefix for all database tables |
| `PORT` | No | `3001` | API server port |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |

---

## Database Schema

All table names are prefixed with `DB_PREFIX` (default: `resto_poc_`).

### Tags Table (`{prefix}tags`)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key |
| kind | TEXT | Not Null, Check ('cuisine', 'vibe') |
| name | TEXT | Not Null |
| slug | TEXT | Not Null, Unique |

### Locations Table (`{prefix}locations`)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key |
| city | TEXT | Nullable |
| street | TEXT | Nullable |
| house_number | TEXT | Nullable |
| house_number_addition | TEXT | Nullable |
| postcode | TEXT | Nullable |
| name | TEXT | Not Null |
| slug | TEXT | Not Null |
| description | TEXT | Nullable |
| why_curated | TEXT | Nullable |
| price_level | INTEGER | 1-4 |
| lat | DOUBLE | Nullable |
| lng | DOUBLE | Nullable |
| address | TEXT | Nullable |
| hero_image_url | TEXT | Nullable |
| gallery_urls | JSONB | Default: [] |
| is_published | BOOLEAN | Default: false |
| featured_rank | INTEGER | Nullable |
| created_at | TIMESTAMPTZ | Default: NOW() |

### Location Tags Table (`{prefix}location_tags`)

| Column | Type | Constraints |
|--------|------|-------------|
| location_id | UUID | Foreign Key → locations(id) |
| tag_id | UUID | Foreign Key → tags(id) |

Primary Key: (location_id, tag_id)

### Favorites Table (`{prefix}favorites`)

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | UUID | Not Null |
| location_id | UUID | Foreign Key → locations(id) |
| created_at | TIMESTAMPTZ | Default: NOW() |

Primary Key: (user_id, location_id)

---

## API Endpoints

### Health Check

#### `GET /api/health`

Returns API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### Public Endpoints

#### `GET /api/cities`

Returns top 5 cities (by location count).

**Response:**
```json
[
  { "id": "amsterdam", "name": "Amsterdam", "slug": "amsterdam" }
]
```

#### `GET /api/tags`

Returns all tags.

**Response:**
```json
[
  { "id": "uuid", "kind": "cuisine", "name": "Italian", "slug": "italian" }
]
```

#### `GET /api/locations`

Returns published locations with optional filters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| city | string | Filter by city slug |
| bbox | string | Bounding box: `west,south,east,north` |
| tag_slugs | string | Comma-separated tag slugs |
| price_min | number | Minimum price level (1-4) |
| price_max | number | Maximum price level (1-4) |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "De Kas",
    "slug": "de-kas",
    "city": { "id": "amsterdam", "name": "Amsterdam", "slug": "amsterdam" },
    "tags": [
      { "id": "uuid", "kind": "cuisine", "name": "Dutch", "slug": "dutch" }
    ],
    "price_level": 4,
    "lat": 52.3547,
    "lng": 4.9432,
    ...
  }
]
```

#### `GET /api/locations/:id`

Returns a single location by ID.

**Response:** Same structure as locations array item.

---

### Auth-Required Endpoints

These endpoints require a valid session cookie.

#### `GET /api/me`

Returns the current authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "roles": ["user"]
}
```

**Error (401):**
```json
{ "error": "Not authenticated" }
```

#### `GET /api/me/favorites`

Returns the user's favorite locations.

**Response:** Array of location objects with `favorited_at` timestamp.

#### `POST /api/me/favorites/:locationId`

Adds a location to favorites.

**Response:**
```json
{ "message": "Added to favorites" }
```

#### `DELETE /api/me/favorites/:locationId`

Removes a location from favorites.

**Response:**
```json
{ "message": "Removed from favorites" }
```

---

### Admin-Only Endpoints

These endpoints require admin role.

#### Tags

**`POST /api/admin/tags`**

Creates a new tag.

**Request Body:**
```json
{ "kind": "cuisine", "name": "Thai", "slug": "thai" }
```

**`PUT /api/admin/tags/:id`**

Updates a tag.

**`DELETE /api/admin/tags/:id`**

Deletes a tag (also removes location associations).

#### Address Lookup

**`GET /api/admin/address-lookup`**

Looks up street, city, and coordinates from postcode + house number.

**Query Parameters:**

- `postcode` (required)
- `house_number` (required)
- `house_number_addition` (optional)

**Response:**
```json
{
  "street": "Kamerlingh Onneslaan",
  "city": "Amsterdam",
  "postcode": "1097DE",
  "house_number": "3",
  "house_number_addition": "",
  "lat": 52.3547,
  "lng": 4.9432,
  "address": "Kamerlingh Onneslaan 3, 1097DE Amsterdam"
}
```

#### Locations

**`GET /api/admin/locations`**

Returns all locations (including unpublished).

**`POST /api/admin/locations`**

Creates a new location.

**Request Body:**
```json
{
  "city": "Amsterdam",
  "street": "Kamerlingh Onneslaan",
  "house_number": "3",
  "house_number_addition": "",
  "postcode": "1097DE",
  "name": "Restaurant Name",
  "slug": "restaurant-name",
  "description": "...",
  "why_curated": "...",
  "price_level": 3,
  "lat": 52.0,
  "lng": 4.5,
  "address": "Street 123",
  "hero_image_url": "https://...",
  "gallery_urls": ["https://..."],
  "is_published": true,
  "featured_rank": 1,
  "tag_ids": ["uuid1", "uuid2"]
}
```

**`PUT /api/admin/locations/:id`**

Updates a location. Supports partial updates.

**`DELETE /api/admin/locations/:id`**

Deletes a location (also removes tag associations and favorites).

---

## Error Responses

All errors return JSON with an `error` field:

```json
{ "error": "Error message" }
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Internal Server Error
