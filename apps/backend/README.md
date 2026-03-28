# Express API

Dedicated backend for Synttek Leads Engine.

## Run

```bash
npm run dev
```

## Required env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY`

## API env vars

- `API_PORT` (default `4000`)
- `API_CORS_ORIGINS` (comma-separated, default `http://localhost:3000`)
- `API_RATE_LIMIT_WINDOW_MS` (default `60000`)
- `API_RATE_LIMIT_MAX` (default `120`)
- `CRON_SECRET` (optional, required for protected internal/enrichment routes in production)

## Frontend integration

Set `NEXT_PUBLIC_API_BASE_URL` in the Next.js app to point to this API, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```
