import { Router } from 'express';
import { db, schema } from '../../db/index.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { enrichTrendWithDetails } from '../../scraper/detailScraper.js';
import { sendTrendNotification } from '../../whatsapp/sender.js';
import { generateSocialContent } from '../../social/generator.js';

const router = Router();

// GET /api/trends - List today's trend listings
router.get('/', (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const trends = db.select()
    .from(schema.trends)
    .where(eq(schema.trends.tarih, date))
    .orderBy(desc(schema.trends.id))
    .all();

  res.json({ date, count: trends.length, trends });
});

// GET /api/trends/:id - Get trend detail
router.get('/:id', (req, res) => {
  const trend = db.select()
    .from(schema.trends)
    .where(eq(schema.trends.id, parseInt(req.params.id)))
    .get();

  if (!trend) return res.status(404).json({ error: 'Trend bulunamadı' });

  // Get associated social posts
  const posts = db.select()
    .from(schema.socialPosts)
    .where(eq(schema.socialPosts.trendId, trend.id))
    .all();

  res.json({ trend, socialPosts: posts });
});

// POST /api/trends/:id/enrich - Enrich trend with detail page data
router.post('/:id/enrich', async (req, res) => {
  try {
    await enrichTrendWithDetails(parseInt(req.params.id));
    const trend = db.select()
      .from(schema.trends)
      .where(eq(schema.trends.id, parseInt(req.params.id)))
      .get();
    res.json({ success: true, trend });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trends/:id/whatsapp - Send WhatsApp notification
router.post('/:id/whatsapp', async (req, res) => {
  const trend = db.select()
    .from(schema.trends)
    .where(eq(schema.trends.id, parseInt(req.params.id)))
    .get();

  if (!trend) return res.status(404).json({ error: 'Trend bulunamadı' });

  const result = await sendTrendNotification(trend);
  res.json(result);
});

// POST /api/trends/:id/social - Generate social media content
router.post('/:id/social', async (req, res) => {
  const trend = db.select()
    .from(schema.trends)
    .where(eq(schema.trends.id, parseInt(req.params.id)))
    .get();

  if (!trend) return res.status(404).json({ error: 'Trend bulunamadı' });

  try {
    const content = await generateSocialContent(trend);
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
