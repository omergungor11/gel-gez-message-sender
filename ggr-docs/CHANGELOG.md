# Changelog

## 2026-03-31

### Added
- TASK-001: Proje altyapısı (package.json, tsconfig, .env.example)
- TASK-005: Merkezi config modülü (dotenv + zod validation)
- TASK-006: SQLite DB schema (trends, social_posts, pipeline_logs) + Drizzle ORM
- TASK-008: Trend scraper (Cheerio ile ana sayfa parsing) — selektör fix gerekli
- TASK-009: Detail scraper (ilan detay sayfası — telefon, WA, görseller)
- TASK-010: WhatsApp client (Twilio SDK + KKTC numara formatlama)
- TASK-011: WhatsApp sender (rate limiting, retry, mükerrer önleme)
- TASK-012: Instagram/Facebook caption templates (kategori bazlı, hashtag setleri)
- TASK-013: Sharp canvas görsel üretici (IG 1080x1080, FB 1200x630, Panorama 3x)
- TASK-014: Gemini AI caption + Imagen 3 görsel üretimi (Vertex AI)
- TASK-015: Social content generator orchestrator
- TASK-016: Pipeline orchestrator (scrape→enrich→WA→social akışı)
- TASK-017: node-cron zamanlayıcı (09:00, 15:00 İstanbul saati)
- TASK-018: Express API routes (trends, social, pipeline)
- TASK-019: Frontend dashboard (dark theme, istatistik kartları, tablo, grid)
- TASK-020: Blueprint template yapısı (CLAUDE.md, tasks, config, docs, commands, hooks)
