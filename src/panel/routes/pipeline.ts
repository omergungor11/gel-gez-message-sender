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

export default router;
