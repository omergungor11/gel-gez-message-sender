import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Step 1: Basic check
  const checks: Record<string, string> = { status: 'ok' };

  // Step 2: Env vars check
  checks.supabase_url = process.env.SUPABASE_URL ? 'set' : 'missing';
  checks.supabase_key = process.env.SUPABASE_ANON_KEY ? 'set' : 'missing';
  checks.node_version = process.version;
  checks.vercel = process.env.VERCEL ? 'true' : 'false';

  // Step 3: Supabase connection check
  try {
    const { db } = await import('../src/db/supabase.js');
    const stats = await db.getStats();
    checks.db = 'connected';
    checks.trends_today = String(stats.trends.today);
  } catch (error: any) {
    checks.db = `error: ${error.message}`;
  }

  return res.json(checks);
}
