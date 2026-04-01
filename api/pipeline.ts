import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, schema } from '../src/db/supabase.js';
import { desc, sql, eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const { method } = req;
  const pathParts = (req.url || '').replace('/api/pipeline', '').split('/').filter(Boolean);

  // GET /api/pipeline/stats
  if (method === 'GET' && pathParts[0] === 'stats') {
    const today = new Date().toISOString().split('T')[0];

    const [todayTrends] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.trends).where(eq(schema.trends.tarih, today));
    const [totalTrends] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.trends);
    const [waSent] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.trends).where(eq(schema.trends.whatsappDurumu, 'gonderildi'));
    const [totalSocial] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.socialPosts);
    const [todaySocial] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.socialPosts).where(eq(schema.socialPosts.tarih, today));
    const recentLogs = await db.select().from(schema.pipelineLogs)
      .orderBy(desc(schema.pipelineLogs.id)).limit(5);

    return res.json({
      today,
      trends: { today: todayTrends?.count || 0, total: totalTrends?.count || 0 },
      whatsapp: { sent: waSent?.count || 0 },
      social: { today: todaySocial?.count || 0, total: totalSocial?.count || 0 },
      recentLogs,
    });
  }

  // GET /api/pipeline/logs
  if (method === 'GET' && pathParts[0] === 'logs') {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await db.select().from(schema.pipelineLogs)
      .orderBy(desc(schema.pipelineLogs.id)).limit(limit);
    return res.json({ count: logs.length, logs });
  }

  // GET /api/pipeline/report
  if (method === 'GET' && pathParts[0] === 'report') {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const [total] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.trends).where(sql`${schema.trends.tarih} >= ${sinceStr}`);
    const [activeDays] = await db.select({ count: sql<number>`count(distinct ${schema.trends.tarih})` })
      .from(schema.trends).where(sql`${schema.trends.tarih} >= ${sinceStr}`);

    return res.json({
      period: { from: sinceStr, days },
      summary: { totalTrends: total?.count || 0, activeDays: activeDays?.count || 0 },
    });
  }

  return res.status(404).json({ error: 'Not found' });
}
