import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../src/db/supabase.js';

/**
 * Proxy images from Supabase Storage
 * GET /api/image?file=ig_1234_modern-dark_timestamp.png
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const filename = req.query.file as string;
  if (!filename) return res.status(400).json({ error: 'file parameter required' });

  try {
    const sb = getSupabase();
    const { data } = sb.storage.from('social-posts').getPublicUrl(filename);
    return res.redirect(302, data.publicUrl);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
