import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const posts = await db.getSocialPostsByDate(date);
    return res.json({ count: posts.length, posts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
