/**
 * GelGezGor Template System
 * 3 templates × 2 variants (dark/light) = 6 visual styles
 *
 * Templates:
 *   1. Modern   — Clean lines, gradient accent bar, minimal
 *   2. Elegant  — Serif-inspired, gold accents, premium feel
 *   3. Bold     — High contrast, large type, street-style
 *
 * Each has dark + light variant.
 * Pipeline auto-selects based on rotation + category matching.
 */

export type TemplateName = 'modern' | 'elegant' | 'bold';
export type TemplateVariant = 'dark' | 'light';

export interface TemplateTheme {
  name: TemplateName;
  variant: TemplateVariant;
  id: string; // e.g. "modern-dark"

  // Colors
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  badge: string;
  badgeText: string;
  overlay: string; // gradient overlay on image

  // Typography
  titleFont: string;
  titleSize: number;
  priceFont: string;
  priceSize: number;
  locationFont: string;
  locationSize: number;
  brandFont: string;

  // Layout
  badgeStyle: 'pill' | 'square' | 'ribbon';
  priceStyle: 'badge' | 'inline' | 'tag';
  bottomBar: boolean;
  bottomBarHeight: number;
  borderRadius: number;
}

// ─── MODERN ────────────────────────────────────────

const modernDark: TemplateTheme = {
  name: 'modern',
  variant: 'dark',
  id: 'modern-dark',
  bgPrimary: '#1a1a2e',
  bgSecondary: '#16213e',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  accent: '#e74c3c',
  accentText: '#ffffff',
  badge: '#e74c3c',
  badgeText: '#ffffff',
  overlay: 'rgba(0,0,0,0.55)',
  titleFont: 'Ubuntu, Arial, sans-serif',
  titleSize: 36,
  priceFont: 'Ubuntu, Arial, sans-serif',
  priceSize: 40,
  locationFont: 'Ubuntu, Arial, sans-serif',
  locationSize: 22,
  brandFont: 'Ubuntu, Arial, sans-serif',
  badgeStyle: 'pill',
  priceStyle: 'badge',
  bottomBar: true,
  bottomBarHeight: 8,
  borderRadius: 25,
};

const modernLight: TemplateTheme = {
  ...modernDark,
  variant: 'light',
  id: 'modern-light',
  bgPrimary: '#f5f7fa',
  bgSecondary: '#e8ecf1',
  textPrimary: '#1a1a2e',
  textSecondary: 'rgba(26,26,46,0.6)',
  overlay: 'rgba(255,255,255,0.55)',
  accent: '#2c3e50',
  badge: '#e74c3c',
};

// ─── ELEGANT ───────────────────────────────────────

const elegantDark: TemplateTheme = {
  name: 'elegant',
  variant: 'dark',
  id: 'elegant-dark',
  bgPrimary: '#0d0d0d',
  bgSecondary: '#1a1a1a',
  textPrimary: '#f4f0e8',
  textSecondary: 'rgba(244,240,232,0.6)',
  accent: '#c9a84c',
  accentText: '#0d0d0d',
  badge: '#c9a84c',
  badgeText: '#0d0d0d',
  overlay: 'rgba(0,0,0,0.6)',
  titleFont: 'Georgia, Times New Roman, serif',
  titleSize: 34,
  priceFont: 'Ubuntu, Arial, sans-serif',
  priceSize: 38,
  locationFont: 'Georgia, Times New Roman, serif',
  locationSize: 20,
  brandFont: 'Georgia, Times New Roman, serif',
  badgeStyle: 'square',
  priceStyle: 'inline',
  bottomBar: true,
  bottomBarHeight: 4,
  borderRadius: 4,
};

const elegantLight: TemplateTheme = {
  ...elegantDark,
  variant: 'light',
  id: 'elegant-light',
  bgPrimary: '#faf8f5',
  bgSecondary: '#f0ebe3',
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(26,26,26,0.5)',
  accent: '#8b6914',
  accentText: '#ffffff',
  badge: '#8b6914',
  badgeText: '#ffffff',
  overlay: 'rgba(255,255,255,0.5)',
};

// ─── BOLD ──────────────────────────────────────────

const boldDark: TemplateTheme = {
  name: 'bold',
  variant: 'dark',
  id: 'bold-dark',
  bgPrimary: '#000000',
  bgSecondary: '#111111',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.8)',
  accent: '#ff3b30',
  accentText: '#ffffff',
  badge: '#ff3b30',
  badgeText: '#ffffff',
  overlay: 'rgba(0,0,0,0.65)',
  titleFont: 'Ubuntu, Arial, sans-serif',
  titleSize: 42,
  priceFont: 'Ubuntu, Arial, sans-serif',
  priceSize: 48,
  locationFont: 'Ubuntu, Arial, sans-serif',
  locationSize: 24,
  brandFont: 'Ubuntu, Arial, sans-serif',
  badgeStyle: 'ribbon',
  priceStyle: 'tag',
  bottomBar: false,
  bottomBarHeight: 0,
  borderRadius: 0,
};

const boldLight: TemplateTheme = {
  ...boldDark,
  variant: 'light',
  id: 'bold-light',
  bgPrimary: '#ffffff',
  bgSecondary: '#f0f0f0',
  textPrimary: '#000000',
  textSecondary: 'rgba(0,0,0,0.7)',
  accent: '#ff3b30',
  overlay: 'rgba(255,255,255,0.6)',
};

// ─── REGISTRY ──────────────────────────────────────

export const TEMPLATES: Record<string, TemplateTheme> = {
  'modern-dark': modernDark,
  'modern-light': modernLight,
  'elegant-dark': elegantDark,
  'elegant-light': elegantLight,
  'bold-dark': boldDark,
  'bold-light': boldLight,
};

export const TEMPLATE_NAMES: TemplateName[] = ['modern', 'elegant', 'bold'];
export const TEMPLATE_VARIANTS: TemplateVariant[] = ['dark', 'light'];

export function getTemplate(name: TemplateName, variant: TemplateVariant): TemplateTheme {
  return TEMPLATES[`${name}-${variant}`];
}

export function getTemplateById(id: string): TemplateTheme | undefined {
  return TEMPLATES[id];
}

export function getAllTemplateIds(): string[] {
  return Object.keys(TEMPLATES);
}

// ─── AUTONOMOUS SELECTION ──────────────────────────

let rotationIndex = 0;

/**
 * Auto-select template based on:
 * 1. Category matching (emlak → elegant, araç → bold, other → modern)
 * 2. Variant rotation (alternates dark/light)
 * 3. Global rotation counter for variety
 */
export function autoSelectTemplate(title: string): TemplateTheme {
  const isEmlak = /villa|daire|ev|arsa|residence|penthouse|satılık|kiralık|stüdyo|dubleks/i.test(title);
  const isArac = /araba|araç|mercedes|bmw|audi|toyota|honda|volkswagen|land rover|range|model/i.test(title);

  let name: TemplateName;
  if (isEmlak) {
    // Emlak: alternate between elegant and modern
    name = rotationIndex % 3 === 0 ? 'elegant' : rotationIndex % 3 === 1 ? 'modern' : 'bold';
  } else if (isArac) {
    // Araç: bold primary, others secondary
    name = rotationIndex % 3 === 0 ? 'bold' : rotationIndex % 3 === 1 ? 'modern' : 'elegant';
  } else {
    // Other: rotate all
    name = TEMPLATE_NAMES[rotationIndex % 3];
  }

  // Alternate dark/light
  const variant: TemplateVariant = rotationIndex % 2 === 0 ? 'dark' : 'light';

  rotationIndex++;
  return getTemplate(name, variant);
}

/**
 * Reset rotation counter (e.g., at start of pipeline run)
 */
export function resetTemplateRotation(): void {
  rotationIndex = 0;
}
