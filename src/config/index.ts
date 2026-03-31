import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_WHATSAPP_NUMBER: z.string().default('whatsapp:+14155238886'),

  // Google Cloud
  GOOGLE_PROJECT_ID: z.string().default(''),
  GOOGLE_LOCATION: z.string().default('us-central1'),

  // Site
  BASE_URL: z.string().default('https://www.gelgezgor.com'),

  // Pipeline
  CRON_SCHEDULE: z.string().default('0 9,15 * * *'),
  DRY_RUN: z.string().default('true'),

  // Panel
  PORT: z.string().default('3000'),
});

export const config = envSchema.parse(process.env);

export const isDryRun = config.DRY_RUN === 'true';
