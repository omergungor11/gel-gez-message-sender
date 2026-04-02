import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = parseInt(req.query.id as string);
  try {
    const post = await db.getSocialPostById(id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    return res.json(post);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
