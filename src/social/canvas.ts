import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Trend } from '../db/schema.js';
import type { TemplateTheme, TemplateName, TemplateVariant } from './templates/theme-system.js';
import { autoSelectTemplate, getTemplate, getTemplateById } from './templates/theme-system.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(response.data);
}

function parseImages(trend: Trend): string[] {
  try { return trend.opiImages ? JSON.parse(trend.opiImages) : []; }
  catch { return []; }
}

function getBestImageUrl(trend: Trend): string | undefined {
  const images = parseImages(trend);
  return images[0] || trend.imageUrl || undefined;
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function svgText(lines: string[], size: number, color: string, x: number, y: number, font: string, weight = 'bold'): string {
  return lines.map((line, i) =>
    `<text x="${x}" y="${y + i * (size + 8)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`
  ).join('\n');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

// ─── BADGE RENDERERS ───────────────────────────────

function renderBadge(t: TemplateTheme, x: number, y: number, text: string): string {
  const w = 180, h = 50;
  if (t.badgeStyle === 'pill') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.badge}" />
      <text x="${x + w / 2}" y="${y + h / 2 + 7}" font-family="${t.brandFont}" font-size="20" font-weight="bold" fill="${t.badgeText}" text-anchor="middle">${text}</text>`;
  }
  if (t.badgeStyle === 'square') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${t.borderRadius}" fill="${t.badge}" />
      <text x="${x + w / 2}" y="${y + h / 2 + 7}" font-family="${t.brandFont}" font-size="20" font-weight="bold" fill="${t.badgeText}" text-anchor="middle">${text}</text>`;
  }
  // ribbon
  return `<polygon points="${x},${y} ${x + w + 20},${y} ${x + w},${y + h} ${x},${y + h}" fill="${t.badge}" />
    <text x="${x + w / 2}" y="${y + h / 2 + 7}" font-family="${t.brandFont}" font-size="20" font-weight="bold" fill="${t.badgeText}" text-anchor="middle">${text}</text>`;
}

function renderPrice(t: TemplateTheme, fiyat: string, x: number, y: number): string {
  if (!fiyat) return '';
  if (t.priceStyle === 'badge') {
    const pw = Math.max(fiyat.length * 24, 200);
    return `<rect x="${x}" y="${y}" width="${pw}" height="55" rx="8" fill="${t.accent}" opacity="0.95" />
      <text x="${x + 18}" y="${y + 38}" font-family="${t.priceFont}" font-size="${t.priceSize - 4}" font-weight="bold" fill="${t.accentText}">${esc(fiyat)}</text>`;
  }
  if (t.priceStyle === 'inline') {
    return `<text x="${x}" y="${y + 38}" font-family="${t.priceFont}" font-size="${t.priceSize}" font-weight="bold" fill="${t.accent}">${esc(fiyat)}</text>`;
  }
  // tag
  const pw = Math.max(fiyat.length * 26, 220);
  return `<rect x="${x}" y="${y}" width="${pw}" height="58" fill="${t.accent}" />
    <polygon points="${x + pw},${y} ${x + pw + 25},${y + 29} ${x + pw},${y + 58}" fill="${t.accent}" />
    <text x="${x + 16}" y="${y + 40}" font-family="${t.priceFont}" font-size="${t.priceSize - 2}" font-weight="bold" fill="${t.accentText}">${esc(fiyat)}</text>`;
}

function renderBrand(t: TemplateTheme, x: number, y: number, w: number): string {
  const bw = 190, bh = 46;
  return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${t.borderRadius}" fill="${t.overlay}" />
    <text x="${x + bw / 2}" y="${y + bh / 2 + 6}" font-family="${t.brandFont}" font-size="16" font-weight="bold" fill="${t.textPrimary}" text-anchor="middle">gelgezgor.com</text>`;
}

// ─── OVERLAY GRADIENT ──────────────────────────────

function overlayGradient(t: TemplateTheme, direction: 'vertical' | 'horizontal' = 'vertical'): string {
  const isLight = t.variant === 'light';
  const base = isLight ? '255,255,255' : '0,0,0';
  if (direction === 'vertical') {
    return `<linearGradient id="ov" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(${base},0);stop-opacity:0" />
      <stop offset="45%" style="stop-color:rgba(${base},0.2);stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:rgba(${base},0.88);stop-opacity:0.88" />
    </linearGradient>`;
  }
  return `<linearGradient id="ov" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" style="stop-color:rgba(${base},0.85);stop-opacity:0.85" />
    <stop offset="55%" style="stop-color:rgba(${base},0.35);stop-opacity:0.35" />
    <stop offset="100%" style="stop-color:rgba(${base},0);stop-opacity:0" />
  </linearGradient>`;
}

// ─── MAIN GENERATORS ───────────────────────────────

export interface GenerateOptions {
  templateId?: string;       // e.g. "elegant-dark" — manual override
  templateName?: TemplateName;
  templateVariant?: TemplateVariant;
}

async function loadImage(trend: Trend): Promise<Buffer | null> {
  const imageUrl = getBestImageUrl(trend);
  if (!imageUrl) return null;
  try { return await downloadImage(imageUrl); }
  catch { console.log(`[Canvas] Görsel indirilemedi`); return null; }
}

function resolveTheme(trend: Trend, opts?: GenerateOptions): TemplateTheme {
  if (opts?.templateId) {
    const t = getTemplateById(opts.templateId);
    if (t) return t;
  }
  if (opts?.templateName && opts?.templateVariant) {
    return getTemplate(opts.templateName, opts.templateVariant);
  }
  return autoSelectTemplate(trend.baslik);
}

export async function generateInstagramPost(trend: Trend, opts?: GenerateOptions): Promise<string> {
  const W = 1080, H = 1080;
  const t = resolveTheme(trend, opts);
  const titleLines = wrapText(trend.baslik, 28);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';
  const imageBuffer = await loadImage(trend);
  const bg = hexToRgb(t.bgPrimary);

  const svg = `
    <svg width="${W}" height="${H}">
      <defs>${overlayGradient(t, 'vertical')}</defs>

      ${!imageBuffer ? `<rect width="${W}" height="${H}" fill="${t.bgPrimary}" />` : ''}
      <rect width="${W}" height="${H}" fill="url(#ov)" />

      <!-- Badge -->
      ${renderBadge(t, 40, 40, '🔥 TREND')}

      <!-- Brand -->
      ${renderBrand(t, W - 230, 40, W)}

      <!-- Price -->
      ${renderPrice(t, fiyat, 40, H - 290)}

      <!-- Title -->
      ${svgText(titleLines, t.titleSize, t.textPrimary, 40, H - 200, t.titleFont)}

      <!-- Location -->
      <text x="40" y="${H - 50}" font-family="${t.locationFont}" font-size="${t.locationSize}" fill="${t.textSecondary}">📍 ${esc(konum)}</text>

      <!-- Template ID watermark -->
      <text x="${W - 20}" y="${H - 16}" font-family="${t.brandFont}" font-size="10" fill="${t.textSecondary}" text-anchor="end" opacity="0.4">${t.id}</text>

      ${t.bottomBar ? `<rect x="0" y="${H - t.bottomBarHeight}" width="${W}" height="${t.bottomBarHeight}" fill="${t.accent}" />` : ''}
    </svg>
  `;

  let composite: sharp.Sharp;
  if (imageBuffer) {
    composite = sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  } else {
    composite = sharp({ create: { width: W, height: H, channels: 4, background: { ...bg, alpha: 1 } } })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  }

  const filename = `ig_${trend.ilanId}_${t.id}_${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  await composite.png().toFile(outputPath);
  console.log(`[Canvas] IG post (${t.id}): ${filename}`);
  return outputPath;
}

export async function generateFacebookPost(trend: Trend, opts?: GenerateOptions): Promise<string> {
  const W = 1200, H = 630;
  const t = resolveTheme(trend, opts);
  const titleLines = wrapText(trend.baslik, 36);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';
  const imageBuffer = await loadImage(trend);
  const bg = hexToRgb(t.bgPrimary);

  const svg = `
    <svg width="${W}" height="${H}">
      <defs>${overlayGradient(t, 'horizontal')}</defs>

      ${!imageBuffer ? `<rect width="${W}" height="${H}" fill="${t.bgPrimary}" />` : ''}
      <rect width="${W}" height="${H}" fill="url(#ov)" />

      ${renderBadge(t, 40, 30, '🔥 TREND')}

      ${svgText(titleLines, t.titleSize - 4, t.textPrimary, 40, 120, t.titleFont)}

      ${renderPrice(t, fiyat, 40, 120 + titleLines.length * (t.titleSize + 4) + 10)}

      <text x="40" y="${H - 50}" font-family="${t.locationFont}" font-size="${t.locationSize - 2}" fill="${t.textSecondary}">📍 ${esc(konum)}</text>

      ${renderBrand(t, W - 230, H - 60, W)}

      <text x="${W - 20}" y="${H - 16}" font-family="${t.brandFont}" font-size="10" fill="${t.textSecondary}" text-anchor="end" opacity="0.4">${t.id}</text>

      ${t.bottomBar ? `<rect x="0" y="${H - t.bottomBarHeight}" width="${W}" height="${t.bottomBarHeight}" fill="${t.accent}" />` : ''}
    </svg>
  `;

  let composite: sharp.Sharp;
  if (imageBuffer) {
    composite = sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  } else {
    composite = sharp({ create: { width: W, height: H, channels: 4, background: { ...bg, alpha: 1 } } })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  }

  const filename = `fb_${trend.ilanId}_${t.id}_${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  await composite.png().toFile(outputPath);
  console.log(`[Canvas] FB post (${t.id}): ${filename}`);
  return outputPath;
}

export async function generatePanoramaGrid(trend: Trend, opts?: GenerateOptions): Promise<string[]> {
  const W = 3240, H = 1080, PIECE_W = 1080;
  const t = resolveTheme(trend, opts);
  const fiyat = trend.fiyat || '';
  const titleLines = wrapText(trend.baslik, 48);
  const konum = trend.konum || 'KKTC';
  const imageBuffer = await loadImage(trend);
  const bg = hexToRgb(t.bgPrimary);

  const svg = `
    <svg width="${W}" height="${H}">
      <defs>${overlayGradient(t, 'vertical')}</defs>

      ${!imageBuffer ? `<rect width="${W}" height="${H}" fill="${t.bgPrimary}" />` : ''}
      <rect width="${W}" height="${H}" fill="url(#ov)" />

      ${renderBadge(t, 60, 60, '🔥 TREND')}

      ${svgText(titleLines, t.titleSize + 6, t.textPrimary, 60, H - 210, t.titleFont)}

      ${renderPrice(t, fiyat, W - 520, H - 130)}

      <text x="60" y="${H - 40}" font-family="${t.locationFont}" font-size="${t.locationSize + 4}" fill="${t.textSecondary}">📍 ${esc(konum)}</text>

      <text x="${W - 250}" y="${H - 44}" font-family="${t.brandFont}" font-size="20" font-weight="bold" fill="${t.textSecondary}" opacity="0.7">gelgezgor.com</text>
    </svg>
  `;

  let wideImage: sharp.Sharp;
  if (imageBuffer) {
    wideImage = sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  } else {
    wideImage = sharp({ create: { width: W, height: H, channels: 4, background: { ...bg, alpha: 1 } } })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  }

  const wideBuffer = await wideImage.png().toBuffer();
  const pieces: string[] = [];

  for (let i = 0; i < 3; i++) {
    const filename = `panorama_${trend.ilanId}_${t.id}_${i + 1}_${Date.now()}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    await sharp(wideBuffer).extract({ left: i * PIECE_W, top: 0, width: PIECE_W, height: H }).toFile(outputPath);
    pieces.push(outputPath);
  }

  console.log(`[Canvas] Panorama (${t.id}): 3 parça (ilan: ${trend.ilanId})`);
  return pieces;
}
