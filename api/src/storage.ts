import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket name using app prefix
const BUCKET_NAME = `${config.dbPrefix}images`;

// Ideal image sizes (in pixels)
export const IMAGE_SIZES = {
  hero: { width: 1200, height: 800, description: '1200x800 (3:2 ratio)' },
  gallery: { width: 800, height: 600, description: '800x600 (4:3 ratio)' },
  thumbnail: { width: 400, height: 300, description: '400x300 (4:3 ratio)' },
};

// Max file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for storage');
    }
    supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  }
  return supabase;
}

/**
 * Ensure the storage bucket exists (creates if not)
 */
export async function ensureBucket(): Promise<void> {
  const client = getSupabaseClient();

  const { data: buckets } = await client.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!exists) {
    const { error } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log(`[Storage] Created bucket: ${BUCKET_NAME}`);
  }
}

/**
 * Upload an image to storage
 * @param buffer - File buffer
 * @param mimeType - MIME type (image/jpeg, image/png, image/webp)
 * @param folder - Folder path (e.g., 'heroes', 'gallery')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = 'general'
): Promise<string> {
  const client = getSupabaseClient();

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique filename
  const ext = mimeType.split('/')[1];
  const filename = `${folder}/${uuidv4()}.${ext}`;

  // Upload to storage
  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = client.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete an image from storage
 * @param url - Public URL of the image
 */
export async function deleteImage(url: string): Promise<void> {
  const client = getSupabaseClient();

  // Extract path from URL
  const bucketUrl = `${config.supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`;
  if (!url.startsWith(bucketUrl)) {
    // Not a storage URL, skip
    return;
  }

  const path = url.replace(bucketUrl, '');

  const { error } = await client.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Get storage info for API response
 */
export function getStorageInfo() {
  return {
    bucket: BUCKET_NAME,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    allowedTypes: ALLOWED_MIME_TYPES,
    idealSizes: IMAGE_SIZES,
  };
}
