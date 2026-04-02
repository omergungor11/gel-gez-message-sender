import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const stats = await db.getStats();
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
