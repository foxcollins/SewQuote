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

## DECISIÓN PENDIENTE
No aplica.

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
