import Twilio from 'twilio';
import { config } from '../config/index.js';

let client: Twilio.Twilio | null = null;

export function getWhatsAppClient(): Twilio.Twilio {
  if (!client) {
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    }
    client = Twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export function formatWhatsAppNumber(phone: string): string {
  // Normalize phone number for WhatsApp
  let num = phone.replace(/[\s\-()]/g, '');

  // Remove leading + if present
  if (num.startsWith('+')) num = num.substring(1);

  // Handle Turkish numbers
  if (num.startsWith('0') && num.length === 11) {
    num = '90' + num.substring(1);
  }

  // Handle KKTC numbers (0548, 0533, etc.)
  if (num.startsWith('90548') || num.startsWith('90533') || num.startsWith('90542') || num.startsWith('90539')) {
    // Already in correct format
  } else if (num.length === 10 && !num.startsWith('90')) {
    num = '90' + num;
  }

  return `whatsapp:+${num}`;
}
