import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';

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

  // Extract listing owner name
  let ilanSahibi = '';
  // Look for common patterns: "İlan Sahibi:", owner name near phone
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('İlan Sahibi') || text.includes('ilan sahibi')) {
      // The name is usually the next sibling or inside the same container
      const parent = $(el).parent();
      const nameText = parent.text().replace(/İlan Sahibi:?/gi, '').trim();
      if (nameText && nameText.length < 100) {
        ilanSahibi = nameText.split('\n')[0].trim();
        return false;
      }
    }
  });

  // Fallback: look for name near phone links
  if (!ilanSahibi) {
    const phoneParent = $('a[href^="tel:"]').closest('div, section, aside');
    const nameCandidate = phoneParent.find('h4, h5, strong, b').first().text().trim();
    if (nameCandidate && nameCandidate.length < 80) {
      ilanSahibi = nameCandidate;
    }
  }

  // Extract shop/store name
  let magaza = '';
  $('a[href*="/magaza/"], a[href*="/store/"], a[href*="/shop/"]').each((_, el) => {
    magaza = $(el).text().trim();
    return false;
  });

  // Extract description
  let aciklama = '';
  $('[class*="description"], [class*="aciklama"], [id*="description"]').each((_, el) => {
    aciklama = $(el).text().trim().substring(0, 500);
    return false;
  });
  if (!aciklama) {
    // Look for description-like blocks
    $('p, .detail-text, .ilan-text').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && text.length < 1000) {
        aciklama = text.substring(0, 500);
        return false;
      }
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
  const trend = db.select().from(schema.trends).where(eq(schema.trends.id, trendId)).get();
  if (!trend) {
    console.log(`[Detail] Trend #${trendId} bulunamadı`);
    return;
  }

  // Skip if already enriched
  if (trend.telefon) {
    console.log(`[Detail] Trend #${trendId} zaten zenginleştirilmiş, atlanıyor`);
    return;
  }

  console.log(`[Detail] ${trend.baslik} detayları çekiliyor...`);
  const detail = await scrapeListingDetail(trend.url);

  db.update(schema.trends)
    .set({
      telefon: detail.telefon,
      whatsappNo: detail.whatsappNo,
      ilanSahibi: detail.ilanSahibi,
      magaza: detail.magaza,
      aciklama: detail.aciklama,
      opiImages: JSON.stringify(detail.images),
    })
    .where(eq(schema.trends.id, trendId))
    .run();

  console.log(`[Detail] Trend #${trendId} güncellendi: tel=${detail.telefon}, wa=${detail.whatsappNo}, ${detail.images.length} görsel`);
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
