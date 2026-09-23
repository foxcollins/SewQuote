# SPEC-010 — Configuración del tenant (negocio)

## Objetivo
Permitir a la profesional configurar moneda, idioma, zona horaria y parámetros por defecto del motor de cálculo.

## Input
- `name`, `country`, `currency`, `timezone`, `locale` (default `es`).
- `hourly_rate`, `default_margin_percent`, `default_waste_percent`.
- Factores de complejidad: low/medium/high/very_high.
- Recargos de urgencia: normal/urgent/very_urgent.
- Categorías de trabajo (CRUD ligado aquí o en catálogo).
- Umbral de antigüedad de medidas (**default aprobado: 1 mes**, configurable).

## Reglas
1. Defaults del tenant alimentan quotes nuevos; **no** obligan: margin/waste del presupuesto pueden sobreescribir (REQ-015).
2. Tarifa horaria se usa en jobs `hourly` al calcular (resolución server-side).
3. Moneda/idioma/timezone no hardcodeados; drives formateo `Intl` (SPEC-002).
4. Cambios de configuración **no** reescriben quotes ya guardados ni su snapshot.
5. Solo el rol con permiso del tenant (owner) edita settings.

## DECISIÓN PENDIENTE
No aplica. Umbral de medidas antiguas = 1 mes.

## Acceptance Criteria

### AC-001
Dado un tenant con tarifa 35 y margen default 40%, Cuando crea un job hourly y quote sin margin override, Entonces el cálculo usa 35 y 40% sin editar la quote.

### AC-002
Dado un tenant con margen default 40%, Cuando la quote fija margen 25%, Entonces se aplica 25% solo en esa quote.

### AC-003
Dado un cambio de tarifa horaria después de guardar quotes, Cuando se reabren quotes antiguas, Entonces sus montos no cambian (snapshot/versiones).

### AC-004
Dado un tenant con `currency` no BRL, Cuando muestra precios, Entonces formatea con esa moneda y el locale activo.

### AC-005
Dado un tenant, Cuando edita factores de complejidad, Entonces quotes futuros usan los nuevos factores; los guardados no se recalculan solos.
