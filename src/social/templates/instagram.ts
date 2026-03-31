import type { Trend } from '../../db/schema.js';

// Instagram post template configuration (1080x1080)
export interface InstagramTemplate {
  width: number;
  height: number;
  bgGradient: { start: string; end: string };
  titleFont: string;
  priceFont: string;
  locationFont: string;
  brandColor: string;
}

export const instagramConfig: InstagramTemplate = {
  width: 1080,
  height: 1080,
  bgGradient: { start: '#1a1a2e', end: '#16213e' },
  titleFont: 'bold 36px Ubuntu',
  priceFont: 'bold 48px Ubuntu',
  locationFont: '24px Ubuntu',
  brandColor: '#3f475f',
};

// Panorama config for grid posts (3240x1080 → split into 3x 1080x1080)
export const panoramaConfig = {
  width: 3240,
  height: 1080,
  pieces: 3,
};

export function generateInstagramCaption(trend: Trend): { caption: string; hashtags: string } {
  const konum = trend.konum || 'KKTC';
  const fiyat = trend.fiyat || '';
  const baslik = trend.baslik;

  // Determine category from title
  const isEmlak = /villa|daire|ev|arsa|residence|stüdyo|penthouse|satılık|kiralık/i.test(baslik);
  const isArac = /araba|araç|mercedes|bmw|audi|toyota|honda|vasıta/i.test(baslik);

  let caption: string;
  let hashtags: string;

  if (isEmlak) {
    caption = [
      `🏠 ${baslik}`,
      ``,
      fiyat ? `💰 ${fiyat}` : '',
      `📍 ${konum}`,
      ``,
      `🔥 Bugünün Trend İlanlarından!`,
      ``,
      `Detaylar için linke tıklayın 👆`,
      `gelgezgor.com`,
    ].filter(Boolean).join('\n');

    hashtags = [
      '#KKTC', '#KuzeyKıbrıs', '#Emlak', '#Gayrimenkul',
      '#KKTCEmlak', '#KıbrısEmlak', '#Satılık',
      konum ? `#${konum.replace(/\s/g, '')}` : '',
      '#GelGezGor', '#Trendİlanlar', '#YatırımFırsatı',
      '#Girne', '#Lefkoşa', '#İskele',
    ].filter(Boolean).join(' ');
  } else if (isArac) {
    caption = [
      `🚗 ${baslik}`,
      ``,
      fiyat ? `💰 ${fiyat}` : '',
      `📍 ${konum}`,
      ``,
      `🔥 Bugünün Trend İlanlarından!`,
      ``,
      `Detaylar için bio'daki linke tıklayın!`,
      `gelgezgor.com`,
    ].filter(Boolean).join('\n');

    hashtags = [
      '#KKTC', '#KuzeyKıbrıs', '#Araba', '#Vasıta',
      '#KKTCAraba', '#SatılıkAraba', '#İkinciEl',
      '#GelGezGor', '#Trendİlanlar',
    ].filter(Boolean).join(' ');
  } else {
    caption = [
      `✨ ${baslik}`,
      ``,
      fiyat ? `💰 ${fiyat}` : '',
      `📍 ${konum}`,
      ``,
      `🔥 Bugünün Trend İlanlarından!`,
      ``,
      `gelgezgor.com`,
    ].filter(Boolean).join('\n');

    hashtags = [
      '#KKTC', '#KuzeyKıbrıs', '#İlan',
      '#GelGezGor', '#Trendİlanlar', '#KKTCAlışveriş',
    ].filter(Boolean).join(' ');
  }

  return { caption, hashtags };
}
