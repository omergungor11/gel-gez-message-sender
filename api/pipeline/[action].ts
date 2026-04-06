import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    const { db } = await import('../../src/db/supabase.js');

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
      const { scrapeTrendListings } = await import('../../src/scraper/trendScraper.js');
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

    // POST /api/pipeline/enrich-all — enrich trends missing details (batch, max 5 per call)
    if (action === 'enrich-all' && req.method === 'POST') {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const trends = await db.getTrendsByDate(date);
      const missing = trends.filter((t: any) => !t.telefon);

      if (missing.length === 0) {
        return res.json({ success: true, enriched: 0, remaining: 0, message: 'Tum ilanlar zaten zenginlestirilmis' });
      }

      // Process max 5 per call to stay under 10s timeout
      const batch = missing.slice(0, 5);
      let enriched = 0;

      for (const t of batch) {
        try {
          const { scrapeListingDetail } = await import('../../src/scraper/detailScraper.js');
          const detail = await scrapeListingDetail(t.url);
          await db.updateTrend(t.id, {
            telefon: detail.telefon,
            whatsapp_no: detail.whatsappNo,
            ilan_sahibi: detail.ilanSahibi,
            magaza: detail.magaza,
            aciklama: detail.aciklama,
            opi_images: JSON.stringify(detail.images),
          });
          enriched++;
        } catch (e: any) {
          console.error(`Enrich #${t.id} failed:`, e.message);
        }
      }

      const remaining = missing.length - enriched;
      await db.insertLog({ action: 'enrich-batch', status: 'success', message: `${enriched} enriched, ${remaining} remaining` });
      return res.json({ success: true, enriched, remaining, total: missing.length });
    }

    // POST /api/pipeline/wa-test — send test WhatsApp to yourself
    if (action === 'wa-test' && req.method === 'POST') {
      const testNumber = req.query.to as string || '+905338205149';
      const { getWhatsAppClient, formatWhatsAppNumber } = await import('../../src/whatsapp/client.js');
      const { config } = await import('../../src/config/index.js');

      const to = formatWhatsAppNumber(testNumber);
      const client = getWhatsAppClient();

      const result = await client.messages.create({
        from: config.TWILIO_WHATSAPP_NUMBER,
        to,
        body: `🧪 GelGezGor Test Mesaji\n\nBu bir test mesajidir.\nTarih: ${new Date().toLocaleString('tr-TR')}\n\nSistem calisiyor! ✅`,
      });

      await db.insertLog({ action: 'wa-test', status: 'success', message: `Test → ${to} (SID: ${result.sid})` });
      return res.json({ success: true, sid: result.sid, to });
    }

    // POST /api/pipeline/wa-send-all — send WA to all enriched trends (batch 3)
    if (action === 'wa-send-all' && req.method === 'POST') {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const trends = await db.getTrendsByDate(date);
      const pending = trends.filter((t: any) => t.telefon && t.whatsapp_durumu !== 'gonderildi');

      if (pending.length === 0) {
        return res.json({ success: true, sent: 0, remaining: 0, message: 'Gonderilecek ilan yok' });
      }

      const batch = pending.slice(0, 3); // 3 per call for 10s safety
      let sent = 0;
      const { sendTrendNotification } = await import('../../src/whatsapp/sender.js');

      for (const t of batch) {
        const result = await sendTrendNotification(t);
        if (result.success) sent++;
        await new Promise(r => setTimeout(r, 1500));
      }

      const remaining = pending.length - sent;
      await db.insertLog({ action: 'wa-batch', status: 'success', message: `${sent} sent, ${remaining} remaining` });
      return res.json({ success: true, sent, remaining, total: pending.length });
    }

    return res.status(404).json({ error: 'Unknown action' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
