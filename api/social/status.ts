import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isMetaConfigured, isFacebookConfigured } from '../../src/social/publisher/meta-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.json({ instagram: isMetaConfigured(), facebook: isFacebookConfigured() });
}
