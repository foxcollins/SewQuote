# SPEC-008 — Catálogo: servicios, materiales, precios e historial

## Objetivo
Administrar el catálogo del tenant: servicios, categorías de trabajo, materiales e historial inmutable de precios.

## Input
- Servicio: name, category, base_price opcional, estimated_minutes, unit, active.
- Material: name, category, unit, active.
- Precio de material: unit_price, currency, valid_from.
- Categoría de trabajo: name, active.

## Reglas
1. Todo es por tenant; sin catálogo compartido entre tenants en esta versión.
2. El sistema **no** interpreta la naturaleza del material: el tenant define nombre, unidad y uso.
3. Cambiar precio = **INSERT** en `material_prices` con `valid_from`; **nunca** UPDATE/DELETE del histórico.
4. Precio vigente = registro con `valid_from` más reciente (≤ hoy o según regla de vigencia).
5. Servicios y categorías de trabajo: CRUD + `active` (baja lógica).
6. Un presupuesto no asume una sola categoría: cada job referencia `job_categories`.
7. Valores `base_price` de servicio son default de UI, no autoridad final del quote (el motor resuelve).
8. **Borrado físico de servicio solo si no está referenciado** en `quote_items` (ni borradores). Si tiene al menos una referencia, el sistema **rechaza el DELETE** y ofrece/reactiva la baja lógica (`active=false`). El borrado no debe tocar el histórico de otras tablas.

## DECISIÓN PENDIENTE
No aplica. Borrado condicional de servicios: **DECISIÓN ACEPTADA** (opción B).

## Acceptance Criteria

### AC-001
Dado un material sin precio, Cuando se registra R$X (o moneda del tenant) con fecha, Entonces existe un registro en `material_prices` con `valid_from`.

### AC-002
Dado un material con precio 41, Cuando se cambia a 45, Entonces quedan dos registros históricos; el de 41 no fue modificado ni borrado.

### AC-003
Dado el historial de precios, Cuando se consulta el precio vigente, Entonces se resuelve el más reciente aplicable.

### AC-004
Dado un servicio, Cuando se desactiva (`active=false`), Entonces no aparece en selects nuevos pero las quotes viejas conservan el snapshot.

### AC-005
Dado un tenant con categorías Reparación/Ajuste/Confección, Cuando crea jobs distintos en un presupuesto, Entonces cada job referencia su categoría.

### AC-006
Dado un usuario, Cuando intenta editar precios históricos de un material, Entonces la operación no existe/rechaza; solo agregar nuevo precio.

### AC-007
Dado un servicio sin ninguna fila en `quote_items`, Cuando el usuario confirma eliminar, Entonces el servicio se borra de `services` y ya no aparece en el catálogo.

### AC-008
Dado un servicio con al menos un `quote_items` (incluido borrador), Cuando el usuario intenta eliminarlo, Entonces la operación se rechaza con mensaje de “en uso”, el servicio sigue existiendo y puede desactivarse (`active=false`).

### AC-009
Dado un servicio eliminado (caso AC-007), Cuando se consulta un presupuesto que nunca lo usó, Entonces no hay referencias colgantes; presupuestos existentes no se modifican.
