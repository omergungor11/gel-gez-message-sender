import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeTrendListings } from '../../src/scraper/trendScraper.js';
import { db } from '../../src/db/supabase.js';

/**
 * Manual pipeline trigger — scrapes trends and saves to DB.
 * Limited to scraping only (10s timeout on Hobby).
 * Enrich/WA/Social triggered separately per-listing.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

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
      action: 'manual-scrape',
      status: 'success',
      message: `${listings.length} found, ${saved} new`,
    });

    return res.json({
      success: true,
      result: { trendsFound: listings.length, trendsSaved: saved, whatsappSent: 0, socialGenerated: 0 },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
