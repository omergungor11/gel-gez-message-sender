import { publishInstagramPost, publishInstagramCarousel } from './instagram.js';
import { publishFacebookPost } from './facebook.js';
import { isMetaConfigured, isFacebookConfigured } from './meta-client.js';
import { db, schema } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { config } from '../../config/index.js';
import type { Trend, SocialPost } from '../../db/schema.js';
import path from 'path';

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}

/**
 * Convert a local file path to a public URL
 * Meta API requires publicly accessible image URLs
 */
function toPublicUrl(localPath: string): string {
  if (!config.PUBLIC_BASE_URL) {
    // Fallback: serve from local Express panel
    const filename = path.basename(localPath);
    return `http://localhost:${config.PORT}/output/${filename}`;
  }
  const filename = path.basename(localPath);
  return `${config.PUBLIC_BASE_URL}/output/${filename}`;
}

/**
 * Publish a trend's social content to Instagram and Facebook
 */
export async function publishTrendToSocial(trendId: number): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  const trend = db.select().from(schema.trends).where(eq(schema.trends.id, trendId)).get();
  if (!trend) {
    return [{ platform: 'all', success: false, error: 'Trend not found' }];
  }

  // Get social posts for this trend
  const posts = db.select()
    .from(schema.socialPosts)
    .where(eq(schema.socialPosts.trendId, trendId))
    .all();

  if (posts.length === 0) {
    return [{ platform: 'all', success: false, error: 'No social content generated yet. Generate first.' }];
  }

  // Instagram: single post
  const igPost = posts.find(p => p.platform === 'instagram' && p.postType === 'single');
  if (igPost && isMetaConfigured()) {
    const imageUrl = toPublicUrl(igPost.gorselPath || '');
    const caption = `${igPost.caption || ''}\n\n${igPost.hashtags || ''}`;

    const result = await publishInstagramPost(imageUrl, caption);
    results.push({
      platform: 'instagram',
      success: result.success,
      postId: result.postId,
      permalink: result.permalink,
      error: result.error,
    });

    if (result.success) {
      db.update(schema.socialPosts)
        .set({ durumu: 'paylasildi' })
        .where(eq(schema.socialPosts.id, igPost.id))
        .run();
    }
  }

  // Instagram: carousel (panorama grid)
  const panoramaPost = posts.find(p => p.platform === 'instagram' && p.postType === 'panorama');
  if (panoramaPost && isMetaConfigured()) {
    try {
      const imagePaths: string[] = JSON.parse(panoramaPost.gorselPath || '[]');
      const imageUrls = imagePaths.map(toPublicUrl);
      const caption = `${panoramaPost.caption || ''}\n\n${panoramaPost.hashtags || ''}`;

      const result = await publishInstagramCarousel(imageUrls, caption);
      results.push({
        platform: 'instagram-carousel',
        success: result.success,
        postId: result.postId,
        error: result.error,
      });

      if (result.success) {
        db.update(schema.socialPosts)
          .set({ durumu: 'paylasildi' })
          .where(eq(schema.socialPosts.id, panoramaPost.id))
          .run();
      }
    } catch (e: any) {
      results.push({ platform: 'instagram-carousel', success: false, error: e.message });
    }
  }

  // Facebook: single post
  const fbPost = posts.find(p => p.platform === 'facebook');
  if (fbPost && isFacebookConfigured()) {
    const imageUrl = toPublicUrl(fbPost.gorselPath || '');
    const message = `${fbPost.caption || ''}\n\n${fbPost.hashtags || ''}`;

    const result = await publishFacebookPost(imageUrl, message);
    results.push({
      platform: 'facebook',
      success: result.success,
      postId: result.postId,
      error: result.error,
    });

    if (result.success) {
      db.update(schema.socialPosts)
        .set({ durumu: 'paylasildi' })
        .where(eq(schema.socialPosts.id, fbPost.id))
        .run();
    }
  }

  // Log results
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`[Publisher] Trend #${trendId}: ${succeeded} published, ${failed} failed`);

  return results;
}

/**
 * Publish all trends for a given date to social media
 */
export async function publishAllTrends(date?: string): Promise<Map<number, PublishResult[]>> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const allResults = new Map<number, PublishResult[]>();

  const trends = db.select()
    .from(schema.trends)
    .where(eq(schema.trends.tarih, targetDate))
    .all();

  for (const trend of trends) {
    const results = await publishTrendToSocial(trend.id);
    allResults.set(trend.id, results);

    // Rate limiting: 5 seconds between posts
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return allResults;
}
