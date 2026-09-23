# SPEC-001 — Quote Engine

Estado: alineado con `requirements.md` y `api.md` aprobados. Fórmula: **DECISIÓN PROPUESTA** pendiente de validación con la clienta testing.

## Objetivo
Calcular un precio sugerido de forma reproducible y explicable, para presupuestos con **N trabajos/piezas**.

## Input
Por cada job (`quote_job`):
- servicios (ids + cantidades);
- materiales (ids + cantidades);
- precio vigente de cada material (resuelto en servidor);
- desperdicio (default tenant o override);
- mano de obra: `fixed` (precio) u `hourly` (minutos × tarifa tenant);
- complejidad;
- urgencia;

Por presupuesto:
- costos adicionales;
- margen (default tenant o override del presupuesto).

## Fórmula base propuesta

Por job:

```text
material_cost =
    Σ(quantity × unit_price × (1 + waste))

labor_cost =
    fixed_price
    | estimated_minutes / 60 × hourly_rate

base_cost =
    material_cost + labor_cost + other_costs

complexity_adjustment =
    base_cost × complexity_factor

urgency_adjustment =
    base_cost × urgency_factor

cost_before_margin =
    base_cost
    + complexity_adjustment
    + urgency_adjustment

suggested_price =
    cost_before_margin × (1 + margin)
```

Presupuesto:

```text
suggested_price_quote = Σ(suggested_price_job) [+ other_costs de quote si no está en jobs]
```

## DECISIÓN PENDIENTE
La fórmula exacta de margen, complejidad y urgencia debe validarse con usuarios reales (cliente testing) antes de congelar SPEC-001.

La fórmula anterior es una **DECISIÓN PROPUESTA**, no un requisito confirmado.

## Complejidad propuesta

```text
low       = 0%
medium    = configurable
high      = configurable
very_high = configurable
```

## Urgencia propuesta

```text
normal      = 0%
urgent      = configurable
very_urgent = configurable
```

## Reglas
1. Los porcentajes deben ser configurables por tenant.
2. El cálculo debe devolver desglose (por job y total del presupuesto).
3. El usuario puede modificar el precio final; el sistema conserva el sugerido.
4. Los materiales usan el precio vigente **al calcular**; al guardar, snapshot congelado.
5. Mano de obra fija o por horas según `labor_method` del job.
6. Mismo input + misma configuración → mismo output (determinismo).
7. El servidor resuelve precios; la UI no envía montos definitivos.
8. La IA (V2) solo puede poblar el input; no calcula.

## Acceptance Criteria

### AC-001
Dado un material con precio conocido, la cantidad multiplicada por su precio (con desperdicio) produce el costo correspondiente.

### AC-002
Si cambia el precio del material después de guardar un presupuesto, el presupuesto existente no cambia.

### AC-003
Un nuevo presupuesto utiliza el nuevo precio vigente.

### AC-004
El sistema muestra el desglose del cálculo por job y del presupuesto.

### AC-005
El usuario puede modificar el precio sugerido y registrar motivo opcional.

### AC-006
El precio final no modifica retroactivamente el cálculo original.

### AC-007
El mismo input y configuración produce el mismo resultado.

### AC-008
Un usuario no puede calcular usando materiales pertenecientes a otro tenant.

### AC-009
Dado un presupuesto con 2 jobs (uno fixed y otro hourly), Cuando se calcula, Entonces cada job aplica su método de mano de obra y el total es la suma de jobs.

### AC-010
Dado un job con complejidad `medium` y urgencia `normal`, Cuando se calcula, Entonces los factores configurados del tenant se aplican al costo base de ese job y el desglose los muestra por separado.
