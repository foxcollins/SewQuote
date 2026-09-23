# ADR-002 — Snapshot de precios de materiales

## Estado
Aceptado.

## Contexto
Los materiales pueden cambiar de precio con el tiempo.

## Decisión
Cada presupuesto almacenará el precio unitario utilizado en el momento de su creación/cotización.

El histórico original permanecerá en `material_prices`.

## Consecuencia
Los presupuestos históricos permanecen reproducibles incluso si el precio actual cambia.

## Ejemplo

```text
22/09 → Satén = R$41
Quote #1 → R$41

25/09 → Satén = R$45
Quote #1 → sigue R$41
Quote #2 → R$45
```
