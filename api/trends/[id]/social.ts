import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../src/db/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const id = parseInt(req.query.id as string);

  try {
    const trend = await db.getTrendById(id);
    if (!trend) return res.status(404).json({ error: 'Not found' });
    const { generateSocialContent } = await import('../../../src/social/generator.js');
    const templateId = req.body?.templateId;
    const content = await generateSocialContent(trend, templateId ? { templateId } : undefined);
    return res.json({ success: true, content });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
