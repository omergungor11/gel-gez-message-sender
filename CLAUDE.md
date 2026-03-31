# GelGezGor Trend Pipeline

## Proje

KKTC'nin en büyük ilan platformu gelgezgor.com'daki trend ilanlar için otomatik WhatsApp bildirim botu ve sosyal medya içerik üretim paneli. Scrape → DB → WhatsApp → Görsel pipeline'ı.

## Slash Commandlar

| Command | Ne yapar |
|---------|----------|
| `/cold-start` | Session başlangıcı — projeyi oku, durumu raporla |
| `/git-full` | Stage, commit, push — task durumlarını güncelle |
| `/local-testing` | Tüm servisleri ayağa kaldır ve doğrula |
| `/turn-off` | Session notu yaz, taskları işaretle, push, kapat |

---

## Mevcut Durum

**Progress**: 15/22 task (%68) — Phase 2 devam ediyor.

> Her yeni session'da `ggr-tasks/task-index.md` oku veya `/cold-start` çalıştır.

---

## Workspace

```
src/
├── config/          → Merkezi konfigürasyon (dotenv + zod)
├── scraper/         → Cheerio ile web scraping (trend + detay)
├── whatsapp/        → Twilio WhatsApp Business API
├── social/          → Gemini AI caption + Sharp görsel üretimi
│   └── templates/   → Instagram (1080x1080) + Facebook (1200x630)
├── pipeline/        → Orchestrator (scrape→notify→generate)
├── panel/           → Express API + Vanilla JS dashboard
│   ├── routes/      → trends, social, pipeline API endpoints
│   └── frontend/    → Single-page dashboard (index.html)
├── db/              → SQLite + Drizzle ORM
└── cron/            → node-cron zamanlayıcı
```

## Temel Komutlar

```bash
npm run dev              # Panel sunucusu (Express, port 3000)
npm run scrape           # Trend ilanları scrape et
npm run pipeline         # Tam pipeline çalıştır
npm run pipeline:dry     # Pipeline (dry-run, mesaj göndermez)
npm run cron             # Zamanlayıcı başlat (09:00, 15:00)
npm run generate:social  # Sosyal medya içerik üret
```

---

## Code Conventions (Kısa)

- **TypeScript**: strict, `any` yasak, ESM modüller
- **Dosya**: `kebab-case`, `.ts` uzantısı
- **API**: RESTful, `/api/{resource}`, response `{ data }`, error `{ error }`
- **Commit**: `feat(TASK-XXX): açıklama` + `Co-Authored-By: Claude <noreply@anthropic.com>`
- **Import**: `.js` uzantılı (ESM uyumluluğu)

Detaylar → `ggr-config/conventions.md`

## Parallel Agent Orchestration

Birden fazla sub-agent paralel çalıştırılırken:
- Her agent sadece kendi modül dizininde dosya düzenler (dizin izolasyonu)
- Paket kurulumu sadece ana agent (orchestrator) tarafından yapılır
- Paylaşılan dosyalarda retry pattern uygulanır
- Bağımlı task'lar sıralı, bağımsız olanlar paralel çalıştırılır

Detaylar → `ggr-config/agent-instructions.md`

---

## Referans Dizinleri

| Dizin | İçerik |
|-------|--------|
| `ggr-tasks/` | Task takip — dashboard + tüm task'lar |
| `ggr-tasks/task-index.md` | Master task listesi |
| `ggr-tasks/phases/` | Phase bazlı detaylı task açıklamaları |
| `ggr-tasks/active/session-notes.md` | Session notları |
| `ggr-config/workflow.md` | Task workflow kuralları |
| `ggr-config/conventions.md` | Kod standartları |
| `ggr-config/tech-stack.md` | Teknolojiler + versiyonlar |
| `ggr-config/agent-instructions.md` | Sub-agent sorumlulukları |
| `ggr-docs/MEMORY.md` | Kalıcı hafıza |
| `ggr-docs/CHANGELOG.md` | Değişiklik kaydı |
| `ggr-plans/` | Uygulama planları |

---

## Hooks (Otomatik Kurallar)

| Hook | Tetikleyici | Ne yapar |
|------|------------|----------|
| `protect-files.sh` | PreToolUse (Edit/Write) | .env, lock files, .git/ düzenlemeyi bloklar |

---

## Notlar

- Hafıza dosyası `ggr-docs/MEMORY.md`'de — her session'da oku, gerektiğinde güncelle
- Site yapısı: `div.bilesen.ilan_listeleme > div.baslik.alternatif (h3) + div.row > div.liste.alternatif`
- İlan detay: telefon `a[href^="tel:"]`, WhatsApp `a[href*="wa.me"]`, konum `div.il_ilce`
