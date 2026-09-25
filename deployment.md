# Deployment — SewQuote

Estado: alineado con requirements/architecture/security aprobados. Infra: Vercel Hobby + Supabase Free.

## Decisión de infraestructura
MVP sobre **Vercel Hobby (free tier)** + **Supabase Free tier**. Objetivo de costo: **US$ 0/mes**.

Fase actual: validación con **un solo cliente de testing** (sin monetización), compatible con los términos de Vercel Hobby. Monetizar o sumar clientes de pago → revisar ADR-003.

ADR relacionado: `decisions/ADR-003-vercel-supabase-free-tier.md`.

## Stack

### Frontend
- Vercel (plan Hobby).
- Next.js (App Router) + PWA en el mismo dominio.
- Rutas públicas: `/orcamento/[token]` (enlace de presupuesto).

### Backend / Base de datos
- Supabase Free: PostgreSQL, Auth, Storage, RLS.
- Lógica crítica en Server Actions / módulos de dominio; Edge Functions solo si hace falta.

### Imágenes y documentos
- Supabase Storage (buckets privados + URL firmadas).
- Optimizar/comprimir antes de subir (límite ~1 GB).

## Límites del free tier a respetar desde el diseño

### Supabase Free
- 2 proyectos: 1 producción; 2.º opcional para staging/local cloud.
- ~500 MB de base de datos → modelo compacto, logs de auditoría ligeros.
- ~1 GB de storage → fotos optimizadas; sin PDFs grandes en MVP (PDF es V1).
- 50.000 MAU auth: suficiente para validación.
- Pausa por inactividad (~7 días): en producción con uso real del cliente testing no debería pausarse; staging puede pausarse.
- Sin PITR → **exportación manual periódica** del SQL de producción.
- Edge Functions con límites → pricing corto y síncrono.

### Vercel Hobby
- Uso no comercial: **aceptado** en la fase actual (1 cliente de testing, sin cobro). Al monetizar o sumar clientes externos → revisar ADR-003.
- Timeouts cortos → nada de jobs largos en request; expireQuote bajo demanda o cron muy ligero si se usa Vercel Cron (dentro de cuota).
- Secrets en environment variables.

## Entornos
- **local**: Supabase local o proyecto de desarrollo + `vercel dev`.
- **staging**: opcional al inicio (2.º proyecto Supabase); puede saltarse.
- **production**: Vercel production + Supabase de producción, aislada.

## Variables de entorno
Nunca secretos en Git.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo server-side
- futuras API keys de IA — solo server-side (V2, con aprobación)

## CI/CD
- GitHub + despliegue automático en Vercel (preview por PR, production por rama principal).
- Migraciones SQL versionadas en el repo bajo **`/supabase/migrations/`** (fuente de verdad del esquema).
- **GitHub Action** `.github/workflows/supabase-migrate.yml`:
  - **Trigger**: push a `main` que modifique `/supabase/migrations/**` (o ejecución manual `workflow_dispatch`).
  - **Acción**: `supabase db push --project-ref wmgntbvlnoknrxfuulcq` (aplica solo migraciones pendientes).
  - **Secret requerido en el repo GitHub**: `SUPABASE_ACCESS_TOKEN` (token personal de Supabase; Settings → Access tokens). Sin este secret la job falla; en ese caso aplicar a mano con `supabase db push` desde local.
- Migración manual revisada sigue siendo válida como alternativa al pipeline.
- Flujo recomendado: editar SQL en `/supabase/migrations/NNNN_*.sql` → commit/push a `main` → Action aplica en Supabase; Vercel redespliega el código en paralelo.

## Migraciones iniciales (orden sugerido)
1. tenants + profiles + auth
2. clients + persons + job_categories + services + materials + material_prices
3. quotes + quote_jobs + quote_items + quote_materials + quote_versions
4. work_orders + work_materials
5. measurement_sets + measurement_values
6. RLS en todo + políticas
7. Índices de `data-model.md`

## Observabilidad
Inicial (free):
- logs de Vercel;
- Database Logs / Edge logs de Supabase;
- errores frontend;
- dashboard de uso de Supabase.

Posterior (si sale de free):
- Sentry free tier como primer escalón;
- tracing;
- métricas de pricing;
- costos de IA.

## Reglas de costo $0
1. Nada de servicios de pago sin aprobación explícita.
2. Si un límite free se rompe, primero optimizar (retención, storage, filas).
3. Revisar mensualmente uso en ambos dashboards durante la validación.
4. Backups manuales periódicos mientras no haya plan de pago.

## Checklist de release MVP
- [ ] RLS aplicada en todas las tablas + tests de security en verde
- [ ] Pricing con tests unitarios en verde (SPEC-001 congelada o marcada)
- [ ] Enlace público: token opaco, solo GET/POST permitidos, doble accept idempotente
- [ ] Secrets solo en env de Vercel
- [ ] Export SQL de producción documentado
- [ ] PWA instalable en móvil del cliente testing
- [ ] i18n ES/PT sin strings de dominio hardcodeados
