import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const id = parseInt(req.query.id as string);

  try {
    const { enrichTrendWithDetails } = await import('../../../src/scraper/detailScraper.js');
    await enrichTrendWithDetails(id);
    const trend = await db.getTrendById(id);
    return res.json({ success: true, trend });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
