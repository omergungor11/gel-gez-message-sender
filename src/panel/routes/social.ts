import { Router } from 'express';
import { db, schema } from '../../db/index.js';
import { eq, desc } from 'drizzle-orm';
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

export default router;
