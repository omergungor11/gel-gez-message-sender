import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeTrendListings } from '../../src/scraper/trendScraper.js';
import { getDb, schema } from '../../src/db/supabase.js';
import { eq, and } from 'drizzle-orm';

/**
 * Vercel Cron Job: Scrape trend listings and save to Supabase
 * Runs at 09:00 and 15:00 (configured in vercel.json)
 *
 * This is Step 1 of the pipeline — lightweight enough for 10s timeout.
 * Enrichment + WhatsApp + Social generation are triggered manually
 * from the dashboard or via separate API calls.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Scrape trends from gelgezgor.com
    const listings = await scrapeTrendListings();

    // Save to DB (skip duplicates)
    let saved = 0;
    for (const listing of listings) {
      const [existing] = await db.select()
        .from(schema.trends)
        .where(and(
          eq(schema.trends.ilanId, listing.ilanId),
          eq(schema.trends.tarih, today),
        ));

      if (existing) continue;

      await db.insert(schema.trends).values({
        ilanId: listing.ilanId,
        baslik: listing.baslik,
        fiyat: listing.fiyat,
        konum: listing.konum,
        url: listing.url,
        imageUrl: listing.imageUrl,
        tarih: today,
      });
      saved++;
    }

    // Log
    await db.insert(schema.pipelineLogs).values({
      action: 'cron-scrape',
      status: 'success',
      message: `${listings.length} found, ${saved} new saved`,
    });

    return res.json({
      success: true,
      found: listings.length,
      saved,
      date: today,
    });
  } catch (error: any) {
    await db.insert(schema.pipelineLogs).values({
      action: 'cron-scrape',
      status: 'error',
      message: error.message,
    });
    return res.status(500).json({ error: error.message });
  }
}
