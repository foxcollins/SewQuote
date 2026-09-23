# SewQuote — Sistema Inteligente de Presupuestos para Confección (SDD)

## Estado
SDD fases 1–8 completadas. Código (fase 9) iniciado: app Next.js + motor de pricing + migración Supabase.

## Comandos
- `npm install`
- `npm run dev`
- `npm test` (vitest — pricing)
- `npm run typecheck`
- Copiar `.env.example` → `.env.local` con claves Supabase

## Fuente de verdad
Estos documentos definen el alcance, reglas y arquitectura del MVP. UI base: `design.md`.

## Documentos
- product.md
- requirements.md
- architecture.md
- data-model.md
- api.md
- security.md
- ai.md
- testing.md
- deployment.md
- design.md (base UI del prototipo Stitch)
- roadmap.md
- specs/feature-001-quote-engine.md
- specs/feature-002-i18n.md
- specs/feature-003-quote-lifecycle.md
- specs/feature-004-public-approval.md
- specs/feature-005-measurements.md
- specs/feature-006-work-orders.md
- specs/feature-007-clients-and-persons.md
- specs/feature-008-catalog.md
- specs/feature-009-auth-tenancy.md
- specs/feature-010-tenant-settings.md
- specs/feature-011-pwa.md
- decisions/ADR-001-pricing-engine.md
- decisions/ADR-002-snapshot-material-prices.md
- decisions/ADR-003-vercel-supabase-free-tier.md
- decisions/ADR-004-ui-prototype-design.md
- AGENTS.md

## Principio
El motor determinístico calcula. La IA interpreta y asiste. El profesional conserva la decisión final.
