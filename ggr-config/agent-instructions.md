# Agent Instructions

## Sub-Agent Types

### Backend Agent (Scraper)
- **Scope**: `src/scraper/` — web scraping modülleri
- **Validation**: `npx tsx src/scraper/trendScraper.ts`
- **Commit Prefix**: `feat(scraper)`, `fix(scraper)`

### Backend Agent (WhatsApp)
- **Scope**: `src/whatsapp/` — Twilio entegrasyonu
- **Validation**: DRY_RUN=true ile test
- **Commit Prefix**: `feat(whatsapp)`, `fix(whatsapp)`

### Backend Agent (Social)
- **Scope**: `src/social/` — görsel ve caption üretimi
- **Validation**: `npx tsx src/social/generator.ts`
- **Commit Prefix**: `feat(social)`, `fix(social)`

### Backend Agent (Pipeline)
- **Scope**: `src/pipeline/`, `src/cron/`
- **Validation**: `DRY_RUN=true npx tsx src/pipeline/index.ts`
- **Commit Prefix**: `feat(pipeline)`, `fix(pipeline)`

### Frontend Agent (Panel)
- **Scope**: `src/panel/` — Express API + dashboard
- **Validation**: `npm run dev` + browser check
- **Commit Prefix**: `feat(panel)`, `fix(panel)`

### Docs Agent
- **Scope**: `ggr-tasks/`, `ggr-docs/`, `ggr-config/`, `CLAUDE.md`
- **Commit Prefix**: `docs(*)`

## Agent Rules
1. Task detaylarını oku, sonra başla
2. Kendi scope'un dışındaki dosyalara dokunma
3. Her değişiklikten sonra validation çalıştır
4. Task tracking güncelle
5. Commit'ler atomik ve açıklayıcı olsun

## Directory Isolation

| Agent Task | Allowed Directory | Forbidden |
|------------|-------------------|-----------|
| Scraper | `src/scraper/` | Other `src/*/` |
| WhatsApp | `src/whatsapp/` | Other `src/*/` |
| Social | `src/social/` | Other `src/*/` |
| Pipeline | `src/pipeline/`, `src/cron/` | Other `src/*/` |
| Panel | `src/panel/` | Other `src/*/` |
