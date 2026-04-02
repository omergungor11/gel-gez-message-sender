import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const trends = await db.getTrendsByDate(date);
    return res.json({ date, count: trends.length, trends });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
