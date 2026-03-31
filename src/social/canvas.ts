import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Trend } from '../db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(response.data);
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

function createSvgText(
  lines: string[],
  fontSize: number,
  color: string,
  x: number,
  y: number,
  fontWeight = 'normal'
): string {
  return lines.map((line, i) =>
    `<text x="${x}" y="${y + i * (fontSize + 8)}" font-family="Ubuntu, Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapeXml(line)}</text>`
  ).join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function generateInstagramPost(trend: Trend): Promise<string> {
  const W = 1080, H = 1080;
  const titleLines = wrapText(trend.baslik, 30);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  // Download listing image
  let imageBuffer: Buffer | null = null;
  const images = trend.opiImages ? JSON.parse(trend.opiImages) : [];
  const imageUrl = images[0] || trend.imageUrl;
  if (imageUrl) {
    try {
      imageBuffer = await downloadImage(imageUrl);
    } catch (e) {
      console.log(`[Canvas] Görsel indirilemedi: ${imageUrl}`);
    }
  }

  // Create base image with gradient background
  const svgOverlay = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:transparent;stop-opacity:0" />
          <stop offset="50%" style="stop-color:#000;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#000;stop-opacity:0.85" />
        </linearGradient>
      </defs>

      ${!imageBuffer ? `<rect width="${W}" height="${H}" fill="url(#bg)" />` : ''}

      <!-- Dark overlay for text readability -->
      <rect width="${W}" height="${H}" fill="url(#overlay)" />

      <!-- TREND badge -->
      <rect x="40" y="40" width="180" height="50" rx="25" fill="#e74c3c" />
      <text x="130" y="72" font-family="Ubuntu, Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">🔥 TREND</text>

      <!-- GelGezGor branding -->
      <rect x="${W - 230}" y="40" width="190" height="50" rx="25" fill="rgba(63,71,95,0.9)" />
      <text x="${W - 135}" y="72" font-family="Ubuntu, Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">gelgezgor.com</text>

      <!-- Price -->
      ${fiyat ? `
      <rect x="40" y="${H - 280}" width="${Math.max(fiyat.length * 26, 200)}" height="60" rx="10" fill="rgba(231,76,60,0.95)" />
      <text x="60" y="${H - 238}" font-family="Ubuntu, Arial, sans-serif" font-size="36" font-weight="bold" fill="white">${escapeXml(fiyat)}</text>
      ` : ''}

      <!-- Title -->
      ${createSvgText(titleLines, 34, 'white', 40, H - 190, 'bold')}

      <!-- Location -->
      <text x="40" y="${H - 50}" font-family="Ubuntu, Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.8)">📍 ${escapeXml(konum)}</text>

      <!-- Bottom bar -->
      <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#e74c3c" />
    </svg>
  `;

  let composite: sharp.Sharp;

  if (imageBuffer) {
    // Use listing image as background
    composite = sharp(imageBuffer)
      .resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  } else {
    // Pure gradient background
    composite = sharp({
      create: { width: W, height: H, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } }
    })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  }

  const filename = `ig_${trend.ilanId}_${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  await composite.png({ quality: 95 }).toFile(outputPath);
  console.log(`[Canvas] Instagram post oluşturuldu: ${filename}`);
  return outputPath;
}

export async function generateFacebookPost(trend: Trend): Promise<string> {
  const W = 1200, H = 630;
  const titleLines = wrapText(trend.baslik, 40);
  const fiyat = trend.fiyat || '';
  const konum = trend.konum || 'KKTC';

  let imageBuffer: Buffer | null = null;
  const images = trend.opiImages ? JSON.parse(trend.opiImages) : [];
  const imageUrl = images[0] || trend.imageUrl;
  if (imageUrl) {
    try {
      imageBuffer = await downloadImage(imageUrl);
    } catch (e) {
      console.log(`[Canvas] Görsel indirilemedi: ${imageUrl}`);
    }
  }

  const svgOverlay = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#000;stop-opacity:0.8" />
          <stop offset="60%" style="stop-color:#000;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </linearGradient>
      </defs>

      <rect width="${W}" height="${H}" fill="url(#overlay)" />

      <!-- TREND badge -->
      <rect x="40" y="30" width="180" height="45" rx="22" fill="#e74c3c" />
      <text x="130" y="60" font-family="Ubuntu, Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">🔥 TREND</text>

      <!-- Title -->
      ${createSvgText(titleLines, 30, 'white', 40, 120, 'bold')}

      <!-- Price -->
      ${fiyat ? `
      <text x="40" y="${120 + titleLines.length * 38 + 30}" font-family="Ubuntu, Arial, sans-serif" font-size="34" font-weight="bold" fill="#e74c3c">${escapeXml(fiyat)}</text>
      ` : ''}

      <!-- Location -->
      <text x="40" y="${H - 60}" font-family="Ubuntu, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.8)">📍 ${escapeXml(konum)}</text>

      <!-- Branding -->
      <rect x="${W - 230}" y="${H - 60}" width="200" height="40" rx="20" fill="rgba(63,71,95,0.9)" />
      <text x="${W - 130}" y="${H - 33}" font-family="Ubuntu, Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">gelgezgor.com</text>

      <!-- Bottom accent -->
      <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#e74c3c" />
    </svg>
  `;

  let composite: sharp.Sharp;

  if (imageBuffer) {
    composite = sharp(imageBuffer)
      .resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  } else {
    composite = sharp({
      create: { width: W, height: H, channels: 4, background: { r: 15, g: 12, b: 41, alpha: 1 } }
    })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  }

  const filename = `fb_${trend.ilanId}_${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  await composite.png({ quality: 95 }).toFile(outputPath);
  console.log(`[Canvas] Facebook post oluşturuldu: ${filename}`);
  return outputPath;
}

export async function generatePanoramaGrid(trend: Trend): Promise<string[]> {
  // Create a 3-piece Instagram panorama (3240x1080 → 3x 1080x1080)
  const W = 3240, H = 1080;
  const PIECE_W = 1080;

  let imageBuffer: Buffer | null = null;
  const images = trend.opiImages ? JSON.parse(trend.opiImages) : [];
  const imageUrl = images[0] || trend.imageUrl;
  if (imageUrl) {
    try {
      imageBuffer = await downloadImage(imageUrl);
    } catch (e) {
      console.log(`[Canvas] Panorama görseli indirilemedi`);
    }
  }

  const fiyat = trend.fiyat || '';
  const titleLines = wrapText(trend.baslik, 50);
  const konum = trend.konum || 'KKTC';

  const svgOverlay = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="overlay" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#000;stop-opacity:0.7" />
          <stop offset="40%" style="stop-color:#000;stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        </linearGradient>
      </defs>

      <rect width="${W}" height="${H}" fill="url(#overlay)" />

      <!-- Left panel: TREND badge + branding -->
      <rect x="60" y="60" width="200" height="55" rx="27" fill="#e74c3c" />
      <text x="160" y="96" font-family="Ubuntu, Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">🔥 TREND</text>

      <!-- Center: Title spanning full width -->
      ${createSvgText(titleLines, 42, 'white', 60, H - 200, 'bold')}

      <!-- Price badge -->
      ${fiyat ? `
      <rect x="${W - 500}" y="${H - 120}" width="${Math.max(fiyat.length * 30, 250)}" height="60" rx="10" fill="rgba(231,76,60,0.95)" />
      <text x="${W - 480}" y="${H - 78}" font-family="Ubuntu, Arial, sans-serif" font-size="38" font-weight="bold" fill="white">${escapeXml(fiyat)}</text>
      ` : ''}

      <!-- Location -->
      <text x="60" y="${H - 40}" font-family="Ubuntu, Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.8)">📍 ${escapeXml(konum)}</text>

      <!-- Right branding -->
      <text x="${W - 250}" y="${H - 40}" font-family="Ubuntu, Arial, sans-serif" font-size="22" font-weight="bold" fill="rgba(255,255,255,0.7)">gelgezgor.com</text>
    </svg>
  `;

  let wideImage: sharp.Sharp;

  if (imageBuffer) {
    wideImage = sharp(imageBuffer)
      .resize(W, H, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  } else {
    wideImage = sharp({
      create: { width: W, height: H, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } }
    })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }]);
  }

  const wideBuffer = await wideImage.png().toBuffer();
  const pieces: string[] = [];

  // Split into 3 pieces
  for (let i = 0; i < 3; i++) {
    const filename = `panorama_${trend.ilanId}_${i + 1}_${Date.now()}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    await sharp(wideBuffer)
      .extract({ left: i * PIECE_W, top: 0, width: PIECE_W, height: H })
      .toFile(outputPath);

    pieces.push(outputPath);
  }

  console.log(`[Canvas] Panorama grid oluşturuldu: 3 parça (ilan: ${trend.ilanId})`);
  return pieces;
}
