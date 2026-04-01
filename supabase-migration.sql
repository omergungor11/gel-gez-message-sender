-- GelGezGor Trend Pipeline — Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL)

-- Trends table
CREATE TABLE IF NOT EXISTS trends (
  id SERIAL PRIMARY KEY,
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
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE INDEX IF NOT EXISTS idx_trends_tarih ON trends(tarih);
CREATE INDEX IF NOT EXISTS idx_trends_ilan_id ON trends(ilan_id);

-- Social posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  trend_id INTEGER REFERENCES trends(id),
  ilan_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_type TEXT DEFAULT 'single',
  gorsel_path TEXT,
  caption TEXT,
  hashtags TEXT,
  ai_prompt TEXT,
  template_id TEXT,
  durumu TEXT DEFAULT 'uretildi',
  tarih TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_ilan_id ON social_posts(ilan_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_tarih ON social_posts(tarih);

-- Pipeline logs table
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (now()::text)
);

-- Supabase Storage: Create 'social-posts' bucket
-- Go to Dashboard → Storage → New Bucket → Name: "social-posts" → Public: ON
