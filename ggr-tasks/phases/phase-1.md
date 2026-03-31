# Phase 1: Core Modules

## TASK-008: Trend Scraper (Ana Sayfa)

**Agent**: backend
**Complexity**: M
**Status**: IN_PROGRESS
**Dependencies**: TASK-006

### Açıklama
gelgezgor.com ana sayfasından "Bugünün Trend İlanları" bölümünü Cheerio ile parse et.

### HTML Yapısı (Keşfedilen)
```
div.bilesen.ilan_listeleme
  → div.baslik.alternatif > h3 ("Bugünün Trend İlanları")
  → div.row > div.col-md-7 > div.liste.alternatif
    → a.r_ust > img.img-responsive + div.fiyat_layer
    → h3 > a (başlık + URL)
    → div.il_ilce (konum)
```

### Acceptance Criteria
- [x] Cheerio ile HTML parse
- [ ] Doğru CSS selektörlerle trend kartları çek
- [ ] Fiyat: div.fiyat_layer
- [ ] Konum: div.il_ilce
- [ ] URL: a[href] slug-ID pattern
- [ ] Test: en az 5+ ilan dönmeli

---

## TASK-009: Detail Scraper

**Agent**: backend
**Complexity**: M
**Status**: COMPLETED

### Acceptance Criteria
- [x] Telefon: a[href^="tel:"]
- [x] WhatsApp: a[href*="wa.me"]
- [x] İlan sahibi adı
- [x] Mağaza bilgisi
- [x] İlan görselleri

---

## TASK-013: Sharp Canvas Görsel Üretici

**Agent**: backend
**Complexity**: L
**Status**: COMPLETED

### Acceptance Criteria
- [x] Instagram 1080x1080 template (gradient BG, TREND badge, price, title, location)
- [x] Facebook 1200x630 template (landscape, overlay)
- [x] Panorama 3240x1080 → 3x 1080x1080 grid split
- [x] SVG overlay + sharp composite
- [x] İlan görseli indirme ve background olarak kullanma

---

## TASK-014: Gemini AI + Imagen 3

**Agent**: backend
**Complexity**: L
**Status**: COMPLETED

### Acceptance Criteria
- [x] Vertex AI Gemini caption generation
- [x] Imagen 3 prompt generation via Gemini
- [x] Imagen 3 image generation via Vertex AI
- [x] Fallback to template captions when API unavailable
