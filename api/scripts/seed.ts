/**
 * Seed script for sample data
 * Inserts Amsterdam, Rotterdam, Utrecht and 10-20 sample locations
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dbPrefix = process.env.DB_PREFIX || 'resto_poc_';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function t(table: string): string {
  return `${dbPrefix}${table}`;
}

// Sample data
const tags = [
  // Cuisine tags
  { id: uuidv4(), kind: 'cuisine', name: 'Italian', slug: 'italian' },
  { id: uuidv4(), kind: 'cuisine', name: 'Japanese', slug: 'japanese' },
  { id: uuidv4(), kind: 'cuisine', name: 'Dutch', slug: 'dutch' },
  { id: uuidv4(), kind: 'cuisine', name: 'French', slug: 'french' },
  { id: uuidv4(), kind: 'cuisine', name: 'Indonesian', slug: 'indonesian' },
  { id: uuidv4(), kind: 'cuisine', name: 'Mediterranean', slug: 'mediterranean' },
  // Vibe tags
  { id: uuidv4(), kind: 'vibe', name: 'Cozy', slug: 'cozy' },
  { id: uuidv4(), kind: 'vibe', name: 'Romantic', slug: 'romantic' },
  { id: uuidv4(), kind: 'vibe', name: 'Trendy', slug: 'trendy' },
  { id: uuidv4(), kind: 'vibe', name: 'Family Friendly', slug: 'family-friendly' },
  { id: uuidv4(), kind: 'vibe', name: 'Fine Dining', slug: 'fine-dining' },
  { id: uuidv4(), kind: 'vibe', name: 'Casual', slug: 'casual' },
];

// Helper to get tag ID by slug
function getTagId(slug: string): string {
  return tags.find(t => t.slug === slug)!.id;
}

function parseDutchAddress(address: string): {
  street?: string;
  house_number?: string;
  house_number_addition?: string | null;
  postcode?: string;
  city?: string;
} {
  const match = address.match(/^(.+?)\s+(\d+)([A-Za-z0-9\-\/]*)?,\s*([0-9]{4}\s?[A-Z]{2})\s+(.+)$/);
  if (!match) return {};

  const [, street, houseNumber, addition, postcodeRaw, city] = match;
  return {
    street,
    house_number: houseNumber,
    house_number_addition: addition || null,
    postcode: postcodeRaw.replace(/\s+/g, '').toUpperCase(),
    city,
  };
}

const locations = [
  // Amsterdam locations
  {
    id: uuidv4(),
    name: 'De Kas',
    slug: 'de-kas',
    description: 'Farm-to-table dining in a beautiful greenhouse setting. Fresh vegetables from their own garden.',
    why_curated: 'Unique greenhouse setting with ingredients grown on-site. A true Amsterdam culinary gem.',
    price_level: 4,
    lat: 52.3547,
    lng: 4.9432,
    address: 'Kamerlingh Onneslaan 3, 1097 DE Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    gallery_urls: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0'],
    is_published: true,
    featured_rank: 1,
    tags: ['dutch', 'fine-dining', 'romantic'],
  },
  {
    id: uuidv4(),
    name: 'Rijsel',
    slug: 'rijsel',
    description: 'French-Flemish cuisine in a former garage. Known for their rotisserie chicken.',
    why_curated: 'No-frills but incredible food. The roast chicken is legendary among locals.',
    price_level: 2,
    lat: 52.3615,
    lng: 4.9178,
    address: 'Marcusstraat 52, 1091 TK Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    gallery_urls: [],
    is_published: true,
    featured_rank: 2,
    tags: ['french', 'casual', 'cozy'],
  },
  {
    id: uuidv4(),
    name: 'Omelegg',
    slug: 'omelegg',
    description: 'Specialty omelette restaurant with creative combinations and fresh ingredients.',
    why_curated: 'Perfect breakfast spot with generous portions and friendly service.',
    price_level: 2,
    lat: 52.3702,
    lng: 4.8842,
    address: 'Ferdinand Bolstraat 143, 1072 LH Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
    gallery_urls: [],
    is_published: true,
    featured_rank: 3,
    tags: ['dutch', 'casual', 'family-friendly'],
  },
  {
    id: uuidv4(),
    name: 'Izakaya',
    slug: 'izakaya',
    description: 'Modern Japanese small plates in a sleek setting. Great sake selection.',
    why_curated: 'Best Japanese food outside Japan. Book ahead for the omakase experience.',
    price_level: 3,
    lat: 52.3676,
    lng: 4.8965,
    address: 'Albert Cuypstraat 2, 1072 CT Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
    gallery_urls: [],
    is_published: true,
    featured_rank: 4,
    tags: ['japanese', 'trendy', 'romantic'],
  },
  {
    id: uuidv4(),
    name: 'Blauw',
    slug: 'blauw',
    description: 'Modern Indonesian rijsttafel with contemporary twist on classic dishes.',
    why_curated: 'Perfect introduction to Indonesian cuisine with excellent vegetarian options.',
    price_level: 3,
    lat: 52.3580,
    lng: 4.8736,
    address: 'Amstelveenseweg 158, 1075 XN Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    gallery_urls: [],
    is_published: true,
    featured_rank: 5,
    tags: ['indonesian', 'trendy', 'family-friendly'],
  },
  {
    id: uuidv4(),
    name: 'Ciel Bleu',
    slug: 'ciel-bleu',
    description: 'Two Michelin star restaurant with panoramic city views on the 23rd floor.',
    why_curated: 'Special occasion destination with impeccable service and stunning views.',
    price_level: 4,
    lat: 52.3476,
    lng: 4.8933,
    address: 'Ferdinand Bolstraat 333, 1072 LH Amsterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de',
    gallery_urls: [],
    is_published: true,
    featured_rank: 6,
    tags: ['french', 'fine-dining', 'romantic'],
  },

  // Rotterdam locations
  {
    id: uuidv4(),
    name: 'FG Restaurant',
    slug: 'fg-restaurant',
    description: 'Two Michelin star fine dining with creative French-inspired cuisine.',
    why_curated: 'Rotterdam\'s finest dining experience. Chef François Geurds creates edible art.',
    price_level: 4,
    lat: 51.9144,
    lng: 4.4777,
    address: 'Katshoek 37, 3012 CJ Rotterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c',
    gallery_urls: [],
    is_published: true,
    featured_rank: 1,
    tags: ['french', 'fine-dining', 'romantic'],
  },
  {
    id: uuidv4(),
    name: 'Fenix Food Factory',
    slug: 'fenix-food-factory',
    description: 'Food hall in a historic warehouse with local producers and craft beer.',
    why_curated: 'Perfect for groups who can\'t decide. Something for everyone in an industrial-chic setting.',
    price_level: 2,
    lat: 51.9002,
    lng: 4.4815,
    address: 'Veerlaan 19D, 3072 AN Rotterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1567521464027-f127ff144326',
    gallery_urls: [],
    is_published: true,
    featured_rank: 2,
    tags: ['dutch', 'casual', 'family-friendly'],
  },
  {
    id: uuidv4(),
    name: 'Héroine',
    slug: 'heroine',
    description: 'Plant-based fine dining with zero waste philosophy and creative presentations.',
    why_curated: 'Proving that vegan food can be sophisticated. Beautiful plates with bold flavors.',
    price_level: 3,
    lat: 51.9225,
    lng: 4.4792,
    address: 'Pannekoekstraat 102A, 3011 LL Rotterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    gallery_urls: [],
    is_published: true,
    featured_rank: 3,
    tags: ['mediterranean', 'trendy', 'fine-dining'],
  },
  {
    id: uuidv4(),
    name: 'De Matroos en het Meisje',
    slug: 'de-matroos-en-het-meisje',
    description: 'Intimate bistro with seasonal Dutch menu and natural wines.',
    why_curated: 'Neighborhood gem with honest cooking. Ask for wine pairing suggestions.',
    price_level: 3,
    lat: 51.9136,
    lng: 4.4845,
    address: 'Witte de Withstraat 36, 3012 BP Rotterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    gallery_urls: [],
    is_published: true,
    featured_rank: 4,
    tags: ['dutch', 'cozy', 'romantic'],
  },
  {
    id: uuidv4(),
    name: 'Umami',
    slug: 'umami',
    description: 'Asian fusion with focus on Japanese and Korean flavors. Great cocktails.',
    why_curated: 'Perfect date night spot. The bao buns are addictive.',
    price_level: 2,
    lat: 51.9188,
    lng: 4.4755,
    address: 'Binnenrotte 140, 3011 HC Rotterdam',
    hero_image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754',
    gallery_urls: [],
    is_published: true,
    featured_rank: 5,
    tags: ['japanese', 'trendy', 'casual'],
  },

  // Utrecht locations
  {
    id: uuidv4(),
    name: 'Restaurant Karel V',
    slug: 'restaurant-karel-v',
    description: 'Fine dining in a 14th century chapel. French-inspired seasonal menu.',
    why_curated: 'Stunning historic setting with food to match. Perfect for special occasions.',
    price_level: 4,
    lat: 52.0894,
    lng: 5.1214,
    address: 'Geertebolwerk 1, 3511 XA Utrecht',
    hero_image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    gallery_urls: [],
    is_published: true,
    featured_rank: 1,
    tags: ['french', 'fine-dining', 'romantic'],
  },
  {
    id: uuidv4(),
    name: 'Broei',
    slug: 'broei',
    description: 'All-day dining with creative breakfast and lunch. Plants everywhere.',
    why_curated: 'Instagram-worthy interior but the food is the real star. Great coffee too.',
    price_level: 2,
    lat: 52.0862,
    lng: 5.1237,
    address: 'Croeselaan 250, 3521 BS Utrecht',
    hero_image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    gallery_urls: [],
    is_published: true,
    featured_rank: 2,
    tags: ['dutch', 'trendy', 'casual'],
  },
  {
    id: uuidv4(),
    name: 'Gys',
    slug: 'gys',
    description: 'Cozy neighborhood restaurant with seasonal menu and organic wines.',
    why_curated: 'Locals\' favorite. Unpretentious food made with care.',
    price_level: 2,
    lat: 52.0936,
    lng: 5.1195,
    address: 'Voorstraat 77, 3512 AK Utrecht',
    hero_image_url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8',
    gallery_urls: [],
    is_published: true,
    featured_rank: 3,
    tags: ['dutch', 'cozy', 'casual'],
  },
  {
    id: uuidv4(),
    name: 'Blauw Utrecht',
    slug: 'blauw-utrecht',
    description: 'Sister restaurant to Amsterdam\'s Blauw. Modern Indonesian rijsttafel.',
    why_curated: 'Excellent rijsttafel in the heart of Utrecht. Book the sharing menu.',
    price_level: 3,
    lat: 52.0865,
    lng: 5.1143,
    address: 'Springweg 64, 3511 VS Utrecht',
    hero_image_url: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4',
    gallery_urls: [],
    is_published: true,
    featured_rank: 4,
    tags: ['indonesian', 'cozy', 'family-friendly'],
  },
  {
    id: uuidv4(),
    name: 'Fico',
    slug: 'fico',
    description: 'Modern Italian with homemade pasta and great wine list.',
    why_curated: 'Best pasta in Utrecht. The truffle tagliatelle is a must-try.',
    price_level: 3,
    lat: 52.0908,
    lng: 5.1226,
    address: 'Oudegracht 98, 3511 AX Utrecht',
    hero_image_url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
    gallery_urls: [],
    is_published: true,
    featured_rank: 5,
    tags: ['italian', 'romantic', 'cozy'],
  },
];

async function seed() {
  console.log(`Seeding database with prefix: ${dbPrefix}`);

  try {
    // Insert tags
    console.log('Inserting tags...');
    const { error: tagsError } = await supabase
      .from(t('tags'))
      .upsert(tags, { onConflict: 'slug' });

    if (tagsError) throw tagsError;
    console.log(`  ✓ ${tags.length} tags`);

    // Insert locations
    console.log('Inserting locations...');
    const locationData = locations.map(loc => {
      const parsed = parseDutchAddress(loc.address);
      return {
        id: loc.id,
        city: parsed.city || null,
        street: parsed.street || null,
        house_number: parsed.house_number || null,
        house_number_addition: parsed.house_number_addition ?? null,
        postcode: parsed.postcode || null,
        name: loc.name,
        slug: loc.slug,
        description: loc.description,
        why_curated: loc.why_curated,
        price_level: loc.price_level,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address,
        hero_image_url: loc.hero_image_url,
        gallery_urls: loc.gallery_urls,
        is_published: loc.is_published,
        featured_rank: loc.featured_rank,
        created_at: new Date().toISOString(),
      };
    });

    const { error: locationsError } = await supabase
      .from(t('locations'))
      .upsert(locationData, { onConflict: 'id' });

    if (locationsError) throw locationsError;
    console.log(`  ✓ ${locations.length} locations`);

    // Insert location_tags
    console.log('Inserting location tags...');
    const locationTagsData: { location_id: string; tag_id: string }[] = [];
    for (const loc of locations) {
      for (const tagSlug of loc.tags) {
        locationTagsData.push({
          location_id: loc.id,
          tag_id: getTagId(tagSlug),
        });
      }
    }

    // Delete existing location_tags first to avoid conflicts
    for (const loc of locations) {
      await supabase
        .from(t('location_tags'))
        .delete()
        .eq('location_id', loc.id);
    }

    const { error: locationTagsError } = await supabase
      .from(t('location_tags'))
      .insert(locationTagsData);

    if (locationTagsError) throw locationTagsError;
    console.log(`  ✓ ${locationTagsData.length} location-tag associations`);

    console.log('\nSeeding complete!');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
