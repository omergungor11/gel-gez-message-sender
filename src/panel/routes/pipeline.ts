import { Router } from 'express';
import { db, schema } from '../../db/index.js';
import { desc, sql, eq } from 'drizzle-orm';
import { runPipeline } from '../../pipeline/index.js';

const router = Router();

// POST /api/pipeline/run - Run the full pipeline manually
router.post('/run', async (req, res) => {
  try {
    const result = await runPipeline();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pipeline/logs - Get pipeline logs
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const logs = db.select()
    .from(schema.pipelineLogs)
    .orderBy(desc(schema.pipelineLogs.id))
    .limit(limit)
    .all();

  res.json({ count: logs.length, logs });
});

// GET /api/stats - Dashboard statistics
router.get('/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const todayTrends = db.select({ count: sql<number>`count(*)` })
    .from(schema.trends)
    .where(eq(schema.trends.tarih, today))
    .get();

  const totalTrends = db.select({ count: sql<number>`count(*)` })
    .from(schema.trends)
    .get();

  const whatsappSent = db.select({ count: sql<number>`count(*)` })
    .from(schema.trends)
    .where(eq(schema.trends.whatsappDurumu, 'gonderildi'))
    .get();

  const totalSocialPosts = db.select({ count: sql<number>`count(*)` })
    .from(schema.socialPosts)
    .get();

  const todaySocialPosts = db.select({ count: sql<number>`count(*)` })
    .from(schema.socialPosts)
    .where(eq(schema.socialPosts.tarih, today))
    .get();

  const recentLogs = db.select()
    .from(schema.pipelineLogs)
    .orderBy(desc(schema.pipelineLogs.id))
    .limit(5)
    .all();

  res.json({
    today,
    trends: {
      today: todayTrends?.count || 0,
      total: totalTrends?.count || 0,
    },
    whatsapp: {
      sent: whatsappSent?.count || 0,
    },
    social: {
      today: todaySocialPosts?.count || 0,
      total: totalSocialPosts?.count || 0,
    },
    recentLogs,
  });
});

// GET /api/pipeline/report - Weekly report
router.get('/report', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  // Total trends in period
  const totalTrends = db.select({ count: sql<number>`count(*)` })
    .from(schema.trends)
    .where(sql`${schema.trends.tarih} >= ${sinceStr}`)
    .get();

  // Unique days with trends
  const activeDays = db.select({ count: sql<number>`count(distinct ${schema.trends.tarih})` })
    .from(schema.trends)
    .where(sql`${schema.trends.tarih} >= ${sinceStr}`)
    .get();

  // WA stats in period
  const waSent = db.select({ count: sql<number>`count(*)` })
    .from(schema.trends)
    .where(sql`${schema.trends.tarih} >= ${sinceStr} AND ${schema.trends.whatsappDurumu} = 'gonderildi'`)
    .get();

  // Social posts in period
  const socialCount = db.select({ count: sql<number>`count(*)` })
    .from(schema.socialPosts)
    .where(sql`${schema.socialPosts.tarih} >= ${sinceStr}`)
    .get();

  // Top locations
  const topLocations = db.select({
    konum: schema.trends.konum,
    count: sql<number>`count(*)`,
  })
    .from(schema.trends)
    .where(sql`${schema.trends.tarih} >= ${sinceStr} AND ${schema.trends.konum} != ''`)
    .groupBy(schema.trends.konum)
    .orderBy(sql`count(*) desc`)
    .limit(5)
    .all();

  // Daily breakdown
  const dailyBreakdown = db.select({
    tarih: schema.trends.tarih,
    count: sql<number>`count(*)`,
  })
    .from(schema.trends)
    .where(sql`${schema.trends.tarih} >= ${sinceStr}`)
    .groupBy(schema.trends.tarih)
    .orderBy(desc(schema.trends.tarih))
    .all();

  res.json({
    period: { from: sinceStr, to: new Date().toISOString().split('T')[0], days },
    summary: {
      totalTrends: totalTrends?.count || 0,
      activeDays: activeDays?.count || 0,
      whatsappSent: waSent?.count || 0,
      socialPosts: socialCount?.count || 0,
    },
    topLocations,
    dailyBreakdown,
  });
});

export default router;
