# Phase 2: Panel & Polish

## TASK-016: Pipeline Orchestrator

**Agent**: backend
**Complexity**: M
**Status**: COMPLETED

### Acceptance Criteria
- [x] Scrape → Save DB → Enrich → WhatsApp → Social Content akışı
- [x] Dry-run modu
- [x] Pipeline logging to DB
- [x] Duration tracking

---

## TASK-018: Express API Routes

**Agent**: backend
**Complexity**: M
**Status**: IN_PROGRESS

### Acceptance Criteria
- [x] GET /api/trends - günün trend ilanları
- [x] GET /api/trends/:id - ilan detayı
- [x] POST /api/trends/:id/enrich - detay çek
- [x] POST /api/trends/:id/whatsapp - WA gönder
- [x] POST /api/trends/:id/social - görsel üret
- [x] GET /api/social/posts - sosyal medya içerikleri
- [x] POST /api/pipeline/run - pipeline tetikle
- [x] GET /api/pipeline/stats - istatistikler

---

## TASK-019: Frontend Dashboard

**Agent**: frontend
**Complexity**: L
**Status**: IN_PROGRESS

### Acceptance Criteria
- [x] İstatistik kartları (trend, WA, sosyal, toplam)
- [x] Trend ilanları tablosu (thumbnail, başlık, fiyat, konum, WA durumu)
- [x] Sosyal medya grid (görsel önizleme, caption, indirme)
- [x] Pipeline logları
- [x] Tarih filtresi
- [x] Manuel pipeline tetikleme butonu

---

## TASK-021: Scraper Selektör Düzeltmesi

**Agent**: backend
**Complexity**: M
**Status**: IN_PROGRESS

### Açıklama
Debug sonuçlarına göre CSS selektörlerini düzelt:
- `div.liste.alternatif` kartlarından veri çek
- `div.fiyat_layer` fiyat
- `div.il_ilce` konum
- `h3 > a` başlık + URL

---

## TASK-022: End-to-End Pipeline Testi

**Agent**: devops
**Complexity**: M
**Status**: PENDING
**Dependencies**: TASK-021

### Acceptance Criteria
- [ ] Scraper test: trend ilanları çekilmeli
- [ ] Detail test: telefon numaraları alınmalı
- [ ] Görsel test: output/ dizinine PNG dosyaları oluşmalı
- [ ] Pipeline dry-run: tam akış logları
- [ ] Panel test: localhost:3000 dashboard açılmalı
