import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/supabase.js';
import { getAllTemplateIds, TEMPLATES } from '../src/social/templates/theme-system.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/trends', '').split('/').filter(Boolean);

  try {
    // GET /api/trends
    if (method === 'GET' && pathParts.length === 0) {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const trends = await db.getTrendsByDate(date);
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
    if (method === 'GET' && pathParts.length === 1 && !isNaN(Number(pathParts[0]))) {
      const trend = await db.getTrendById(parseInt(pathParts[0]));
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const posts = await db.getSocialPostsByTrendId(trend.id);
      return res.json({ trend, socialPosts: posts });
    }

    // POST /api/trends/:id/enrich
    if (method === 'POST' && pathParts[1] === 'enrich') {
      const { enrichTrendWithDetails } = await import('../src/scraper/detailScraper.js');
      await enrichTrendWithDetails(parseInt(pathParts[0]));
      const trend = await db.getTrendById(parseInt(pathParts[0]));
      return res.json({ success: true, trend });
    }

    // POST /api/trends/:id/whatsapp
    if (method === 'POST' && pathParts[1] === 'whatsapp') {
      const trend = await db.getTrendById(parseInt(pathParts[0]));
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const { sendTrendNotification } = await import('../src/whatsapp/sender.js');
      const result = await sendTrendNotification(trend);
      return res.json(result);
    }

    // POST /api/trends/:id/social
    if (method === 'POST' && pathParts[1] === 'social') {
      const trend = await db.getTrendById(parseInt(pathParts[0]));
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const { generateSocialContent } = await import('../src/social/generator.js');
      const templateId = req.body?.templateId;
      const content = await generateSocialContent(trend, templateId ? { templateId } : undefined);
      return res.json({ success: true, content });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
