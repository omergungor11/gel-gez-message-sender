# Tech Stack

## Runtime
- Node.js 25.x
- Package manager: npm
- TypeScript 5.6+ (strict, ESM)

## Backend
- Framework: Express.js 4.x
- Scraping: Cheerio 1.x
- Image Processing: Sharp 0.33+
- WhatsApp: Twilio SDK 5.x
- AI: Google Vertex AI (Gemini 1.5 Pro + Imagen 3)

## Frontend
- Vanilla HTML/CSS/JS (single-page dashboard)
- No build step needed (served by Express)
- Ubuntu font (site ile uyumlu)

## Database
- SQLite via better-sqlite3
- ORM: Drizzle ORM 0.36+
- Storage: `data/pipeline.db`

## Infrastructure
- Cron: node-cron 3.x (in-process)
- Output: `output/` directory for generated images
- Config: dotenv + zod validation
