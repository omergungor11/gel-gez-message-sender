import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// ─── Supabase Client ──────────────────────────────

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY not configured');
    }
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }
  return supabase;
}

// ─── DB Helpers (REST API via Supabase JS) ────────

export const db = {
  // ── Trends ──────────────────────────────────────
  async getTrendsByDate(date: string) {
    const { data, error } = await getSupabase()
      .from('trends').select('*').eq('tarih', date).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getTrendById(id: number) {
    const { data, error } = await getSupabase()
      .from('trends').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getTrendByIlanIdAndDate(ilanId: string, date: string) {
    const { data } = await getSupabase()
      .from('trends').select('id').eq('ilan_id', ilanId).eq('tarih', date).maybeSingle();
    return data;
  },

  async insertTrend(trend: Record<string, any>) {
    const { data, error } = await getSupabase()
      .from('trends').insert(trend).select().single();
    if (error) throw error;
    return data;
  },

  async updateTrend(id: number, fields: Record<string, any>) {
    const { error } = await getSupabase()
      .from('trends').update(fields).eq('id', id);
    if (error) throw error;
  },

  // ── Social Posts ────────────────────────────────
  async getSocialPostsByDate(date: string) {
    const { data, error } = await getSupabase()
      .from('social_posts').select('*').eq('tarih', date).order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSocialPostById(id: number) {
    const { data, error } = await getSupabase()
      .from('social_posts').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getSocialPostsByTrendId(trendId: number) {
    const { data, error } = await getSupabase()
      .from('social_posts').select('*').eq('trend_id', trendId);
    if (error) throw error;
    return data || [];
  },

  async insertSocialPost(post: Record<string, any>) {
    const { data, error } = await getSupabase()
      .from('social_posts').insert(post).select().single();
    if (error) throw error;
    return data;
  },

  async updateSocialPost(id: number, fields: Record<string, any>) {
    const { error } = await getSupabase()
      .from('social_posts').update(fields).eq('id', id);
    if (error) throw error;
  },

  // ── Pipeline Logs ──────────────────────────────
  async insertLog(log: { action: string; status: string; message: string; details?: string }) {
    await getSupabase()
      .from('pipeline_logs').insert({ ...log, created_at: new Date().toISOString() });
  },

  async getLogs(limit = 50) {
    const { data, error } = await getSupabase()
      .from('pipeline_logs').select('*').order('id', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },

  // ── Stats ──────────────────────────────────────
  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    const sb = getSupabase();

    const [todayTrends, totalTrends, waSent, totalSocial, todaySocial, logs] = await Promise.all([
      sb.from('trends').select('id', { count: 'exact', head: true }).eq('tarih', today),
      sb.from('trends').select('id', { count: 'exact', head: true }),
      sb.from('trends').select('id', { count: 'exact', head: true }).eq('whatsapp_durumu', 'gonderildi'),
      sb.from('social_posts').select('id', { count: 'exact', head: true }),
      sb.from('social_posts').select('id', { count: 'exact', head: true }).eq('tarih', today),
      sb.from('pipeline_logs').select('*').order('id', { ascending: false }).limit(5),
    ]);

    return {
      today,
      trends: { today: todayTrends.count || 0, total: totalTrends.count || 0 },
      whatsapp: { sent: waSent.count || 0 },
      social: { today: todaySocial.count || 0, total: totalSocial.count || 0 },
      recentLogs: logs.data || [],
    };
  },
};

// ─── Storage helpers ──────────────────────────────

const BUCKET = 'social-posts';

export async function uploadImage(buffer: Buffer, filename: string): Promise<string> {
  const sb = getSupabase();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function getPublicImageUrl(filename: string): Promise<string> {
  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
