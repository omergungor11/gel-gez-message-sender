import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    // GET /api/social/status
    if (action === 'status') {
      const { isMetaConfigured, isFacebookConfigured } = await import('../../src/social/publisher/meta-client.js');
      return res.json({ instagram: isMetaConfigured(), facebook: isFacebookConfigured() });
    }

    // GET /api/social/posts?date=YYYY-MM-DD
    if (action === 'posts' && req.method === 'GET') {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const posts = await db.getSocialPostsByDate(date);
      return res.json({ count: posts.length, posts });
    }

    // GET /api/social/post?id=X
    if (action === 'post' && req.method === 'GET') {
      const id = parseInt(req.query.id as string);
      const post = await db.getSocialPostById(id);
      if (!post) return res.status(404).json({ error: 'Not found' });
      return res.json(post);
    }

    // POST /api/social/publish?trendId=X
    if (action === 'publish' && req.method === 'POST') {
      const trendId = parseInt(req.query.trendId as string);
      const { publishTrendToSocial } = await import('../../src/social/publisher/index.js');
      const results = await publishTrendToSocial(trendId);
      return res.json({ success: results.every(r => r.success), results });
    }

    // POST /api/social/publish-all
    if (action === 'publish-all' && req.method === 'POST') {
      const date = (req.body?.date as string) || new Date().toISOString().split('T')[0];
      const { publishAllTrends } = await import('../../src/social/publisher/index.js');
      const resultsMap = await publishAllTrends(date);
      let published = 0, failed = 0;
      for (const [, results] of resultsMap) {
        if (results.some(r => r.success)) published++;
        else failed++;
      }
      return res.json({ success: true, summary: { total: resultsMap.size, published, failed } });
    }

    return res.status(404).json({ error: 'Unknown action: ' + action });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
