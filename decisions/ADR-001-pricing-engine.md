# ADR-001 — Motor determinístico de presupuestos

## Estado
Aceptado.

## Contexto
El producto necesita precios consistentes y explicables. Un LLM puede producir resultados variables y no debe ser la autoridad para calcular valores monetarios.

## Decisión
El cálculo de precios será determinístico y estará implementado en el dominio/backend.

La IA podrá transformar lenguaje natural en inputs estructurados, pero no determinará el precio final.

## Consecuencias positivas
- reproducibilidad;
- testabilidad;
- auditabilidad;
- mayor control;
- menor dependencia de IA;
- posibilidad de cambiar proveedor de LLM.

## Consecuencias
Será necesario definir explícitamente las reglas de negocio de:
- mano de obra;
- margen;
- complejidad;
- urgencia;
- desperdicio;
- redondeo.

## Alternativas descartadas inicialmente
### LLM como calculadora principal
Descartada por falta de determinismo y dificultad de auditoría.

### Tabla fija de precios
Insuficiente para aprovechar costos reales e historial del profesional.
