import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    if (req.method === 'GET') {
      const trend = await db.getTrendById(id);
      if (!trend) return res.status(404).json({ error: 'Not found' });
      const posts = await db.getSocialPostsByTrendId(id);
      return res.json({ trend, socialPosts: posts });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
