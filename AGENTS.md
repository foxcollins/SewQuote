# Reglas SDD del proyecto

Fuente de verdad: los documentos de la raíz (`product.md`, `requirements.md`, `architecture.md`, `data-model.md`, `api.md`, `security.md`, `ai.md`, `testing.md`, `deployment.md`, `roadmap.md`), `specs/` y `decisions/`. `Project_context.md` y `docs/analisis.md` son insumos de discovery, no especificación vigente.

## Orden del proceso SDD

1. `product.md` (SewQuote)
2. `requirements.md`
3. `architecture.md`
4. `data-model.md`
5. `api.md`
6. `security.md`, `ai.md`, `testing.md`, `deployment.md`
7. `specs/feature-NNN-*.md` por funcionalidad
8. ADR en `decisions/` para cada decisión estructural
9. Solo después: código

Estado actual: fases 1–8 completadas (docs + 11 specs + ADR-001..004). Fase 9 (código) iniciada: scaffold Next.js + Tailwind + tokens `design.md`, motor pricing con tests (6), i18n ES/PT, Rutas app shell, migración SQL `supabase/migrations/0001_init.sql`. Pendiente usuario: fórmula SPEC-001 con clienta testing. Pendientes de código: auth real Supabase, CRUD modules, quotes UI completa, público `/orcamento/[token]`, env vars, deploy Vercel/Supabase.

No avanzar de fase sin aprobación del usuario en la fase anterior.

## Reglas al escribir especificación

- No inventar decisiones de negocio no tomadas.
- Marcar huecos como `DECISIÓN PENDIENTE`.
- Marcar propuestas no confirmadas como `DECISIÓN PROPUESTA`.
- No promover funcionalidades futuras (pagos, Pix, inventario, WhatsApp, agenda, gastos, rentabilidad) al MVP.
- No escribir código, SQL, migraciones ni componentes hasta que la fase de specs lo indique.
- Mantener separados: cliente, persona destinataria, medidas (historial + snapshot en trabajo), presupuesto y trabajo.
- Presupuesto = múltiples trabajos/piezas; cada trabajo tiene categoría propia.
- Nunca sobrescribir historial de precios de materiales; congelar precio en el presupuesto al guardarlo.
- Versionar presupuestos solo en modificaciones formales (envío, aprobación, recálculo por vencimiento), no en cada edición de borrador.
- Multi-tenant (RLS) desde el inicio; todo dato pertenece a un tenant.
- IA asistiva únicamente: interpreta; el motor determinístico calcula; la profesional decide.
- No hardcodear moneda (BRL), idioma ni formatos de fecha.

## Reglas de specs (`specs/`)

Cada spec debe incluir: objetivo, input, reglas, `DECISIÓN PENDIENTE` si aplica, y criterios de aceptación con formato `AC-NNN` (Dado/Cuando/Entonces).

## Reglas de ADR (`decisions/`)

Formato: título `ADR-NNN — tema`, Estado (Propuesto/Aceptado/Descartado), Contexto, Decisión, Consecuencias. Numeración correlativa.

## Al terminar un paso SDD

Mostrar al usuario:
1. El documento completo generado/editado.
2. Decisiones consolidadas.
3. `DECISIONES PENDIENTES`.

Esperar aprobación antes de continuar.
