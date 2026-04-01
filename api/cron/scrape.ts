import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeTrendListings } from '../../src/scraper/trendScraper.js';
import { db } from '../../src/db/supabase.js';

/**
 * Vercel Cron Job: Scrape trends → save to Supabase
 * Schedule: 09:00 + 15:00 daily (vercel.json)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const listings = await scrapeTrendListings();
    let saved = 0;

    for (const listing of listings) {
      const existing = await db.getTrendByIlanIdAndDate(listing.ilanId, today);
      if (existing) continue;

      await db.insertTrend({
        ilan_id: listing.ilanId,
        baslik: listing.baslik,
        fiyat: listing.fiyat,
        konum: listing.konum,
        url: listing.url,
        image_url: listing.imageUrl,
        tarih: today,
        created_at: new Date().toISOString(),
      });
      saved++;
    }

    await db.insertLog({
      action: 'cron-scrape',
      status: 'success',
      message: `${listings.length} found, ${saved} new`,
    });

    return res.json({ success: true, found: listings.length, saved, date: today });
  } catch (error: any) {
    await db.insertLog({ action: 'cron-scrape', status: 'error', message: error.message });
    return res.status(500).json({ error: error.message });
  }
}
