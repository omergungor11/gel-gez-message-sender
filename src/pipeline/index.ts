import { scrapeTrendListings, saveTrendsToDb } from '../scraper/trendScraper.js';
import { enrichAllTrends } from '../scraper/detailScraper.js';
import { sendBulkNotifications } from '../whatsapp/sender.js';
import { generateAllSocialContent } from '../social/generator.js';
import { db, schema } from '../db/index.js';
import { isDryRun } from '../config/index.js';

export interface PipelineResult {
  trendsFound: number;
  trendsSaved: number;
  whatsappSent: number;
  whatsappFailed: number;
  socialGenerated: number;
  errors: string[];
  duration: number;
}

function log(action: string, status: 'success' | 'error', message: string, details?: any) {
  const emoji = status === 'success' ? '✅' : '❌';
  console.log(`${emoji} [Pipeline/${action}] ${message}`);

  db.insert(schema.pipelineLogs).values({
    action,
    status,
    message,
    details: details ? JSON.stringify(details) : undefined,
  }).run();
}

export async function runPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('═══════════════════════════════════════════');
  console.log('  GelGezGor Trend Pipeline');
  console.log(`  ${new Date().toLocaleString('tr-TR')}${isDryRun ? ' [DRY-RUN]' : ''}`);
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Scrape trend listings
  console.log('📡 Adım 1/4: Trend ilanları scrape ediliyor...');
  let listings;
  try {
    listings = await scrapeTrendListings();
    log('scrape', 'success', `${listings.length} trend ilan bulundu`);
  } catch (error: any) {
    log('scrape', 'error', error.message);
    errors.push(`Scrape hatası: ${error.message}`);
    return { trendsFound: 0, trendsSaved: 0, whatsappSent: 0, whatsappFailed: 0, socialGenerated: 0, errors, duration: Date.now() - startTime };
  }

  // Step 2: Save to DB and enrich with details
  console.log('\n💾 Adım 2/4: Veritabanına kaydediliyor ve detaylar çekiliyor...');
  let savedIds: number[];
  try {
    savedIds = await saveTrendsToDb(listings);
    await enrichAllTrends(savedIds);
    log('enrich', 'success', `${savedIds.length} ilan zenginleştirildi`);
  } catch (error: any) {
    log('enrich', 'error', error.message);
    errors.push(`Enrich hatası: ${error.message}`);
    savedIds = [];
  }

  // Step 3: Send WhatsApp notifications
  console.log('\n📱 Adım 3/4: WhatsApp bildirimleri gönderiliyor...');
  let whatsappSent = 0, whatsappFailed = 0;
  try {
    const results = await sendBulkNotifications(savedIds);
    whatsappSent = results.filter(r => r.success).length;
    whatsappFailed = results.filter(r => !r.success).length;
    log('whatsapp', 'success', `${whatsappSent} gönderildi, ${whatsappFailed} başarısız`);
  } catch (error: any) {
    log('whatsapp', 'error', error.message);
    errors.push(`WhatsApp hatası: ${error.message}`);
  }

  // Step 4: Generate social media content
  console.log('\n🎨 Adım 4/4: Sosyal medya içerikleri üretiliyor...');
  let socialGenerated = 0;
  try {
    const contentMap = await generateAllSocialContent(savedIds);
    socialGenerated = contentMap.size;
    log('social', 'success', `${socialGenerated} ilan için içerik üretildi`);
  } catch (error: any) {
    log('social', 'error', error.message);
    errors.push(`Sosyal medya hatası: ${error.message}`);
  }

  const duration = Date.now() - startTime;

  console.log('\n═══════════════════════════════════════════');
  console.log('  Pipeline Tamamlandı!');
  console.log(`  Süre: ${(duration / 1000).toFixed(1)}s`);
  console.log(`  Trend: ${listings.length} | WA: ${whatsappSent}/${savedIds.length} | Sosyal: ${socialGenerated}`);
  if (errors.length) console.log(`  Hatalar: ${errors.length}`);
  console.log('═══════════════════════════════════════════\n');

  log('pipeline', errors.length ? 'error' : 'success',
    `Pipeline tamamlandı: ${listings.length} trend, ${whatsappSent} WA, ${socialGenerated} sosyal`,
    { trendsFound: listings.length, whatsappSent, socialGenerated, errors, duration }
  );

  return {
    trendsFound: listings.length,
    trendsSaved: savedIds.length,
    whatsappSent,
    whatsappFailed,
    socialGenerated,
    errors,
    duration,
  };
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runPipeline();
  console.log('Sonuç:', JSON.stringify(result, null, 2));
}
