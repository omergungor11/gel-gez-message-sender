# GelGezGor Trend Pipeline - Project Memory

## Project Info
- KKTC ilan platformu gelgezgor.com trend ilanları için WhatsApp bildirim botu ve sosyal medya içerik üretim pipeline'ı

## Project Status
- **Phase 0**: COMPLETED — Proje kurulumu, tüm altyapı hazır
- **Phase 1**: IN_PROGRESS — Core modüller (scraper selektör fix gerekli)
- **Phase 2**: IN_PROGRESS — Panel ve polish

## Key Technical Decisions
- **Cheerio vs Puppeteer**: Cheerio seçildi — site statik HTML döndürüyor, headless browser gereksiz
- **Sharp vs node-canvas**: Sharp seçildi — SVG overlay + image composite, daha performanslı
- **SQLite vs PostgreSQL**: SQLite seçildi — tek makine deployment, kurulum gereksiz
- **Gemini + Imagen 3**: Google AI hibrit yaklaşım — caption üretimi Gemini, görsel Imagen 3, fallback template var
- **Twilio WhatsApp**: Resmi Business API — güvenilir, ban riski yok

## Important Patterns
- Site HTML yapısı: `div.bilesen.ilan_listeleme > div.baslik.alternatif > h3` (heading) + `div.row > div.liste.alternatif` (kartlar)
- Fiyat: `div.fiyat_layer.visible-md.visible-lg` içinde
- Konum: `div.il_ilce` içinde (ör: "Girne / Çatalköy")
- İlan URL pattern: `gelgezgor.com/[slug]-[ID]` (ör: villa-24117)
- Detay sayfada telefon: `a[href^="tel:"]`, WhatsApp: `a[href*="wa.me"]`

## Known Issues / Gotchas
- Scraper ilk versiyonda 0 sonuç döndü — selektörler yanlıştı, `div.liste.alternatif` kullanılmalı
- İlan görselleri 160x120 thumbnail — detay sayfada büyük versiyon var
- KKTC telefon numaraları: 0548, 0533, 0542 prefiksleri — +90 ülke kodu ile
