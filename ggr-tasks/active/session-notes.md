# Session Notes

## 2026-03-31 — Session 1

### Completed
- [x] TASK-001: Proje altyapısı (package.json, tsconfig, deps)
- [x] TASK-002: Meta dizinler oluşturuldu
- [x] TASK-005: Config modülü (dotenv + zod)
- [x] TASK-006: SQLite DB + Drizzle ORM
- [x] TASK-009: Detail scraper
- [x] TASK-010: WhatsApp client
- [x] TASK-011: WhatsApp sender
- [x] TASK-012: Caption templates
- [x] TASK-013: Sharp canvas görsel üretici
- [x] TASK-014: Gemini + Imagen 3 entegrasyonu
- [x] TASK-015: Social content generator
- [x] TASK-016: Pipeline orchestrator
- [x] TASK-017: Cron zamanlayıcı
- [x] TASK-018: Express API routes
- [x] TASK-019: Frontend dashboard

### In Progress
- [ ] TASK-008: Trend scraper — CSS selektörleri yanlış, 0 sonuç dönüyor. Debug ile doğru yapı keşfedildi: `div.liste.alternatif`, `div.fiyat_layer`, `div.il_ilce`
- [ ] TASK-020: Blueprint template yapısı uygulanıyor
- [ ] TASK-021: Scraper selektör düzeltmesi

### Next Session
- [ ] Scraper selektörlerini düzelt ve test et
- [ ] End-to-end pipeline testi (TASK-022)
- [ ] Git init + ilk commit

### Notes
- Site HTML yapısı: `div.bilesen.ilan_listeleme > div.row > div.col-md-7 > div.liste.alternatif`
- Fiyat `div.fiyat_layer.visible-md.visible-lg` içinde
- Konum `div.il_ilce` içinde
- İlan URL: `slug-ID` pattern (ör: `villa-24117`)
