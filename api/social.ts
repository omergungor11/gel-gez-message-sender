import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/social', '').split('/').filter(Boolean);

  try {
    // GET /api/social/status
    if (method === 'GET' && pathParts[0] === 'status') {
      const { isMetaConfigured, isFacebookConfigured } = await import('../src/social/publisher/meta-client.js');
      return res.json({ instagram: isMetaConfigured(), facebook: isFacebookConfigured() });
    }

    // GET /api/social/posts
    if (method === 'GET' && pathParts[0] === 'posts' && pathParts.length === 1) {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const posts = await db.getSocialPostsByDate(date);
      return res.json({ count: posts.length, posts });
    }

    // GET /api/social/posts/:id
    if (method === 'GET' && pathParts[0] === 'posts' && pathParts.length === 2) {
      const post = await db.getSocialPostById(parseInt(pathParts[1]));
      if (!post) return res.status(404).json({ error: 'Not found' });
      return res.json(post);
    }

    // POST /api/social/publish/:trendId
    if (method === 'POST' && pathParts[0] === 'publish') {
      const { publishTrendToSocial } = await import('../src/social/publisher/index.js');
      const results = await publishTrendToSocial(parseInt(pathParts[1]));
      return res.json({ success: results.every(r => r.success), results });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
