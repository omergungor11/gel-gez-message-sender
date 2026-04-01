import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, schema } from '../src/db/supabase.js';
import { eq, desc } from 'drizzle-orm';
import { publishTrendToSocial } from '../src/social/publisher/index.js';
import { isMetaConfigured, isFacebookConfigured } from '../src/social/publisher/meta-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/social', '').split('/').filter(Boolean);

  // GET /api/social/status
  if (method === 'GET' && pathParts[0] === 'status') {
    return res.json({ instagram: isMetaConfigured(), facebook: isFacebookConfigured() });
  }

  // GET /api/social/posts
  if (method === 'GET' && pathParts[0] === 'posts' && pathParts.length === 1) {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const posts = await db.select().from(schema.socialPosts).orderBy(desc(schema.socialPosts.id));
    const filtered = posts.filter(p => p.tarih === date);
    return res.json({ count: filtered.length, posts: filtered });
  }

  // GET /api/social/posts/:id
  if (method === 'GET' && pathParts[0] === 'posts' && pathParts.length === 2) {
    const id = parseInt(pathParts[1]);
    const [post] = await db.select().from(schema.socialPosts).where(eq(schema.socialPosts.id, id));
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  }

  // POST /api/social/publish/:trendId
  if (method === 'POST' && pathParts[0] === 'publish' && pathParts.length === 2) {
    const trendId = parseInt(pathParts[1]);
    const results = await publishTrendToSocial(trendId);
    return res.json({ success: results.every(r => r.success), results });
  }

  return res.status(404).json({ error: 'Not found' });
}
