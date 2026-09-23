# SPEC-005 — Medidas por persona (historial + snapshot)

## Objetivo
Guardar medidas corporales con historial por **persona destinataria** (no por cliente) y congelar en cada trabajo las medidas realmente usadas.

## Input
- Persona (`person_id`) del tenant.
- Set de medidas: etiqueta, fecha `recorded_at`, notas, pares nombre→valor+unidad (busto, cintura, cadera, largo, manga, hombro, cuello…).
- Al crear/editar job o work_order: `measurement_set_id` de referencia.
- Al guardar job/work: snapshot de valores + `measurements_source_id`.

## Reglas
1. Medidas viven en la **persona**; el cliente solo es quién contrata.
2. Historial por sets fechados (ej. "Medidas 2026-01", "Medidas 2026-09"); no sobrescribir sets antiguos.
3. Editar medidas = actualizar set reciente **o** crear set nuevo (si se quiere preservar el histórico); nunca mutar silenciosamente un set ya usado en trabajos.
4. Al guardar presupuesto/trabajo: copiar valores a `measurements_snapshot` (jsonb) + referencia `measurements_source_id`.
5. Snapshot inmutable: cambios posteriores de la persona no alteran jobs/work_orders históricos.
6. Al crear trabajo nuevo: sugerir el set más reciente de la persona.
7. Si el set tiene antigüedad elevada: advertir ("registradas hace N meses… confirmar antes de usar"). **Umbral aprobado: 1 mes.**
8. Campos libres de medida: catálogo abierto por tenant o lista base configurable; valores en unidades consistentes por set (cm por defecto, no hardcodear formato de locale en el dato).

## DECISIÓN PENDIENTE
No aplica. Umbral de medidas antiguas = **1 mes** (configurable en tenant con este default).

## Acceptance Criteria

### AC-001
Dado un cliente María con persona Ana, Cuando se crean medidas de Ana, Entonces quedan asociadas a Ana y no fusionadas en el perfil de María.

### AC-002
Dado un set de medidas de Ana en enero y otro en septiembre, Cuando se lista el historial, Entonces ambos sets aparecen con sus fechas; el de enero no fue sobrescrito.

### AC-003
Dado un trabajo que usa el set de enero, Cuando después se crea un set nuevo en septiembre, Entonces el trabajo histórico conserva el snapshot de enero.

### AC-004
Dado un trabajo guardado con snapshot de medidas, Cuando cambian los valores del set de origen, Entonces el snapshot del trabajo no cambia.

### AC-005
Dado un trabajo nuevo para Ana con set existente, Cuando el sistema sugiere medidas, Entonces propone el set más reciente y muestra `recorded_at`.

### AC-006
Dado un set con antigüedad **mayor a 1 mes**, Cuando se selecciona para un trabajo nuevo, Entonces aparece advertencia de confirmación antes de usarlo.

### AC-007
Dado un presupuesto con job que tiene medidas, Cuando se convierte en work_order, Entonces el work_order recibe el mismo snapshot de medidas.
