import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';
import { isMetaConfigured, isFacebookConfigured } from '../../src/social/publisher/meta-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = Array.isArray(req.query.path) ? req.query.path : [req.query.path as string];
  const path = pathArr.join('/');

  try {
    // GET /api/social/status
    if (path === 'status') {
      return res.json({ instagram: isMetaConfigured(), facebook: isFacebookConfigured() });
    }

    // GET /api/social/posts
    if (path === 'posts' && req.method === 'GET') {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const posts = await db.getSocialPostsByDate(date);
      return res.json({ count: posts.length, posts });
    }

    // GET /api/social/posts/:id
    if (pathArr[0] === 'posts' && pathArr[1] && req.method === 'GET') {
      const post = await db.getSocialPostById(parseInt(pathArr[1]));
      if (!post) return res.status(404).json({ error: 'Not found' });
      return res.json(post);
    }

    // POST /api/social/publish/:trendId
    if (pathArr[0] === 'publish' && pathArr[1] && req.method === 'POST') {
      const { publishTrendToSocial } = await import('../../src/social/publisher/index.js');
      const results = await publishTrendToSocial(parseInt(pathArr[1]));
      return res.json({ success: results.every(r => r.success), results });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
