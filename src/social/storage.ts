import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_OUTPUT = path.resolve(__dirname, '../../output');

const isVercel = !!process.env.VERCEL;

/**
 * Save an image buffer and return its accessible path/URL.
 * - Local dev: saves to output/ directory, returns local path
 * - Vercel/Supabase: uploads to Supabase Storage, returns public URL
 */
export async function saveImage(buffer: Buffer, filename: string): Promise<string> {
  if (isVercel) {
    // Dynamic import to avoid loading Supabase in local dev
    const { uploadImage } = await import('../db/supabase.js');
    const publicUrl = await uploadImage(buffer, filename);
    return publicUrl;
  }

  // Local development: save to output/ directory
  if (!fs.existsSync(LOCAL_OUTPUT)) fs.mkdirSync(LOCAL_OUTPUT, { recursive: true });
  const filePath = path.join(LOCAL_OUTPUT, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Get the public URL for an image.
 * - Local: returns local file path
 * - Vercel: returns Supabase Storage public URL
 */
export async function getImageUrl(filenameOrPath: string): Promise<string> {
  if (isVercel) {
    const filename = path.basename(filenameOrPath);
    const { getPublicImageUrl } = await import('../db/supabase.js');
    return getPublicImageUrl(filename);
  }
  return filenameOrPath;
}
