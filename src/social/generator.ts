import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { generateInstagramPost, generateFacebookPost, generatePanoramaGrid } from './canvas.js';
import { generateCaptionWithGemini, generateImagenPrompt, generateImageWithImagen } from './gemini.js';
import { generateInstagramCaption } from './templates/instagram.js';
import { generateFacebookCaption } from './templates/facebook.js';
import type { Trend, NewSocialPost } from '../db/schema.js';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

export interface GeneratedContent {
  instagramPost: string;    // image path
  facebookPost: string;     // image path
  panoramaGrid: string[];   // 3 image paths
  instagramCaption: string;
  instagramHashtags: string;
  facebookCaption: string;
  facebookHashtags: string;
  imagenUsed: boolean;
}

export async function generateSocialContent(trend: Trend): Promise<GeneratedContent> {
  console.log(`[Generator] İçerik üretiliyor: ${trend.baslik}`);

  // 1. Generate captions (try Gemini first, fallback to templates)
  let igCaption: { caption: string; hashtags: string };
  let fbCaption: { caption: string; hashtags: string };

  try {
    [igCaption, fbCaption] = await Promise.all([
      generateCaptionWithGemini(trend, 'instagram'),
      generateCaptionWithGemini(trend, 'facebook'),
    ]);
  } catch {
    igCaption = generateInstagramCaption(trend);
    fbCaption = generateFacebookCaption(trend);
  }

  // 2. Try Imagen 3 for AI-generated background, then overlay with sharp
  let imagenUsed = false;
  const imagenPrompt = await generateImagenPrompt(trend);
  const aiImage = await generateImageWithImagen(imagenPrompt, '1:1');

  if (aiImage) {
    // Save AI image as background option
    const aiPath = path.join(OUTPUT_DIR, `ai_bg_${trend.ilanId}_${Date.now()}.png`);
    await sharp(aiImage).resize(1080, 1080).toFile(aiPath);
    imagenUsed = true;
    console.log(`[Generator] Imagen 3 görseli üretildi: ${aiPath}`);
  }

  // 3. Generate visual posts with canvas (using listing images or AI background)
  const [instagramPost, facebookPost, panoramaGrid] = await Promise.all([
    generateInstagramPost(trend),
    generateFacebookPost(trend),
    generatePanoramaGrid(trend),
  ]);

  // 4. Save to database
  const today = new Date().toISOString().split('T')[0];

  const igPost: NewSocialPost = {
    trendId: trend.id,
    ilanId: trend.ilanId,
    platform: 'instagram',
    postType: 'single',
    gorselPath: instagramPost,
    caption: igCaption.caption,
    hashtags: igCaption.hashtags,
    aiPrompt: imagenPrompt,
    tarih: today,
  };

  const fbPost: NewSocialPost = {
    trendId: trend.id,
    ilanId: trend.ilanId,
    platform: 'facebook',
    postType: 'single',
    gorselPath: facebookPost,
    caption: fbCaption.caption,
    hashtags: fbCaption.hashtags,
    aiPrompt: imagenPrompt,
    tarih: today,
  };

  const panoramaPost: NewSocialPost = {
    trendId: trend.id,
    ilanId: trend.ilanId,
    platform: 'instagram',
    postType: 'panorama',
    gorselPath: JSON.stringify(panoramaGrid),
    caption: igCaption.caption,
    hashtags: igCaption.hashtags,
    tarih: today,
  };

  db.insert(schema.socialPosts).values(igPost).run();
  db.insert(schema.socialPosts).values(fbPost).run();
  db.insert(schema.socialPosts).values(panoramaPost).run();

  console.log(`[Generator] İçerik tamamlandı: IG + FB + Panorama (ilan: ${trend.ilanId})`);

  return {
    instagramPost,
    facebookPost,
    panoramaGrid,
    instagramCaption: igCaption.caption,
    instagramHashtags: igCaption.hashtags,
    facebookCaption: fbCaption.caption,
    facebookHashtags: fbCaption.hashtags,
    imagenUsed,
  };
}

export async function generateAllSocialContent(trendIds: number[]): Promise<Map<number, GeneratedContent>> {
  const results = new Map<number, GeneratedContent>();

  for (const id of trendIds) {
    const trend = db.select().from(schema.trends).where(eq(schema.trends.id, id)).get();
    if (!trend) continue;

    try {
      const content = await generateSocialContent(trend);
      results.set(id, content);
    } catch (error: any) {
      console.error(`[Generator] Trend #${id} içerik hatası:`, error.message);
    }

    // Brief pause between generations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Test] Sosyal medya içerik üretimi test ediliyor...');
  const trends = db.select().from(schema.trends).limit(1).all();
  if (trends.length > 0) {
    const content = await generateSocialContent(trends[0]);
    console.log('Instagram:', content.instagramPost);
    console.log('Facebook:', content.facebookPost);
    console.log('Panorama:', content.panoramaGrid);
    console.log('Caption:', content.instagramCaption);
  } else {
    console.log('Henüz trend ilan yok. Önce scraper çalıştırın: npm run scrape');
  }
}
