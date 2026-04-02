import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config/index.js';

export interface TrendListing {
  ilanId: string;
  baslik: string;
  fiyat: string;
  konum: string;
  url: string;
  imageUrl: string;
}

export async function scrapeTrendListings(): Promise<TrendListing[]> {
  const { data: html } = await axios.get(config.BASE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
  });

  const $ = cheerio.load(html);
  const listings: TrendListing[] = [];

  // Site structure (verified via debug):
  // div.bilesen.ilan_listeleme
  //   → div.baslik.alternatif > h3 ("Bugünün Trend İlanları")
  //   → div.row > div.col-md-7 > div.liste.alternatif
  //       → a.r_ust > img.img-responsive + div.fiyat_layer
  //       → h3 > a (title + URL)
  //       → div.il_ilce (location)

  // Find the trend section heading
  const trendHeading = $('h3').filter((_, el) => {
    return $(el).text().trim().includes('Trend');
  }).first();

  if (!trendHeading.length) {
    console.log('[Scraper] Trend ilanları bölümü bulunamadı');
    return listings;
  }

  // Navigate: h3 → div.baslik.alternatif → next sibling div.row
  const rowContainer = trendHeading.closest('.baslik').next('.row');

  if (!rowContainer.length) {
    console.log('[Scraper] Trend bölümü row container bulunamadı');
    return listings;
  }

  // Parse each listing card: div.liste.alternatif
  rowContainer.find('.liste.alternatif').each((_, el) => {
    const card = $(el);

    // URL + Title from h3 > a
    const titleLink = card.find('h3 a').first();
    const href = titleLink.attr('href') || '';
    const baslik = titleLink.attr('title') || titleLink.text().trim();

    // Extract listing ID from URL (last number after dash)
    const slugMatch = href.match(/-(\d+)$/);
    if (!slugMatch || !baslik) return;

    const ilanId = slugMatch[1];

    // Skip if already collected (duplicate links)
    if (listings.some(l => l.ilanId === ilanId)) return;

    // Image from a.r_ust > img
    const img = card.find('a.r_ust img').first();
    const imageUrl = img.attr('src') || img.attr('data-src') || '';

    // Price from div.fiyat_layer
    const fiyatEl = card.find('.fiyat_layer').first();
    const fiyat = fiyatEl.text().trim();

    // Location from div.il_ilce
    const konumEl = card.find('.il_ilce').first();
    const konum = konumEl.text().trim();

    const url = href.startsWith('http') ? href : `${config.BASE_URL}/${href}`;

    listings.push({
      ilanId,
      baslik: baslik.substring(0, 200),
      fiyat,
      konum,
      url,
      imageUrl: imageUrl.startsWith('http') ? imageUrl : imageUrl ? `${config.BASE_URL}${imageUrl}` : '',
    });
  });

  console.log(`[Scraper] ${listings.length} trend ilan bulundu`);
  return listings;
}

/**
 * Save trends to local SQLite DB (for local dev only).
 * On Vercel, the API route handles saving to Supabase directly.
 */
export async function saveTrendsToDb(listings: TrendListing[]): Promise<number[]> {
  // Lazy import — SQLite only available in local dev
  const { db, schema } = await import('../db/index.js');
  const { eq, and } = await import('drizzle-orm');

  const today = new Date().toISOString().split('T')[0];
  const savedIds: number[] = [];

  for (const listing of listings) {
    const existing = db.select()
      .from(schema.trends)
      .where(and(
        eq(schema.trends.ilanId, listing.ilanId),
        eq(schema.trends.tarih, today)
      ))
      .get();

    if (existing) {
      savedIds.push(existing.id);
      continue;
    }

    const result = db.insert(schema.trends).values({
      ilanId: listing.ilanId,
      baslik: listing.baslik,
      fiyat: listing.fiyat,
      konum: listing.konum,
      url: listing.url,
      imageUrl: listing.imageUrl,
      tarih: today,
    }).returning().get();

    savedIds.push(result.id);
  }

  console.log(`[DB] ${savedIds.length} trend ilan kaydedildi (tarih: ${today})`);
  return savedIds;
}

// Direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Test] Trend ilanları scrape ediliyor...');
  const listings = await scrapeTrendListings();
  console.log(JSON.stringify(listings, null, 2));
  const ids = await saveTrendsToDb(listings);
  console.log(`[Test] Kaydedilen ID'ler:`, ids);
}
