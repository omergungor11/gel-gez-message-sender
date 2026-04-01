import { Router } from 'express';
import { db, schema } from '../../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { publishTrendToSocial, publishAllTrends } from '../../social/publisher/index.js';
import { isMetaConfigured, isFacebookConfigured } from '../../social/publisher/meta-client.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/social/posts - List all social posts
router.get('/posts', (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const platform = req.query.platform as string;

  let query = db.select().from(schema.socialPosts).orderBy(desc(schema.socialPosts.id));

  const posts = query.all().filter(p => {
    if (date && p.tarih !== date) return false;
    if (platform && p.platform !== platform) return false;
    return true;
  });

  res.json({ count: posts.length, posts });
});

// GET /api/social/posts/:id - Get single social post
router.get('/posts/:id', (req, res) => {
  const post = db.select()
    .from(schema.socialPosts)
    .where(eq(schema.socialPosts.id, parseInt(req.params.id)))
    .get();

  if (!post) return res.status(404).json({ error: 'Post bulunamadı' });
  res.json(post);
});

// GET /api/social/image/:filename - Serve generated images
router.get('/image/:filename', (req, res) => {
  const outputDir = path.resolve(process.cwd(), 'output');
  const filePath = path.join(outputDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Görsel bulunamadı' });
  }

  res.sendFile(filePath);
});

// GET /api/social/status - Check Meta API configuration status
router.get('/status', (req, res) => {
  res.json({
    instagram: isMetaConfigured(),
    facebook: isFacebookConfigured(),
  });
});

// POST /api/social/publish/:trendId - Publish trend to Instagram + Facebook
router.post('/publish/:trendId', async (req, res) => {
  try {
    const trendId = parseInt(req.params.trendId);
    const results = await publishTrendToSocial(trendId);
    const allSuccess = results.every(r => r.success);
    res.json({ success: allSuccess, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/social/publish-all - Publish all trends for a date
router.post('/publish-all', async (req, res) => {
  try {
    const date = (req.body.date as string) || new Date().toISOString().split('T')[0];
    const resultsMap = await publishAllTrends(date);
    const summary = {
      total: resultsMap.size,
      published: 0,
      failed: 0,
      results: [] as any[],
    };
    for (const [trendId, results] of resultsMap) {
      const success = results.some(r => r.success);
      if (success) summary.published++;
      else summary.failed++;
      summary.results.push({ trendId, results });
    }
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
