import type { Trend } from '../db/schema.js';

export interface WhatsAppMessage {
  to: string;
  body: string;
}

export function createTrendNotificationMessage(trend: Trend): string {
  const isim = trend.ilanSahibi || 'Değerli İlan Sahibi';
  const baslik = trend.baslik;
  const fiyat = trend.fiyat ? ` (${trend.fiyat})` : '';
  const url = trend.url;

  return [
    `Merhaba ${isim}! 🎉`,
    ``,
    `İlanınız *"${baslik}"*${fiyat} bugün gelgezgor.com'da *Trend İlanlar* listesinde!`,
    ``,
    `📈 Trendde olduğunuz süre boyunca daha fazla görüntülenme alacaksınız.`,
    ``,
    `💡 İpucu: İlanınızı güncel tutun ve fotoğraflarınızı yenileyin — bu, sıralamanızı daha da yukarı taşır!`,
    ``,
    `🔗 İlanınız: ${url}`,
    ``,
    `— GelGezGor.com Ekibi`,
  ].join('\n');
}

export function createSocialShareMessage(trend: Trend, socialPostUrl?: string): string {
  const baslik = trend.baslik;
  const fiyat = trend.fiyat ? ` | ${trend.fiyat}` : '';

  return [
    `📣 İlanınız için sosyal medya içeriği hazırladık!`,
    ``,
    `*${baslik}*${fiyat}`,
    ``,
    `Instagram ve Facebook için profesyonel görseller ve açıklamalar oluşturduk.`,
    socialPostUrl ? `\n🖼️ İçerikleri görüntüle: ${socialPostUrl}` : '',
    ``,
    `— GelGezGor.com`,
  ].join('\n');
}

export function createWeeklySummaryMessage(stats: {
  totalTrends: number;
  totalDays: number;
  topCategory: string;
  topLocation: string;
}): string {
  return [
    `📊 *Haftalık Trend Özeti* — gelgezgor.com`,
    ``,
    `Bu hafta *${stats.totalTrends}* ilan trend listesinde yer aldı.`,
    ``,
    `📌 En popüler kategori: *${stats.topCategory}*`,
    `📍 En popüler konum: *${stats.topLocation}*`,
    `📅 Aktif gün sayısı: *${stats.totalDays}*`,
    ``,
    `Trend listesinde yer almak isterseniz ilanınızı güncel tutun!`,
    ``,
    `— GelGezGor.com Ekibi`,
  ].join('\n');
}

export function createDopingUpsellMessage(trend: Trend): string {
  const isim = trend.ilanSahibi || 'Değerli İlan Sahibi';

  return [
    `Merhaba ${isim}! ⭐`,
    ``,
    `İlanınız *"${trend.baslik}"* trendde harika performans gösteriyor!`,
    ``,
    `💎 Doping paketi ile ilanınızı daha da öne çıkarabilirsiniz:`,
    `• Vitrin ilanı olarak listelenir`,
    `• Arama sonuçlarında üst sıralarda görünür`,
    `• Daha fazla görüntülenme ve iletişim alırsınız`,
    ``,
    `🔗 Doping paketi al: https://www.gelgezgor.com/doping`,
    ``,
    `— GelGezGor.com Ekibi`,
  ].join('\n');
}
