-- Restaurant Discovery POC - Database Schema
-- Run this in your Supabase SQL Editor or via psql
--
-- Table prefix: Change 'resto_poc_' below if you want a different prefix

-- Tags table (cuisine or vibe)
CREATE TABLE IF NOT EXISTS resto_poc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('cuisine', 'vibe')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Locations table
CREATE TABLE IF NOT EXISTS resto_poc_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT,
  street TEXT,
  house_number TEXT,
  house_number_addition TEXT,
  postcode TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  why_curated TEXT,
  price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  hero_image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  featured_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location tags junction table
CREATE TABLE IF NOT EXISTS resto_poc_location_tags (
  location_id UUID NOT NULL REFERENCES resto_poc_locations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES resto_poc_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (location_id, tag_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS resto_poc_favorites (
  user_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES resto_poc_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, location_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resto_poc_locations_city ON resto_poc_locations(city);
CREATE INDEX IF NOT EXISTS idx_resto_poc_locations_postcode_house ON resto_poc_locations(postcode, house_number);
CREATE INDEX IF NOT EXISTS idx_resto_poc_locations_published ON resto_poc_locations(is_published);
CREATE INDEX IF NOT EXISTS idx_resto_poc_locations_featured ON resto_poc_locations(featured_rank);
CREATE INDEX IF NOT EXISTS idx_resto_poc_favorites_user ON resto_poc_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_resto_poc_location_tags_tag ON resto_poc_location_tags(tag_id);
