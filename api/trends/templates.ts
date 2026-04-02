import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllTemplateIds, TEMPLATES } from '../../src/social/templates/theme-system.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const templates = getAllTemplateIds().map(id => {
    const t = TEMPLATES[id];
    return { id: t.id, name: t.name, variant: t.variant, accent: t.accent, bgPrimary: t.bgPrimary };
  });
  return res.json({ templates });
}
