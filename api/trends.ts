import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, schema } from '../src/db/supabase.js';
import { eq, desc, and } from 'drizzle-orm';
import { enrichTrendWithDetails } from '../src/scraper/detailScraper.js';
import { sendTrendNotification } from '../src/whatsapp/sender.js';
import { generateSocialContent } from '../src/social/generator.js';
import { getAllTemplateIds, TEMPLATES } from '../src/social/templates/theme-system.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/trends', '').split('/').filter(Boolean);

  // GET /api/trends — list trends
  if (method === 'GET' && pathParts.length === 0) {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const trends = await db.select()
      .from(schema.trends)
      .where(eq(schema.trends.tarih, date))
      .orderBy(desc(schema.trends.id));
    return res.json({ date, count: trends.length, trends });
  }

  // GET /api/trends/templates/list
  if (method === 'GET' && pathParts[0] === 'templates') {
    const templates = getAllTemplateIds().map(id => {
      const t = TEMPLATES[id];
      return { id: t.id, name: t.name, variant: t.variant, accent: t.accent, bgPrimary: t.bgPrimary };
    });
    return res.json({ templates });
  }

  // GET /api/trends/:id
  if (method === 'GET' && pathParts.length === 1) {
    const id = parseInt(pathParts[0]);
    const [trend] = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    if (!trend) return res.status(404).json({ error: 'Not found' });
    const posts = await db.select().from(schema.socialPosts).where(eq(schema.socialPosts.trendId, id));
    return res.json({ trend, socialPosts: posts });
  }

  // POST /api/trends/:id/enrich
  if (method === 'POST' && pathParts[1] === 'enrich') {
    const id = parseInt(pathParts[0]);
    await enrichTrendWithDetails(id);
    const [trend] = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    return res.json({ success: true, trend });
  }

  // POST /api/trends/:id/whatsapp
  if (method === 'POST' && pathParts[1] === 'whatsapp') {
    const id = parseInt(pathParts[0]);
    const [trend] = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    if (!trend) return res.status(404).json({ error: 'Not found' });
    const result = await sendTrendNotification(trend);
    return res.json(result);
  }

  // POST /api/trends/:id/social
  if (method === 'POST' && pathParts[1] === 'social') {
    const id = parseInt(pathParts[0]);
    const [trend] = await db.select().from(schema.trends).where(eq(schema.trends.id, id));
    if (!trend) return res.status(404).json({ error: 'Not found' });
    const templateId = req.body?.templateId;
    const content = await generateSocialContent(trend, templateId ? { templateId } : undefined);
    return res.json({ success: true, content });
  }

  return res.status(404).json({ error: 'Not found' });
}
