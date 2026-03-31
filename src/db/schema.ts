import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const trends = sqliteTable('trends', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ilanId: text('ilan_id').notNull(),
  baslik: text('baslik').notNull(),
  fiyat: text('fiyat'),
  konum: text('konum'),
  url: text('url').notNull(),
  imageUrl: text('image_url'),
  telefon: text('telefon'),
  whatsappNo: text('whatsapp_no'),
  ilanSahibi: text('ilan_sahibi'),
  magaza: text('magaza'),
  aciklama: text('aciklama'),
  opiImages: text('opi_images'), // JSON array of detail page image URLs
  whatsappDurumu: text('whatsapp_durumu').default('bekliyor'), // bekliyor | gonderildi | hata
  whatsappTarih: text('whatsapp_tarih'),
  tarih: text('tarih').notNull(), // YYYY-MM-DD
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const socialPosts = sqliteTable('social_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trendId: integer('trend_id').references(() => trends.id),
  ilanId: text('ilan_id').notNull(),
  platform: text('platform').notNull(), // instagram | facebook
  postType: text('post_type').default('single'), // single | panorama | info
  gorselPath: text('gorsel_path'),
  caption: text('caption'),
  hashtags: text('hashtags'),
  aiPrompt: text('ai_prompt'), // Gemini/Imagen prompt used
  durumu: text('durumu').default('uretildi'), // uretildi | paylasildi
  tarih: text('tarih').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const pipelineLogs = sqliteTable('pipeline_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // scrape | whatsapp | social | pipeline
  status: text('status').notNull(), // success | error
  message: text('message'),
  details: text('details'), // JSON
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type Trend = typeof trends.$inferSelect;
export type NewTrend = typeof trends.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;
export type PipelineLog = typeof pipelineLogs.$inferSelect;
