# Synttek Leads Engine

Internal lead discovery and enrichment tool for Synttek.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `GOOGLE_PLACES_API_KEY` and Supabase variables.
3. Run the app:

```bash
npm run dev
```

## API - Lead search (MVP)

Endpoint: `POST /api/leads/search`

Payload:

```json
{
  "rubroComercial": "Gastronomia",
  "city": "Cordoba",
  "keywords": "cafeteria",
  "pageSize": 10,
  "languageCode": "es",
  "regionCode": "AR"
}
```

What it does:

- Runs Google Places Text Search.
- Expands each result with Place Details.
- Uses FieldMask in both calls to control API cost.
- Deduplicates by `place_id` and upserts leads in Supabase.
- Creates and finalizes a `search_runs` record for traceability.
- Calculates initial lead score using MVP business rules.
- Treats social profile URLs (Instagram/Facebook/WhatsApp/X/TikTok/YouTube) as `has_website=false`.

Response includes:

- `searchRunId`
- `totalFound`
- `totalSaved`
- `savedPlaceIds`
- `leads` (normalized candidates)

## API - Leads list and CRM status

Endpoint: `GET /api/leads`

Query params:

- `page`, `pageSize`
- `city`, `rubroComercial`
- `status`
- `onlyWithoutWebsite`, `onlyWithPhone`
- `sortBy` (`updated_at | score | reviews_count | created_at`)
- `sortDir` (`asc | desc`)

Endpoint: `PATCH /api/leads/:leadId/status`

Payload:

```json
{
  "status": "contactado"
}
```

Endpoint: `GET /api/leads/:leadId`

What it does:

- Returns lead detail with enriched contacts and core commercial fields.

UI route: `/leads/:leadId`

- Shows complete lead detail, contact signals, status history and CRM notes.

Endpoint: `GET /api/leads/:leadId/history?limit=20`

What it does:

- Returns chronological status changes for one lead.
- Data source: `lead_status_history` (triggered automatically when lead status changes).

Endpoint: `GET /api/leads/:leadId/notes?limit=30`

Endpoint: `POST /api/leads/:leadId/notes`

Payload:

```json
{
  "note": "Le escribi por WhatsApp, espera propuesta la semana que viene."
}
```

What it does:

- Stores operational CRM notes per lead.
- Keeps chronological note history for follow-up.

Endpoint: `GET /api/metrics/overview`

What it does:

- Returns dashboard counters (total leads, sin web, enrichment y contactados).

## API - Static enrichment

Endpoint: `POST /api/enrichment/run`

Payload:

```json
{
  "batchSize": 10
}
```

What it does:

- Selects pending leads with website.
- Crawls site HTML using `fetch`.
- Extracts WhatsApp/Instagram via anchors and JSON-LD `sameAs`.
- Marks enrichment as `done` or `failed`.
- Stores contact traceability in `lead_contacts` with `source=website_crawler` and confidence.
- Recalculates lead score with enrichment signals (for example, Instagram without website).

Security:

- If `CRON_SECRET` is set, send `x-cron-secret` header in the request.

Endpoint: `POST /api/enrichment/run-dynamic`

Payload:

```json
{
  "batchSize": 5
}
```

What it does:

- Processes leads with `enrichment_status=failed`.
- Uses Playwright to render JS-heavy websites.
- Reuses the same extraction and traceability pipeline.

Endpoint: `GET /api/cron/enrichment`

What it does:

- Runs static enrichment first and dynamic fallback after.
- Intended for scheduler use (Vercel Cron).
- Uses `CRON_SECRET` via `Authorization: Bearer <secret>` or `x-cron-secret` when configured.

## Scoring (MVP)

Implemented in `lib/leads/scoring.ts`:

- `+40` no website
- `+20` has phone and no website
- `+15` many reviews (>= 80)
- `+10` high-conversion rubro (MVP set)
- `+10` has Instagram and no website
- `+5` weak website heuristic
- `-15` strong website heuristic
- `-20` large chain/franchise name heuristic
