import { getWhatsAppClient, formatWhatsAppNumber } from './client.js';
import { createTrendNotificationMessage } from './templates.js';
import { config, isDryRun } from '../config/index.js';

const isVercel = !!process.env.VERCEL;

interface SendResult {
  success: boolean;
  trendId: number;
  error?: string;
}

async function updateTrendWAStatus(trendId: number, status: string, tarih?: string) {
  if (isVercel) {
    const { db } = await import('../db/supabase.js');
    const fields: Record<string, string> = { whatsapp_durumu: status };
    if (tarih) fields.whatsapp_tarih = tarih;
    await db.updateTrend(trendId, fields);
  } else {
    const { db, schema } = await import('../db/index.js');
    const { eq } = await import('drizzle-orm');
    const fields: any = { whatsappDurumu: status };
    if (tarih) fields.whatsappTarih = tarih;
    db.update(schema.trends).set(fields).where(eq(schema.trends.id, trendId)).run();
  }
}

export async function sendTrendNotification(trend: any): Promise<SendResult> {
  // Handle both camelCase (local SQLite) and snake_case (Supabase) field names
  const whatsappTo = trend.whatsappNo || trend.whatsapp_no || trend.telefon;
  const whatsappDurumu = trend.whatsappDurumu || trend.whatsapp_durumu;
  const ilanSahibi = trend.ilanSahibi || trend.ilan_sahibi;
  const trendId = trend.id;

  if (!whatsappTo) {
    return { success: false, trendId, error: 'Telefon numarasi bulunamadi' };
  }

  if (whatsappDurumu === 'gonderildi') {
    return { success: true, trendId };
  }

  // Build a normalized trend object for template
  const normalizedTrend = {
    ...trend,
    ilanSahibi: ilanSahibi || trend.magaza || 'Degerli Ilan Sahibi',
    whatsappNo: whatsappTo,
  };

  const message = createTrendNotificationMessage(normalizedTrend);
  const to = formatWhatsAppNumber(whatsappTo);

  if (isDryRun) {
    console.log(`[WhatsApp DRY-RUN] Trend #${trendId} → ${to}`);
    await updateTrendWAStatus(trendId, 'gonderildi', new Date().toISOString());
    return { success: true, trendId };
  }

  try {
    const client = getWhatsAppClient();
    const result = await client.messages.create({
      from: config.TWILIO_WHATSAPP_NUMBER,
      to,
      body: message,
    });

    console.log(`[WhatsApp] Trend #${trendId} → ${to} gönderildi (SID: ${result.sid})`);
    await updateTrendWAStatus(trendId, 'gonderildi', new Date().toISOString());
    return { success: true, trendId };
  } catch (error: any) {
    console.error(`[WhatsApp] Trend #${trendId} hata:`, error.message);
    await updateTrendWAStatus(trendId, 'hata');
    return { success: false, trendId, error: error.message };
  }
}

export async function sendBulkNotifications(trendIds: number[]): Promise<SendResult[]> {
  const results: SendResult[] = [];

  for (const id of trendIds) {
    let trend: any;
    if (isVercel) {
      const { db } = await import('../db/supabase.js');
      trend = await db.getTrendById(id);
    } else {
      const { db, schema } = await import('../db/index.js');
      const { eq } = await import('drizzle-orm');
      trend = db.select().from(schema.trends).where(eq(schema.trends.id, id)).get();
    }
    if (!trend) continue;

    const result = await sendTrendNotification(trend);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  return results;
}
