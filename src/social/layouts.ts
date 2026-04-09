/**
 * Instagram Post Layouts — 5 Unique Designs (1080x1080)
 *
 * 1. CLASSIC   — Full image + bottom gradient overlay + text
 * 2. SPLIT     — Left image, right colored panel with text
 * 3. MAGAZINE  — Dramatic magazine cover with huge typography
 * 4. POLAROID  — White frame polaroid style with caption below
 * 5. MINIMAL   — Clean card with small image on top, info block below
 */
import sharp from 'sharp';
import axios from 'axios';
import type { Trend } from '../db/schema.js';
import { saveImage } from './storage.js';

const W = 1080;
const H = 1080;

// ─── UTILITIES ─────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(data);
  } catch {
    return null;
  }
}

function parseImages(trend: Trend): string[] {
  try { return trend.opiImages ? JSON.parse(trend.opiImages) : []; }
  catch { return []; }
}

function getBestImageUrl(trend: Trend): string | undefined {
  const images = parseImages(trend);
  return images[0] || trend.imageUrl || undefined;
}

async function loadTrendImage(trend: Trend): Promise<Buffer | null> {
  const url = getBestImageUrl(trend);
  if (!url) return null;
  return downloadImage(url);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
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
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}

// ─── LAYOUT 1: CLASSIC — Full image + bottom gradient + text ────

export async function layoutClassic(trend: Trend): Promise<string> {
  const imageBuffer = await loadTrendImage(trend);
  const titleLines = wrapText(trend.baslik || '', 28);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0%" y1="50%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgb(0,0,0)" stop-opacity="0"/>
          <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#fade)"/>

      <!-- TREND badge top-left -->
      <rect x="40" y="40" width="200" height="56" rx="28" fill="#e74c3c"/>
      <text x="140" y="76" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">TRENDDE</text>

      <!-- Logo top-right -->
      <rect x="${W-240}" y="40" width="200" height="56" rx="28" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
      <text x="${W-140}" y="76" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">gelgezgor.com</text>

      <!-- Price pill -->
      ${fiyat ? `
      <rect x="40" y="${H-320}" width="${Math.max(fiyat.length * 28, 240)}" height="70" rx="35" fill="#e74c3c"/>
      <text x="70" y="${H-272}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">${esc(fiyat)}</text>
      ` : ''}

      <!-- Title -->
      ${titleLines.slice(0,3).map((line, i) =>
        `<text x="40" y="${H-200 + i*44}" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="white">${esc(line)}</text>`
      ).join('')}

      <!-- Location -->
      <text x="40" y="${H-60}" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.85)">📍 ${esc(konum)}</text>

      <!-- Bottom accent bar -->
      <rect x="0" y="${H-10}" width="${W}" height="10" fill="#e74c3c"/>
    </svg>
  `;

  const base = imageBuffer
    ? sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' })
    : sharp({ create: { width: W, height: H, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 }}});

  const buffer = await base.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  const filename = `ig_classic_${trend.ilanId}_${Date.now()}.png`;
  return saveImage(buffer, filename);
}

// ─── LAYOUT 2: SPLIT — Left image 60% / Right colored panel 40% ──

export async function layoutSplit(trend: Trend): Promise<string> {
  const imageBuffer = await loadTrendImage(trend);
  const titleLines = wrapText(trend.baslik || '', 18);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  const IMG_W = 648; // 60% of 1080
  const PANEL_W = W - IMG_W;

  // Left: image resized to IMG_W x H
  const leftImage = imageBuffer
    ? await sharp(imageBuffer).resize(IMG_W, H, { fit: 'cover', position: 'center' }).png().toBuffer()
    : await sharp({ create: { width: IMG_W, height: H, channels: 4, background: { r: 44, g: 62, b: 80, alpha: 1 }}}).png().toBuffer();

  // Right panel SVG (navy background with text)
  const panelSvg = `
    <svg width="${PANEL_W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${PANEL_W}" height="${H}" fill="#1a1d3a"/>

      <!-- Gold accent line -->
      <rect x="30" y="60" width="60" height="4" fill="#d4af37"/>

      <!-- TRENDDE label -->
      <text x="30" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#d4af37" letter-spacing="4">TRENDDE</text>

      <!-- Title -->
      ${titleLines.slice(0,5).map((line, i) =>
        `<text x="30" y="${200 + i*48}" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="white">${esc(line)}</text>`
      ).join('')}

      <!-- Divider -->
      <line x1="30" y1="${H-280}" x2="${PANEL_W-30}" y2="${H-280}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

      <!-- Price -->
      ${fiyat ? `
      <text x="30" y="${H-220}" font-family="Arial, sans-serif" font-size="14" fill="#8b8fa3" letter-spacing="2">FİYAT</text>
      <text x="30" y="${H-170}" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#e74c3c">${esc(fiyat)}</text>
      ` : ''}

      <!-- Location -->
      <text x="30" y="${H-110}" font-family="Arial, sans-serif" font-size="14" fill="#8b8fa3" letter-spacing="2">KONUM</text>
      <text x="30" y="${H-80}" font-family="Arial, sans-serif" font-size="18" fill="white">${esc(konum)}</text>

      <!-- Brand footer -->
      <text x="30" y="${H-30}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#d4af37">gelgezgor.com</text>
    </svg>
  `;

  const panelImage = await sharp(Buffer.from(panelSvg)).png().toBuffer();

  // Combine left image + right panel
  const buffer = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 }}
  })
    .composite([
      { input: leftImage, top: 0, left: 0 },
      { input: panelImage, top: 0, left: IMG_W },
    ])
    .png()
    .toBuffer();

  const filename = `ig_split_${trend.ilanId}_${Date.now()}.png`;
  return saveImage(buffer, filename);
}

// ─── LAYOUT 3: MAGAZINE — Dramatic huge typography ───────────────

export async function layoutMagazine(trend: Trend): Promise<string> {
  const imageBuffer = await loadTrendImage(trend);
  const titleLines = wrapText(trend.baslik || '', 14);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mag" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgb(0,0,0)" stop-opacity="0.5"/>
          <stop offset="40%" stop-color="rgb(0,0,0)" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#mag)"/>

      <!-- Top masthead -->
      <text x="${W/2}" y="120" font-family="Arial Black, Arial, sans-serif" font-size="88" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-2">TREND</text>
      <line x1="80" y1="160" x2="${W-80}" y2="160" stroke="#e74c3c" stroke-width="6"/>
      <text x="${W/2}" y="195" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" letter-spacing="8">GELGEZGOR.COM</text>

      <!-- Massive title overlay (bottom half) -->
      ${titleLines.slice(0,4).map((line, i) =>
        `<text x="60" y="${H-350 + i*64}" font-family="Arial Black, Arial, sans-serif" font-size="56" font-weight="900" fill="white" letter-spacing="-1">${esc(line.toUpperCase())}</text>`
      ).join('')}

      <!-- Red underline -->
      <rect x="60" y="${H-90}" width="120" height="6" fill="#e74c3c"/>

      <!-- Price big -->
      ${fiyat ? `
      <text x="60" y="${H-30}" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#e74c3c">${esc(fiyat)}</text>
      ` : ''}

      <!-- Location right bottom -->
      <text x="${W-40}" y="${H-30}" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="end">${esc(konum)}</text>
    </svg>
  `;

  const base = imageBuffer
    ? sharp(imageBuffer).resize(W, H, { fit: 'cover', position: 'center' }).modulate({ saturation: 1.1 })
    : sharp({ create: { width: W, height: H, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 }}});

  const buffer = await base.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  const filename = `ig_magazine_${trend.ilanId}_${Date.now()}.png`;
  return saveImage(buffer, filename);
}

// ─── LAYOUT 4: POLAROID — White frame photo with caption ─────────

export async function layoutPolaroid(trend: Trend): Promise<string> {
  const imageBuffer = await loadTrendImage(trend);
  const titleLines = wrapText(trend.baslik || '', 30);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  // Photo inside polaroid
  const PHOTO_SIZE = 860;
  const PHOTO_X = (W - PHOTO_SIZE) / 2;
  const PHOTO_Y = 80;

  // Background texture layer (beige/paper)
  const bgSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5f0e6"/>
          <stop offset="100%" stop-color="#e8e0d0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#paper)"/>

      <!-- Small decorative corner marks -->
      <circle cx="60" cy="60" r="3" fill="#c9a84c"/>
      <circle cx="${W-60}" cy="60" r="3" fill="#c9a84c"/>
      <circle cx="60" cy="${H-60}" r="3" fill="#c9a84c"/>
      <circle cx="${W-60}" cy="${H-60}" r="3" fill="#c9a84c"/>

      <!-- Polaroid frame shadow -->
      <rect x="${PHOTO_X-20}" y="${PHOTO_Y-20}" width="${PHOTO_SIZE+40}" height="${PHOTO_SIZE+180}" fill="rgba(0,0,0,0.12)" rx="4"/>
      <rect x="${PHOTO_X-15}" y="${PHOTO_Y-15}" width="${PHOTO_SIZE+30}" height="${PHOTO_SIZE+170}" fill="white" rx="2"/>
    </svg>
  `;

  // Photo
  const photoBuffer = imageBuffer
    ? await sharp(imageBuffer).resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover', position: 'center' }).png().toBuffer()
    : await sharp({ create: { width: PHOTO_SIZE, height: PHOTO_SIZE, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 1 }}}).png().toBuffer();

  // Overlay with caption on polaroid
  const captionY = PHOTO_Y + PHOTO_SIZE + 30;
  const overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- TREND stamp -->
      <g transform="translate(${PHOTO_X + 30}, ${PHOTO_Y + 30}) rotate(-8)">
        <rect x="0" y="0" width="160" height="44" rx="4" fill="rgba(231,76,60,0.92)" stroke="white" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="80" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">TRENDDE</text>
      </g>

      <!-- Caption text (handwritten feel) -->
      ${titleLines.slice(0,2).map((line, i) =>
        `<text x="${W/2}" y="${captionY + i*34}" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#2c3e50" text-anchor="middle">${esc(line)}</text>`
      ).join('')}

      ${fiyat ? `
      <text x="${W/2}" y="${captionY + 90}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#e74c3c" text-anchor="middle">${esc(fiyat)}</text>
      ` : ''}

      <text x="${W/2}" y="${captionY + 130}" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle">📍 ${esc(konum)}  •  gelgezgor.com</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: photoBuffer, top: PHOTO_Y, left: PHOTO_X },
      { input: Buffer.from(overlaySvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const filename = `ig_polaroid_${trend.ilanId}_${Date.now()}.png`;
  return saveImage(buffer, filename);
}

// ─── LAYOUT 5: MINIMAL — Clean card design ───────────────────────

export async function layoutMinimal(trend: Trend): Promise<string> {
  const imageBuffer = await loadTrendImage(trend);
  const titleLines = wrapText(trend.baslik || '', 22);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  // Top image section (60% height)
  const IMG_H = 600;

  // Image for top
  const topImageBuffer = imageBuffer
    ? await sharp(imageBuffer).resize(W, IMG_H, { fit: 'cover', position: 'center' }).png().toBuffer()
    : await sharp({ create: { width: W, height: IMG_H, channels: 4, background: { r: 150, g: 150, b: 150, alpha: 1 }}}).png().toBuffer();

  // Background + bottom text panel
  const bgSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Off-white bg -->
      <rect width="${W}" height="${H}" fill="#fafbfc"/>

      <!-- Bottom text area -->
      <rect x="0" y="${IMG_H}" width="${W}" height="${H-IMG_H}" fill="#fafbfc"/>

      <!-- Separator dash -->
      <line x1="${W/2-30}" y1="${IMG_H + 40}" x2="${W/2+30}" y2="${IMG_H + 40}" stroke="#e74c3c" stroke-width="3"/>

      <!-- Label -->
      <text x="${W/2}" y="${IMG_H + 85}" font-family="Arial, sans-serif" font-size="12" fill="#8b8fa3" text-anchor="middle" letter-spacing="6">BUGÜNÜN TRENDİ</text>

      <!-- Title -->
      ${titleLines.slice(0,2).map((line, i) =>
        `<text x="${W/2}" y="${IMG_H + 135 + i*38}" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#1a1d3a" text-anchor="middle">${esc(line)}</text>`
      ).join('')}

      <!-- Price + Location row -->
      ${fiyat ? `
      <text x="${W/2 - 180}" y="${IMG_H + 280}" font-family="Arial, sans-serif" font-size="10" fill="#8b8fa3" text-anchor="middle" letter-spacing="3">FİYAT</text>
      <text x="${W/2 - 180}" y="${IMG_H + 315}" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#e74c3c" text-anchor="middle">${esc(fiyat)}</text>
      ` : ''}

      <text x="${W/2 + 180}" y="${IMG_H + 280}" font-family="Arial, sans-serif" font-size="10" fill="#8b8fa3" text-anchor="middle" letter-spacing="3">KONUM</text>
      <text x="${W/2 + 180}" y="${IMG_H + 315}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1a1d3a" text-anchor="middle">${esc(konum)}</text>

      <!-- Vertical separator -->
      <line x1="${W/2}" y1="${IMG_H + 260}" x2="${W/2}" y2="${IMG_H + 325}" stroke="#e1e5ed" stroke-width="1"/>

      <!-- Bottom brand -->
      <text x="${W/2}" y="${H - 35}" font-family="Arial, sans-serif" font-size="12" fill="#8b8fa3" text-anchor="middle" letter-spacing="2">gelgezgor.com</text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(bgSvg))
    .composite([
      { input: topImageBuffer, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  const filename = `ig_minimal_${trend.ilanId}_${Date.now()}.png`;
  return saveImage(buffer, filename);
}

// ─── LAYOUT REGISTRY ───────────────────────────────

export const LAYOUTS = {
  classic: { name: 'Classic', description: 'Tam görsel + alt gradient', fn: layoutClassic },
  split: { name: 'Split', description: 'Sol görsel, sağ panel', fn: layoutSplit },
  magazine: { name: 'Magazine', description: 'Dergi kapağı tarzı', fn: layoutMagazine },
  polaroid: { name: 'Polaroid', description: 'Beyaz çerçeveli fotoğraf', fn: layoutPolaroid },
  minimal: { name: 'Minimal', description: 'Üst görsel, alt bilgi', fn: layoutMinimal },
} as const;

export type LayoutId = keyof typeof LAYOUTS;

export async function generateLayout(layoutId: LayoutId, trend: Trend): Promise<string> {
  const layout = LAYOUTS[layoutId];
  if (!layout) throw new Error(`Unknown layout: ${layoutId}`);
  return layout.fn(trend);
}

export async function generateAllLayouts(trend: Trend): Promise<Record<LayoutId, string>> {
  const results: Partial<Record<LayoutId, string>> = {};
  const ids = Object.keys(LAYOUTS) as LayoutId[];

  // Run in parallel for speed
  const paths = await Promise.all(ids.map(id => generateLayout(id, trend)));
  ids.forEach((id, i) => { results[id] = paths[i]; });

  return results as Record<LayoutId, string>;
}
