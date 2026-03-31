import type { Trend } from '../../db/schema.js';

// Facebook post template configuration (1200x630)
export interface FacebookTemplate {
  width: number;
  height: number;
  bgGradient: { start: string; end: string };
  titleFont: string;
  priceFont: string;
  brandColor: string;
}

export const facebookConfig: FacebookTemplate = {
  width: 1200,
  height: 630,
  bgGradient: { start: '#0f0c29', end: '#302b63' },
  titleFont: 'bold 32px Ubuntu',
  priceFont: 'bold 40px Ubuntu',
  brandColor: '#3f475f',
};

export function generateFacebookCaption(trend: Trend): { caption: string; hashtags: string } {
  const konum = trend.konum || 'KKTC';
  const fiyat = trend.fiyat || '';

  const caption = [
    `🔥 Bugünün Trend İlanı!`,
    ``,
    `${trend.baslik}`,
    ``,
    fiyat ? `💰 Fiyat: ${fiyat}` : '',
    `📍 Konum: ${konum}`,
    ``,
    trend.aciklama ? `${trend.aciklama.substring(0, 200)}...` : '',
    ``,
    `👉 Detaylar: ${trend.url}`,
    ``,
    `#GelGezGor #KKTC #KuzeyKıbrıs #Trendİlanlar`,
  ].filter(Boolean).join('\n');

  const hashtags = '#GelGezGor #KKTC #Trendİlanlar';

  return { caption, hashtags };
}
