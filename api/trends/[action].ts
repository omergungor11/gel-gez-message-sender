import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    // GET /api/trends/list?date=YYYY-MM-DD
    if (action === 'list') {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const trends = await db.getTrendsByDate(date);
      return res.json({ date, count: trends.length, trends });
    }

    // GET /api/trends/detail?id=X
    if (action === 'detail' && req.method === 'GET') {
      const id = parseInt(req.query.id as string);
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const posts = await db.getSocialPostsByTrendId(id);
      return res.json({ trend, socialPosts: posts });
    }

    // POST /api/trends/enrich?id=X
    if (action === 'enrich' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      const { enrichTrendWithDetails } = await import('../../src/scraper/detailScraper.js');
      await enrichTrendWithDetails(id);
      const trend = await db.getTrendById(id);
      return res.json({ success: true, trend });
    }

    // POST /api/trends/whatsapp?id=X[&testTo=+905338205149]
    if (action === 'whatsapp' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });

      // Sandbox mode: override recipient with test number
      const testTo = req.query.testTo as string;
      if (testTo) {
        trend.whatsapp_no = testTo;
        trend.telefon = testTo;
      }

      const { sendTrendNotification } = await import('../../src/whatsapp/sender.js');
      const result = await sendTrendNotification(trend);
      return res.json(result);
    }

    // POST /api/trends/social?id=X
    if (action === 'social' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const { generateSocialContent } = await import('../../src/social/generator.js');
      const templateId = req.body?.templateId;
      const content = await generateSocialContent(trend, templateId ? { templateId } : undefined);
      return res.json({ success: true, content });
    }

    // POST /api/trends/layout?id=X&layout=classic|split|magazine|polaroid|minimal
    if (action === 'layout' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      const layoutId = (req.query.layout as string) || 'classic';
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });

      const { generateLayout, LAYOUTS } = await import('../../src/social/layouts.js');
      if (!(layoutId in LAYOUTS)) {
        return res.status(400).json({ error: `Unknown layout: ${layoutId}` });
      }

      const imagePath = await generateLayout(layoutId as any, trend);
      return res.json({ success: true, layoutId, imagePath });
    }

    // POST /api/trends/all-layouts?id=X — generate all 5 layouts
    if (action === 'all-layouts' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });

      const { generateAllLayouts } = await import('../../src/social/layouts.js');
      const paths = await generateAllLayouts(trend);
      return res.json({ success: true, layouts: paths });
    }

    // GET /api/trends/layouts — list available layouts
    if (action === 'layouts') {
      const { LAYOUTS } = await import('../../src/social/layouts.js');
      const layouts = Object.entries(LAYOUTS).map(([id, l]) => ({
        id,
        name: l.name,
        description: l.description,
      }));
      return res.json({ layouts });
    }

    // POST /api/trends/update?id=X
    if (action === 'update' && req.method === 'POST') {
      const id = parseInt(req.query.id as string);
      await db.updateTrend(id, req.body);
      const trend = await db.getTrendById(id);
      return res.json({ success: true, trend });
    }

    // GET /api/trends/templates
    if (action === 'templates') {
      const { getAllTemplateIds, TEMPLATES } = await import('../../src/social/templates/theme-system.js');
      const templates = getAllTemplateIds().map(id => {
        const t = TEMPLATES[id];
        return { id: t.id, name: t.name, variant: t.variant, accent: t.accent, bgPrimary: t.bgPrimary };
      });
      return res.json({ templates });
    }

    return res.status(404).json({ error: 'Unknown action: ' + action });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
