import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';
import { getAllTemplateIds, TEMPLATES } from '../../src/social/templates/theme-system.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = Array.isArray(req.query.path) ? req.query.path : [req.query.path as string];

  try {
    // GET /api/trends/templates/list
    if (pathArr[0] === 'templates') {
      const templates = getAllTemplateIds().map(id => {
        const t = TEMPLATES[id];
        return { id: t.id, name: t.name, variant: t.variant, accent: t.accent, bgPrimary: t.bgPrimary };
      });
      return res.json({ templates });
    }

    // Routes with numeric ID: /api/trends/:id[/action]
    const id = parseInt(pathArr[0]);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid path' });

    const action = pathArr[1]; // enrich, whatsapp, social, or undefined

    // GET /api/trends/:id
    if (!action && req.method === 'GET') {
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const posts = await db.getSocialPostsByTrendId(id);
      return res.json({ trend, socialPosts: posts });
    }

    // POST /api/trends/:id/enrich
    if (action === 'enrich' && req.method === 'POST') {
      const { enrichTrendWithDetails } = await import('../../src/scraper/detailScraper.js');
      await enrichTrendWithDetails(id);
      const trend = await db.getTrendById(id);
      return res.json({ success: true, trend });
    }

    // POST /api/trends/:id/whatsapp
    if (action === 'whatsapp' && req.method === 'POST') {
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const { sendTrendNotification } = await import('../../src/whatsapp/sender.js');
      const result = await sendTrendNotification(trend);
      return res.json(result);
    }

    // POST /api/trends/:id/social
    if (action === 'social' && req.method === 'POST') {
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const { generateSocialContent } = await import('../../src/social/generator.js');
      const templateId = req.body?.templateId;
      const content = await generateSocialContent(trend, templateId ? { templateId } : undefined);
      return res.json({ success: true, content });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
