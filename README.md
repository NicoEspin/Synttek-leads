# Synttek Leads Engine

Monorepo with separated deployments:

- `apps/frontend` -> Next.js UI (deploy to Vercel)
- `apps/backend` -> Node + Express API (deploy separately)

## Local development

1. Install deps in workspace root:

```bash
npm install
```

2. Configure env files:

- `apps/frontend/.env.local` from `apps/frontend/.env.example`
- `apps/backend/.env` from `apps/backend/.env.example`

3. Run apps:

```bash
npm run dev:frontend
npm run dev:backend
```

## API base URL

Frontend reads:

- `NEXT_PUBLIC_API_BASE_URL` (browser and SSR)
- fallback for SSR local dev: `http://localhost:4000`

## Backend API routes

Main routes are under `/v1`:

- `GET /v1/leads`
- `POST /v1/leads/search`
- `GET /v1/leads/:leadId`
- `PATCH /v1/leads/:leadId/status`
- `GET /v1/leads/:leadId/history`
- `GET /v1/leads/:leadId/notes`
- `POST /v1/leads/:leadId/notes`
- `GET /v1/metrics/overview`
- `POST /v1/enrichment/run`
- `POST /v1/enrichment/run-dynamic`
- `POST /v1/internal/cron/enrichment`

For protected internal routes, use `CRON_SECRET` via `x-cron-secret` or `Authorization: Bearer <secret>`.
