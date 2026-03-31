import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../data/pipeline.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Auto-create tables on first import
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ilan_id TEXT NOT NULL,
    baslik TEXT NOT NULL,
    fiyat TEXT,
    konum TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    telefon TEXT,
    whatsapp_no TEXT,
    ilan_sahibi TEXT,
    magaza TEXT,
    aciklama TEXT,
    opi_images TEXT,
    whatsapp_durumu TEXT DEFAULT 'bekliyor',
    whatsapp_tarih TEXT,
    tarih TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trend_id INTEGER REFERENCES trends(id),
    ilan_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    post_type TEXT DEFAULT 'single',
    gorsel_path TEXT,
    caption TEXT,
    hashtags TEXT,
    ai_prompt TEXT,
    durumu TEXT DEFAULT 'uretildi',
    tarih TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pipeline_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    details TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_trends_tarih ON trends(tarih);
  CREATE INDEX IF NOT EXISTS idx_trends_ilan_id ON trends(ilan_id);
  CREATE INDEX IF NOT EXISTS idx_social_posts_ilan_id ON social_posts(ilan_id);
`);

export { schema };
