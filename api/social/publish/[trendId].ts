import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const trendId = parseInt(req.query.trendId as string);

  try {
    const { publishTrendToSocial } = await import('../../../src/social/publisher/index.js');
    const results = await publishTrendToSocial(trendId);
    return res.json({ success: results.every(r => r.success), results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
