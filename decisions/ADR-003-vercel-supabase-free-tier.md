# ADR-003 — Vercel + Supabase free tier (costo $0)

## Estado
Aceptado.

## Contexto
El proyecto está en fase de discovery/validación. No debe generar costo fijo de infraestructura hasta demostrar tracción. Se necesita hosting de frontend PWA y backend BaaS multi-tenant con auth, database y storage.

## Decisión
- Frontend en **Vercel plan Hobby (free tier)**.
- Backend en **Supabase Free tier** (PostgreSQL, Auth, Storage, RLS, Edge Functions).
- Costo objetivo del MVP en validación: **US$ 0/mes**.

## Consecuencias positivas
- Sin burn durante validación del producto.
- Ambos servicios ya estaban previstos en la arquitectura (Next.js + Supabase).
- RLS y multi-tenancy disponibles sin costo adicional.

## Consecuencias y límites aceptados
- Límites de Supabase Free: ~500 MB DB, ~1 GB storage, 2 proyectos, pausa por inactividad, sin PITR → mitigaciones en `deployment.md`.
- Vercel Hobby con restricciones de uso no comercial → **aceptado para la fase actual**: la validación será con **un solo cliente de testing**, sin monetización ni alta de clientes externos de pago.
- Timeouts cortos de serverless → el pricing engine debe ser corto y síncrono.
- Backups: exportación manual periódica mientras no haya plan de pago.

## Alternativas descartadas inicialmente
### Vercel Pro + Supabase Pro
Descartada por costo fijo durante la fase de validación ($0 es requisito actual).

### Otros BaaS/hosts de pago
Descartados por no mejorar el límite de costo ni la alineación con el stack ya especificado (Next.js + Supabase).

## Condiciones de revisión
Revisar este ADR cuando:
1. se apruebe monetizar el producto o incorporar clientes externos más allá del cliente de testing;
2. se superen límites free de DB o storage;
3. la pausa por inactividad o la falta de backups afecte producción real.
