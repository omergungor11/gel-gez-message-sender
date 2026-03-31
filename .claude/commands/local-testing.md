Local dev ortamini ayaga kaldir ve tum servisleri dogrula:

0. **Port temizligi** (ONCELIKLI):
   - `lsof -i :3000` ile port kontrol et
   - Eski process varsa temizle

1. **Veritabani**:
   - `data/pipeline.db` dosyasi var mi?
   - Tablolar dogru olusturulmus mu? (`npx tsx -e "import './src/db/index.js'"`)

2. **Scraper testi**:
   - `npx tsx src/scraper/trendScraper.ts` calistir
   - En az 1+ trend ilan donmeli
   - Donmezse hata mesajini bildir

3. **Detail scraper testi**:
   - `npx tsx src/scraper/detailScraper.ts` calistir
   - Telefon numarasi cekilmeli

4. **Pipeline dry-run**:
   - `DRY_RUN=true npx tsx src/pipeline/index.ts` calistir
   - Tam akis loglarini goster

5. **Panel sunucusu**:
   - `npm run dev` ile sunucuyu baslat (arka planda degil)
   - `http://localhost:3000` erisim URL'si
   - `http://localhost:3000/api/stats` API testi

6. **Ozet rapor ver**:
   - Her servisin durumu (OK/FAIL)
   - Erisim URL'leri
   - "Test ortami hazir." veya bulunan hatalari bildir
