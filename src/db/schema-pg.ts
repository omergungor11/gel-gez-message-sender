import { pgTable, text, integer, serial, timestamp } from 'drizzle-orm/pg-core';

export const trends = pgTable('trends', {
  id: serial('id').primaryKey(),
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
  opiImages: text('opi_images'),
  whatsappDurumu: text('whatsapp_durumu').default('bekliyor'),
  whatsappTarih: text('whatsapp_tarih'),
  tarih: text('tarih').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const socialPosts = pgTable('social_posts', {
  id: serial('id').primaryKey(),
  trendId: integer('trend_id').references(() => trends.id),
  ilanId: text('ilan_id').notNull(),
  platform: text('platform').notNull(),
  postType: text('post_type').default('single'),
  gorselPath: text('gorsel_path'),
  caption: text('caption'),
  hashtags: text('hashtags'),
  aiPrompt: text('ai_prompt'),
  templateId: text('template_id'),
  durumu: text('durumu').default('uretildi'),
  tarih: text('tarih').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const pipelineLogs = pgTable('pipeline_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  details: text('details'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type Trend = typeof trends.$inferSelect;
export type NewTrend = typeof trends.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;
export type PipelineLog = typeof pipelineLogs.$inferSelect;
