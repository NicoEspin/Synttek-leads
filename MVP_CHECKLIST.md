# Synttek Leads Engine - Checklist MVP

## Estado actual

- [x] 0. Leer PRD y definir alcance MVP
- [x] 1. Confirmar decisiones base de arquitectura (cron simple + Supabase Auth)
- [x] 2. Inicializar proyecto Next.js + TypeScript + Tailwind
- [x] 3. Instalar dependencias frontend/backend
- [x] 4. Configurar plantilla de variables de entorno (`.env.example`)
- [x] 5. Diseñar y crear esquema DB en Supabase (`leads`, `search_runs`, `lead_contacts`)
- [x] 6. Implementar integración Google Places (Text Search + Place Details + FieldMask)
- [x] 7. Implementar deduplicación por `place_id` y persistencia de leads
- [x] 8. Construir pantalla de búsqueda (rubro + ciudad + filtros base)
- [x] 9. Construir tabla de leads (filtros, orden y paginación)
- [x] 10. Implementar detección `has_website` y filtro "sin web"
- [x] 11. Implementar enriquecimiento estático (`fetch + cheerio`)
- [x] 12. Implementar fallback dinámico con Playwright (solo sitios JS)
- [x] 13. Guardar trazabilidad de origen y confianza (`*_source`, `confidence`)
- [x] 14. Implementar scoring inicial (reglas del PRD)
- [x] 15. Implementar CRM básico (estados + notas + historial)
- [x] 16. Implementar vista detalle de lead (acciones rápidas)
- [x] 17. Implementar jobs async de enrichment con cron simple
- [ ] 18. Implementar exportación CSV con filtros aplicados
- [ ] 19. Implementar auth interna (Supabase Auth)
- [ ] 20. Cubrir flujos críticos con tests
- [ ] 21. Hardening: loading/error/empty states + validaciones + tipado estricto
- [ ] 22. Deploy base (Vercel + Supabase) y verificación final MVP

## Dependencias instaladas

### Runtime

- `@supabase/supabase-js`
- `@supabase/ssr`
- `@tanstack/react-table`
- `cheerio`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `tailwind-merge`
- `zod`

### Desarrollo

- `@playwright/test`
- `playwright`
