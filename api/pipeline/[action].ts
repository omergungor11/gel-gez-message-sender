import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../src/db/supabase.js';
import { scrapeTrendListings } from '../../src/scraper/trendScraper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    if (action === 'stats') {
      const stats = await db.getStats();
      return res.json(stats);
    }

    if (action === 'logs') {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await db.getLogs(limit);
      return res.json({ count: logs.length, logs });
    }

    if (action === 'run' && req.method === 'POST') {
      const today = new Date().toISOString().split('T')[0];
      const listings = await scrapeTrendListings();
      let saved = 0;
      for (const l of listings) {
        if (await db.getTrendByIlanIdAndDate(l.ilanId, today)) continue;
        await db.insertTrend({
          ilan_id: l.ilanId, baslik: l.baslik, fiyat: l.fiyat,
          konum: l.konum, url: l.url, image_url: l.imageUrl,
          tarih: today, created_at: new Date().toISOString(),
        });
        saved++;
      }
      await db.insertLog({ action: 'manual-scrape', status: 'success', message: `${listings.length} found, ${saved} new` });
      return res.json({ success: true, result: { trendsFound: listings.length, trendsSaved: saved, whatsappSent: 0, socialGenerated: 0 } });
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
