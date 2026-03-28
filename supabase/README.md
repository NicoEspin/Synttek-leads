# Supabase setup

## Migration inicial

- Archivo: `supabase/migrations/20260327133000_init_leads_engine.sql`
- Crea tipos, tablas e indices base del MVP.
- Incluye politicas RLS para usuarios autenticados.

## Migration de historial CRM

- Archivo: `supabase/migrations/20260328193000_add_lead_status_history.sql`
- Crea `lead_status_history` para trazabilidad de cambios de estado.
- Agrega trigger `trg_log_lead_status_change` sobre `leads`.

## Migration de notas CRM

- Archivo: `supabase/migrations/20260328201500_add_lead_notes.sql`
- Crea `lead_notes` para notas operativas por lead.
- Reutiliza trigger `set_updated_at()` para `updated_at`.

## Como aplicarla

1. Abri tu proyecto en Supabase.
2. Andá a SQL Editor.
3. Pegá y ejecutá el contenido de la migration.
4. Verificá que existan las tablas `leads`, `search_runs`, `lead_contacts`, `lead_status_history` y `lead_notes`.

## Notas

- `place_id` es unico para deduplicacion.
- `has_website = false` tiene indice parcial para filtro rapido "sin web".
- `set_updated_at()` actualiza `updated_at` automaticamente en `leads`.
