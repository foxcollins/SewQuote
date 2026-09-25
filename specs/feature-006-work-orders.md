# SPEC-006 — Órdenes de trabajo (workflow de producción)

## Objetivo
Convertir un presupuesto aprobado en trabajo de producción, seguir su estado hasta la entrega y registrar el resultado real para el histórico.

## Input
- Quote en `accepted` (+ `quote_version_number`).
- Acciones: convertir, transicionar estados, registrar tiempo real, materiales usados, precio final real, notas, completar/entregar/cancelar.

## Reglas
1. Conversión **solo** desde `accepted`; copia snapshot de la versión y de medidas de los jobs.
2. **Entidades separadas** (ADR-006, Aceptado): `quotes` = documento comercial; `work_orders` = agregado de ejecución. No se fusionan ni se apilan flags de producción/pago en quotes.
3. **Cardinalidad**: `Quote 1 ─ N WorkOrders` y `quote_jobs 1 ─ N work_order_items`. La conversión de MVP crea **una** OT con un item por pieza (`quote_job`). Partir un pedido en varias OTs es una acción explícita futura, no un subproducto del doble clic.
4. **Anti-duplicados**: (a) índice único parcial en `work_orders(quote_id)` solo para OTs **no canceladas**; (b) server rechaza convertir si ya existe OT activa de esa quote; (c) la UI no muestra “Convertir” si ya hay OT activa (ofrece “Ver orden de trabajo”).
5. **`work_order_items`**: por pieza; referencia a `quote_job_id`; `status` de producción propio; snapshot de medidas; notas. El status de la OT es roll-up; el detalle operativo va en items.
6. Estados de OT (actuales, vocabulario de atelier; renombrar es decisión aparte): `accepted | waiting_garment | in_production | fitting | adjustments | ready | delivered | cancelled`.
7. Transiciones válidas (flujo conceptual aprobado):
   - accepted → waiting_garment | in_production | cancelled
   - waiting_garment → in_production | cancelled
   - in_production → fitting | adjustments | ready | cancelled
   - fitting → adjustments | ready | in_production | cancelled
   - adjustments → fitting | ready | in_production | cancelled
   - ready → delivered | adjustments
   - delivered: **terminal** (aprobado: no se reabre; corrección solo con nota de auditoría si hiciera falta)
   - cancelled: terminal
8. Transiciones inválidas rechazadas server-side.
9. Registrar `actual_minutes`, `actual_price`, `notes` según avance (nivel OT; items pueden heredar o tener los suyos cuando exista UI).
10. `work_materials`: materiales realmente usados (cantidad, precio, total) — diferentes del snapshot del quote si hubo desvío.
11. `delivered`/`completed`: resultado queda en histórico para análisis futuro (REQ-022).
12. No pagos en esta versión; **nunca** `work_order.status = "paid"` (pago será entidad aparte cuando exista).
13. Medidas en producción: solo **snapshot** de la pieza/quote; no releer medidas vivas de la persona (SPEC-005).

## DECISIÓN PENDIENTE
Cerradas:
- `delivered` **no se reabre**.
- Separación Quote / WorkOrder + cardinalidad 1→N + `work_order_items` (ADR-006, **Aceptado**).
- Índice anti-duplicados: unique parcial por OT activa.

Abiertas:
- Vocabulario fino de estados de `work_order_item` (p.ej. esperar tela, corte, costura…). MVP: mismos valores que la OT.
- Acción explícita de “partir pedido en varias OTs” (modelado 1→N listo; UI futura).

## Acceptance Criteria

### AC-001
Dado un presupuesto `accepted`, Cuando se convierte en trabajo, Entonces existe `work_order` ligada a la quote y a su `quote_version_number`.

### AC-002
Dado el presupuesto con medidas en los jobs, Cuando se convierte, Entonces el trabajo conserva `measurements_snapshot` (en la OT y en sus items) sin releer medidas actuales de la persona.

### AC-003
Dado un work_order en `in_production`, Cuando se intenta pasar a `delivered` sin pasar por estados intermedios permitidos, Entonces el sistema rechaza la transición inválida.

### AC-004
Dado un trabajo en curso, Cuando se registran 120 minutos reales y materiales extra, Entonces quedan en `actual_minutes` y `work_materials` sin alterar los snapshots del presupuesto original.

### AC-005
Dado un trabajo `ready`, Cuando se marca `delivered`, Entonces queda como entregado y disponible en el histórico de trabajos finalizados.

### AC-006
Dado un work_order, Cuando se envía un estado no permitido desde el actual, Entonces la API devuelve error de transición y no muta.

### AC-007
Dado un presupuesto `accepted` sin OT, Cuando se pulsa “Convertir” dos veces (doble clic / reintento), Entonces solo existe **una** OT activa y la lista de trabajos no muestra duplicados.

### AC-008
Dado un presupuesto con OT activa, Cuando se consulta su detalle, Entonces la acción mostrada es “Ver orden de trabajo” (no “Convertir”).

### AC-009
Dado un presupuesto con 3 piezas (`quote_jobs`), Cuando se convierte en trabajo, Entonces la OT tiene 3 `work_order_items` (1 por pieza) referenciando cada `quote_job_id`.

### AC-010
Dado un presupuesto con una OT activa, Cuando se intenta generar otra OT sin partir el pedido de forma explícita, Entonces el sistema la rechaza (no duplicados accidentales).
