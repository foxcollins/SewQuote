# ADR-006 — Presupuesto y trabajo: agregados separados, Quote 1→N WorkOrders

- **Estado**: Aceptado (aprobado por el usuario; fecha de sesión 2026-09-25)
- **Contexto**: En producción del MVP se detectaron (a) OTs duplicadas al pulsar varias veces “Convertir” y (b) la duda de si `quotes` y `work_orders` deberían fusionarse en una tabla con flags (`production_status`, `payment_status`, …). El flujo real del atelier es: oferta comercial → aprobación → ejecución pieza a pieza (esperar tela, cortar, coser, prueba…), con medidas congeladas del presupuesto.

- **Decisión**
  1. **No fusionar entidades.** `quotes` (documento comercial) y `work_orders` (agregado de ejecución) se mantienen separadas. Un estado de quote no representa producción; un estado de OT no representa oferta ni pago.
  2. **Sin pila de flags en quotes** (`production_status`, `approved_flag`, etc.): un estado = un concepto y transiciones válidas.
  3. **Relación `Quote 1 ─ N WorkOrders`** y **`quote_jobs (pieza) 1 ─ N work_order_items`**. La UI de MVP crea **una** OT en la conversión; modelar 1→N desde el inicio evita rehacer el esquema si luego se parte un pedido (p.ej. 10 uniformes en dos OTs).
  4. **Anti-duplicados sin unique absoluto en `quote_id`**: índice único parcial `work_orders (quote_id) where status <> 'cancelled'` + rechazo server-side si ya hay OT activa para la quote + UI que oculta “Convertir” si ya existe OT no cancelada.
  5. **`work_order_items`** por pieza: `quote_job_id`, `measurements_snapshot` (o join al snapshot del job), `status` de producción propio, notas/tiempos opcionales. El estado roll-up de la OT es informativo; el granulado vive en los items.
  6. **Pagos y entrega fuera de `work_order.status`** (MVP sin pagos; SPEC-006 regla 8 se mantiene).
  7. Medidas en producción: **solo snapshot** del presupuesto/pieza; nunca releer medidas vivas de la persona (SPEC-005).

- **Consecuencias**
  - Revisar `supabase/migrations/0004_work_order_unique_quote.sql` **antes de aplicar** (pasar de unique absoluto a unique parcial por OT activa).
  - Migración nueva: tabla `work_order_items` + backfill desde OTs existentes (1 item por job o genérico si no hay jobs).
  - SPEC-006 y `data-model.md` actualizados como propuesta; conversión del MVP sigue siendo manual tras `accepted`.
  - Estados de OT actuales (`accepted|waiting_garment|…`) se pueden reetiquetar después; no bloquea el modelo 1→N.
