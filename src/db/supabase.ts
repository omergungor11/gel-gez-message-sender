import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-pg.js';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// ─── Drizzle ORM (SQL queries) ────────────────────

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    if (!config.SUPABASE_DB_URL) {
      throw new Error('SUPABASE_DB_URL not configured');
    }
    const client = postgres(config.SUPABASE_DB_URL, { ssl: 'require' });
    db = drizzle(client, { schema });
  }
  return db;
}

// ─── Supabase Client (Storage, Auth) ──────────────

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabase) {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY not configured');
    }
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }
  return supabase;
}

// ─── Storage helpers ──────────────────────────────

const BUCKET = 'social-posts';

export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  const sb = getSupabase();

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function getPublicImageUrl(filename: string): Promise<string> {
  const sb = getSupabase();
  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export { schema };
