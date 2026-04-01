import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/pipeline', '').split('/').filter(Boolean);

  try {
    // GET /api/pipeline/stats
    if (method === 'GET' && pathParts[0] === 'stats') {
      const stats = await db.getStats();
      return res.json(stats);
    }

    // GET /api/pipeline/logs
    if (method === 'GET' && pathParts[0] === 'logs') {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await db.getLogs(limit);
      return res.json({ count: logs.length, logs });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
