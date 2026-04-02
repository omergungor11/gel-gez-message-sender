import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/index.js';

export interface ListingDetail {
  telefon: string;
  whatsappNo: string;
  ilanSahibi: string;
  magaza: string;
  aciklama: string;
  images: string[];
}

export async function scrapeListingDetail(url: string): Promise<ListingDetail> {
  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
  });

  const $ = cheerio.load(html);

  // Extract phone number from tel: links
  let telefon = '';
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const num = href.replace('tel:', '').replace(/\s/g, '');
    if (num.length >= 10) {
      telefon = num;
      return false;
    }
  });

  // Extract WhatsApp number from wa.me links
  let whatsappNo = '';
  $('a[href*="wa.me"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/wa\.me\/(\+?\d+)/);
    if (match) {
      whatsappNo = match[1];
      return false;
    }
  });

  // If no WhatsApp link, derive from phone number
  if (!whatsappNo && telefon) {
    whatsappNo = telefon.startsWith('+') ? telefon : `+90${telefon.replace(/^0/, '')}`;
  }

  // Extract store/shop name from magaza link (h3 > a[href*="/magaza/"])
  let magaza = '';
  $('h3 > a[href*="/magaza/"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 100) {
      magaza = text;
      return false;
    }
  });
  // Fallback: any link to /magaza/
  if (!magaza) {
    $('a[href*="/magaza/"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 100) {
        magaza = text;
        return false;
      }
    });
  }

  // Extract listing owner name from mobile contact bar (div.iletisim_bilgi)
  let ilanSahibi = '';
  const iletisimBilgi = $('div.iletisim_bilgi, .iletisim_bilgi').first().text().trim();
  if (iletisimBilgi) {
    // Format: "Ilan sahibi: Karibu Estates (Karibu Estates)"
    const match = iletisimBilgi.match(/[İi]lan\s*sahibi\s*:\s*(.+?)(?:\s*\(|$)/i);
    ilanSahibi = match ? match[1].trim() : iletisimBilgi.replace(/[İi]lan\s*sahibi\s*:?\s*/i, '').trim();
  }

  // Fallback: use store name as owner, or h3 inside contact panel
  if (!ilanSahibi && magaza) {
    ilanSahibi = magaza;
  }
  if (!ilanSahibi) {
    const contactPanel = $('div.panel.iletisim, .iletisim');
    const nameEl = contactPanel.find('h3').first();
    const nameText = nameEl.text().trim();
    if (nameText && nameText.length < 100) {
      ilanSahibi = nameText;
    }
  }

  // Extract description from div.ilan_icerik
  let aciklama = '';
  const ilanIcerik = $('div.ilan_icerik, .ilan_icerik').first();
  if (ilanIcerik.length) {
    aciklama = ilanIcerik.text().trim().substring(0, 500);
  }
  if (!aciklama) {
    $('[class*="description"], [class*="aciklama"]').each((_, el) => {
      aciklama = $(el).text().trim().substring(0, 500);
      return false;
    });
  }

  // Extract all listing images (filter out logos and site assets)
  const images: string[] = [];
  const skipPatterns = /web-logo|logo|favicon|icon|banner|reklam|placeholder|avatar/i;

  $('img[src*="/uploads/images/"]').each((_, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src') || '';
    // Skip logos and site assets
    if (skipPatterns.test(src)) return;
    // Get full-size version by removing dimension suffixes (e.g., -160_120.jpg → .jpg)
    src = src.replace(/-\d+_\d+\./, '.');
    if (src && !images.includes(src)) {
      const fullUrl = src.startsWith('http') ? src : `${config.BASE_URL}${src}`;
      images.push(fullUrl);
    }
  });

  // Also check Swiper/gallery containers
  $('[class*="swiper"] img, [class*="gallery"] img, [class*="slider"] img').each((_, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (skipPatterns.test(src)) return;
    if (src && !images.some(i => i.includes(src.split('/').pop()!))) {
      const fullUrl = src.startsWith('http') ? src : `${config.BASE_URL}${src}`;
      images.push(fullUrl);
    }
  });

  return {
    telefon,
    whatsappNo,
    ilanSahibi,
    magaza,
    aciklama,
    images: [...new Set(images)].slice(0, 10),
  };
}

export async function enrichTrendWithDetails(trendId: number): Promise<void> {
  const isVercel = !!process.env.VERCEL;
  let trend: any;

  if (isVercel) {
    const { db } = await import('../db/supabase.js');
    trend = await db.getTrendById(trendId);
  } else {
    const { db, schema } = await import('../db/index.js');
    const { eq } = await import('drizzle-orm');
    trend = db.select().from(schema.trends).where(eq(schema.trends.id, trendId)).get();
  }

  if (!trend) {
    console.log(`[Detail] Trend #${trendId} bulunamadı`);
    return;
  }

  if (trend.telefon) {
    console.log(`[Detail] Trend #${trendId} zaten zenginleştirilmiş, atlanıyor`);
    return;
  }

  console.log(`[Detail] ${trend.baslik || trend.baslik} detayları çekiliyor...`);
  try {
    const detail = await scrapeListingDetail(trend.url);

    const updateData = {
      telefon: detail.telefon,
      whatsapp_no: detail.whatsappNo,
      ilan_sahibi: detail.ilanSahibi,
      magaza: detail.magaza,
      aciklama: detail.aciklama,
      opi_images: JSON.stringify(detail.images),
    };

    if (isVercel) {
      const { db } = await import('../db/supabase.js');
      await db.updateTrend(trendId, updateData);
    } else {
      const { db, schema } = await import('../db/index.js');
      const { eq } = await import('drizzle-orm');
      db.update(schema.trends).set({
        telefon: detail.telefon,
        whatsappNo: detail.whatsappNo,
        ilanSahibi: detail.ilanSahibi,
        magaza: detail.magaza,
        aciklama: detail.aciklama,
        opiImages: JSON.stringify(detail.images),
      }).where(eq(schema.trends.id, trendId)).run();
    }

    console.log(`[Detail] Trend #${trendId} güncellendi: tel=${detail.telefon}, wa=${detail.whatsappNo}, sahip=${detail.ilanSahibi}, ${detail.images.length} görsel`);
  } catch (error: any) {
    console.error(`[Detail] Trend #${trendId} hata: ${error.message}`);
  }
}

export async function enrichAllTrends(trendIds: number[]): Promise<void> {
  for (const id of trendIds) {
    await enrichTrendWithDetails(id);
    // Rate limiting: 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Test] İlan detayı çekiliyor...');
  const detail = await scrapeListingDetail('https://www.gelgezgor.com/girne-catalkoyde-satilik-villa-24117');
  console.log(JSON.stringify(detail, null, 2));
}
