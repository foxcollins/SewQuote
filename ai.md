# AI Architecture — SewQuote

Estado: alineado con `product.md` y `requirements.md`. **La IA no es dependencia de esta versión (V2).**

## Principio
```text
IA = interpretación/asistencia
Código = cálculo/reglas
Profesional = decisión final
```

## Rol en el producto
- MVP/V1 actual: sin IA en el camino crítico. Todo el flujo (presupuesto → cálculo → aprobación → trabajo) funciona sin IA.
- V2: asistente operativo sobre datos reales del sistema.

## V1 — Natural Language Intake (diseño, sin construir aún)

Ejemplo:

> "Necesito ajustar la cintura y acortar 8 cm este vestido de satén con forro."

La IA transforma la solicitud en datos estructurados.

```json
{
  "garment": "vestido",
  "material": "satén",
  "services": [
    "ajuste_cintura",
    "reducir_largo"
  ],
  "attributes": {
    "lining": true,
    "length_reduction_cm": 8
  }
}
```

Después:

```text
Structured Input (QuoteInput)
→ Pricing Engine (determinístico)
→ Calculation
→ Profesional edita
→ Confirmación
```

## Casos de uso V2 (del contexto de negocio)
- Resumen diario ("Bom dia… hoy tienes: entregas, atrasos, presupuestos por vencer").
- Alertas: presupuesto venciendo, trabajo atrasado, esperando aprobación.
- Resumen operativo del día.
- Consulta sobre datos reales ("¿qué entregas tengo esta semana?").

La IA responde **solo** con datos estructurados del sistema; no es la autoridad de precios, costos ni estados.

## Restricciones
La IA no puede:
- inventar precios;
- aprobar presupuestos;
- cambiar la tarifa horaria;
- modificar el margen;
- confirmar órdenes;
- saltarse permisos;
- ejecutar instrucciones de sistema escondidas en contenido de cliente (prompt injection → ver `security.md`).

## Human-in-the-loop
El profesional debe poder editar todos los datos inferidos antes del cálculo definitivo.

## Futuro
- recomendación basada en trabajos similares;
- estimación de tiempo;
- detección de subprecio;
- análisis de fotos;
- extracción de servicios desde conversación.

## Costo
V2 evaluar proveedor y costos fuera del free tier actual (ADR-003): no incorporar LLM de pago sin aprobación.
