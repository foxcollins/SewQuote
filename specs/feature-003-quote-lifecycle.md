# SPEC-003 — Presupuesto: creación, estados, caducidad y versiones

## Objetivo
Gestionar el ciclo de vida de un presupuesto con N trabajos/piezas: borrador editable, envío, aprobación/rechazo, vencimiento y versionado formal.

## Input
- Cliente (+ persona destinataria por job).
- N jobs: categoría, prenda, servicios, materiales, labor (fixed/hourly), complejidad, urgencia, notas, medidas opcionales.
- `valid_until` (fecha de caducidad).
- Margen override opcional, costos adicionales, notas del presupuesto.
- Acciones: guardar borrador, enviar, aceptar, rechazar, cancelar, marcar vencido, recalcular por vencimiento.

## Reglas
1. Un presupuesto contiene **1..N `quote_jobs`**; cada job tiene `job_category_id` propio.
2. Solo `draft` es editable de contenido. `accepted` no se edita directamente: cambios → nueva versión.
3. Estados: `draft | sent | accepted | rejected | expired | cancelled`.
4. Transiciones válidas:
   - draft → sent | cancelled
   - sent → accepted | rejected | expired | cancelled
   - expired → recálculo manual → **vuelve a `sent`** con nueva versión (decisión aprobada)
5. Editar draft **no** crea versión.
6. Versiones solo en: `send` (`reason=sent`), `accept` (`reason=accepted`), `recalculate_after_expiry` (tras recalcular, estado final = `sent`).
7. Todo presupuesto tiene `valid_until`. Al vencer: marcar `expired` y avisar "los precios pueden haber cambiado"; **nunca** recalcular en background.
8. Recálculo manual solo con precios vigentes actuales → nuevos snapshots + nueva versión + estado `sent`.
9. Al guardar: snapshot de materiales (`unit_price_snapshot`) por job.
10. Override: `final_price` + `override_reason` opcionales; `suggested_price` se conserva.
11. Numeración visible por tenant: `quote_number` correlativo por tenant (formato `#001`, `#002`…).

## DECISIÓN PENDIENTE
No aplica. Cerradas:
- Recálculo por vencimiento → **reactiva a `sent`**.
- Numeración → **#001 correlativo por tenant**.

## Acceptance Criteria

### AC-001
Dado un usuario en tenant A, Cuando crea un presupuesto con 2 jobs de categorías distintas, Entonces ambos jobs quedan bajo la misma quote con sus categorías.

### AC-002
Dado un presupuesto en draft, Cuando edita servicios o materiales, Entonces no se crea una nueva versión.

### AC-003
Dado un presupuesto en draft, Cuando lo envía, Entonces pasa a `sent` y se crea una versión `reason=sent` con snapshot.

### AC-004
Dado un presupuesto `sent`, Cuando el cliente lo acepta (vía enlace o interno), Entonces pasa a `accepted`, registra `accepted_at` y crea versión `reason=accepted`.

### AC-005
Dado un presupuesto `accepted`, Cuando se intenta editar su contenido, Entonces el sistema lo rechaza (o exige nueva versión/nueva quote según regla aprobada).

### AC-006
Dado un presupuesto con `valid_until` en el pasado, Cuando se consulta, Entonces su estado es `expired` y se muestra aviso de precios posiblemente cambiados, sin haber modificado montos solos.

### AC-007
Dado un presupuesto `expired`, Cuando el profesional ejecuta recalcular, Entonces se usan precios actuales, se guardan nuevos snapshots, se crea versión `recalculated_after_expiry` y el estado pasa a **`sent`**.

### AC-010
Dado el primer presupuesto de un tenant, Cuando se crea, Entonces su número visible es `#001`; el siguiente es `#002` (correlativo por tenant, no global).

### AC-008
Dado un presupuesto con precio sugerido 400 y final 450 por override, Cuando se consulta, Entonces se conservan sugerido 400, final 450 y el motivo opcional.

### AC-009
Dado el precio de un material que cambia después de guardar, Cuando se reabre el presupuesto existente, Entonces los `quote_materials` siguen con el precio congelado original.
