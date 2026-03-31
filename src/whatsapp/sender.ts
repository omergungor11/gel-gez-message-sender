import { getWhatsAppClient, formatWhatsAppNumber } from './client.js';
import { createTrendNotificationMessage } from './templates.js';
import { config, isDryRun } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import type { Trend } from '../db/schema.js';

interface SendResult {
  success: boolean;
  trendId: number;
  error?: string;
}

export async function sendTrendNotification(trend: Trend): Promise<SendResult> {
  const whatsappTo = trend.whatsappNo || trend.telefon;

  if (!whatsappTo) {
    console.log(`[WhatsApp] Trend #${trend.id}: Telefon numarası yok, atlanıyor`);
    return { success: false, trendId: trend.id, error: 'Telefon numarası bulunamadı' };
  }

  // Check if already sent today
  if (trend.whatsappDurumu === 'gonderildi') {
    console.log(`[WhatsApp] Trend #${trend.id}: Zaten gönderilmiş, atlanıyor`);
    return { success: true, trendId: trend.id };
  }

  const message = createTrendNotificationMessage(trend);
  const to = formatWhatsAppNumber(whatsappTo);

  if (isDryRun) {
    console.log(`[WhatsApp DRY-RUN] Trend #${trend.id} → ${to}`);
    console.log(`  Mesaj: ${message.substring(0, 100)}...`);

    db.update(schema.trends)
      .set({
        whatsappDurumu: 'gonderildi',
        whatsappTarih: new Date().toISOString(),
      })
      .where(eq(schema.trends.id, trend.id))
      .run();

    return { success: true, trendId: trend.id };
  }

  try {
    const client = getWhatsAppClient();
    const result = await client.messages.create({
      from: config.TWILIO_WHATSAPP_NUMBER,
      to,
      body: message,
    });

    console.log(`[WhatsApp] Trend #${trend.id} → ${to} gönderildi (SID: ${result.sid})`);

    db.update(schema.trends)
      .set({
        whatsappDurumu: 'gonderildi',
        whatsappTarih: new Date().toISOString(),
      })
      .where(eq(schema.trends.id, trend.id))
      .run();

    return { success: true, trendId: trend.id };
  } catch (error: any) {
    console.error(`[WhatsApp] Trend #${trend.id} hata:`, error.message);

    db.update(schema.trends)
      .set({ whatsappDurumu: 'hata' })
      .where(eq(schema.trends.id, trend.id))
      .run();

    return { success: false, trendId: trend.id, error: error.message };
  }
}

export async function sendBulkNotifications(trendIds: number[]): Promise<SendResult[]> {
  const results: SendResult[] = [];

  for (const id of trendIds) {
    const trend = db.select().from(schema.trends).where(eq(schema.trends.id, id)).get();
    if (!trend) continue;

    const result = await sendTrendNotification(trend);
    results.push(result);

    // Rate limiting: 1 message per second
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`[WhatsApp] Toplam: ${sent} gönderildi, ${failed} başarısız`);

  return results;
}
