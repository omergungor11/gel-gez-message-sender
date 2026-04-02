import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await db.getLogs(limit);
    return res.json({ count: logs.length, logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
