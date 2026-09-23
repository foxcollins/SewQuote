# SPEC-006 — Órdenes de trabajo (workflow de producción)

## Objetivo
Convertir un presupuesto aprobado en trabajo de producción, seguir su estado hasta la entrega y registrar el resultado real para el histórico.

## Input
- Quote en `accepted` (+ `quote_version_number`).
- Acciones: convertir, transicionar estados, registrar tiempo real, materiales usados, precio final real, notas, completar/entregar/cancelar.

## Reglas
1. Conversión **solo** desde `accepted`; copia snapshot de la versión y de medidas de los jobs.
2. Estados: `accepted | waiting_garment | in_production | fitting | adjustments | ready | delivered | cancelled`.
3. Transiciones válidas (flujo conceptual aprobado):
   - accepted → waiting_garment | in_production | cancelled
   - waiting_garment → in_production | cancelled
   - in_production → fitting | adjustments | ready | cancelled
   - fitting → adjustments | ready | in_production | cancelled
   - adjustments → fitting | ready | in_production | cancelled
   - ready → delivered | adjustments
   - delivered: **terminal** (aprobado: no se reabre; corrección solo con nota de auditoría si hiciera falta)
   - cancelled: terminal
4. Transiciones inválidas rechazadas server-side.
5. Registrar `actual_minutes`, `actual_price`, `notes` según avance.
6. `work_materials`: materiales realmente usados (cantidad, precio, total) — diferentes del snapshot del quote si hubo desvío.
7. `delivered`/`completed`: resultado queda en histórico para análisis futuro (REQ-022).
8. No pagos en esta versión.

## DECISIÓN PENDIENTE
No aplica. Aprobado: `delivered` **no se reabre**.

## Acceptance Criteria

### AC-001
Dado un presupuesto `accepted`, Cuando se convierte en trabajo, Entonces existe `work_order` ligada a la quote y a su `quote_version_number`.

### AC-002
Dado el presupuesto con medidas en los jobs, Cuando se convierte, Entonces el work_order tiene `measurements_snapshot`.

### AC-003
Dado un work_order en `in_production`, Cuando se intenta pasar a `delivered` sin pasar por estados intermedios permitidos, Entonces el sistema rechaza la transición inválida.

### AC-004
Dado un trabajo en curso, Cuando se registran 120 minutos reales y materiales extra, Entonces quedan en `actual_minutes` y `work_materials` sin alterar los snapshots del presupuesto original.

### AC-005
Dado un trabajo `ready`, Cuando se marca `delivered`, Entonces queda como entregado y disponible en el histórico de trabajos finalizados.

### AC-006
Dado un work_order, Cuando se envía un estado no permitido desde el actual, Entonces la API devuelve error de transición y no muta.
