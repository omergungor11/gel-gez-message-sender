/**
 * Meta WhatsApp Cloud API Client
 * Free tier: 1000 conversations/month
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import axios from 'axios';
import { config } from '../config/index.js';

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function isMetaWAConfigured(): boolean {
  return !!(config.META_WA_PHONE_NUMBER_ID && config.META_WA_ACCESS_TOKEN);
}

export interface MetaWAResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalize phone to E.164 format without + or whatsapp: prefix
 * Meta expects: "905338205149" (no plus sign)
 */
export function normalizeWAPhone(phone: string): string {
  let num = phone.replace(/[\s\-()+]/g, '').replace(/^whatsapp:/, '');
  if (num.startsWith('0') && num.length === 11) num = '90' + num.substring(1);
  if (num.length === 10 && !num.startsWith('90')) num = '90' + num;
  return num;
}

/**
 * Send a plain text message
 * Note: Plain text only works within 24h window of user's last incoming message.
 * For first-contact, use sendMetaWATemplate() with approved template.
 */
export async function sendMetaWAText(to: string, text: string): Promise<MetaWAResult> {
  if (!isMetaWAConfigured()) {
    return { success: false, error: 'Meta WhatsApp not configured' };
  }

  const normalized = normalizeWAPhone(to);
  const url = `${GRAPH_BASE}/${config.META_WA_PHONE_NUMBER_ID}/messages`;

  try {
    const { data } = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalized,
        type: 'text',
        text: { body: text, preview_url: true },
      },
      {
        headers: {
          Authorization: `Bearer ${config.META_WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    const messageId = data.messages?.[0]?.id;
    console.log(`[MetaWA] Sent -> ${normalized} (id: ${messageId})`);
    return { success: true, messageId };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    const code = error.response?.data?.error?.code;
    console.error(`[MetaWA] Error (${code}): ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Send an approved template message (works for first-contact / outside 24h window)
 * Template must be pre-approved in Meta Business Manager.
 */
export async function sendMetaWATemplate(
  to: string,
  templateName: string,
  languageCode: string = 'tr',
  parameters: string[] = [],
): Promise<MetaWAResult> {
  if (!isMetaWAConfigured()) {
    return { success: false, error: 'Meta WhatsApp not configured' };
  }

  const normalized = normalizeWAPhone(to);
  const url = `${GRAPH_BASE}/${config.META_WA_PHONE_NUMBER_ID}/messages`;

  const components = parameters.length > 0
    ? [{ type: 'body', parameters: parameters.map(p => ({ type: 'text', text: p })) }]
    : [];

  try {
    const { data } = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: normalized,
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components },
      },
      {
        headers: {
          Authorization: `Bearer ${config.META_WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    const messageId = data.messages?.[0]?.id;
    console.log(`[MetaWA] Template sent -> ${normalized} (template: ${templateName})`);
    return { success: true, messageId };
  } catch (error: any) {
    const msg = error.response?.data?.error?.message || error.message;
    const code = error.response?.data?.error?.code;
    console.error(`[MetaWA] Template error (${code}): ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Get phone number metadata (display number, verified name, quality rating)
 */
export async function getMetaWAStatus(): Promise<any> {
  if (!isMetaWAConfigured()) return { configured: false };

  try {
    const { data } = await axios.get(
      `${GRAPH_BASE}/${config.META_WA_PHONE_NUMBER_ID}`,
      {
        headers: { Authorization: `Bearer ${config.META_WA_ACCESS_TOKEN}` },
        params: { fields: 'display_phone_number,verified_name,quality_rating' },
      },
    );
    return { configured: true, ...data };
  } catch (error: any) {
    return { configured: true, error: error.response?.data?.error?.message || error.message };
  }
}
