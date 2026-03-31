# Code Conventions

## TypeScript
- Strict mode always enabled
- No `any` types (use `unknown` + type guards)
- ESM modules (`"type": "module"` in package.json)
- Import paths with `.js` extension (ESM requirement)
- Explicit return types on exported functions

## File Naming
- `kebab-case` for all files
- `.ts` extension for TypeScript source
- Colocated: scraper logic in `src/scraper/`, social in `src/social/`

## API Design
- RESTful endpoints: `/api/{resource}`
- Response format: `{ data }` or `{ error }`
- HTTP status codes: 200, 201, 400, 404, 500

## Database
- SQLite + Drizzle ORM
- snake_case column names
- Dates stored as ISO 8601 strings
- JSON arrays stored as TEXT (JSON.stringify)

## Scraping
- Cheerio for HTML parsing (no headless browser)
- 1 second delay between requests (rate limiting)
- User-Agent header always set
- Error handling with fallback values

## Testing
- Direct execution: `npx tsx src/module/file.ts`
- `if (import.meta.url === ...)` pattern for test blocks
- DRY_RUN mode for safe pipeline testing
