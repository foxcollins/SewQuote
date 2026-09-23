# Testing — SewQuote

Estado: alineado con requirements, data-model, api y security aprobados.

## Estrategia
- Unit: pricing engine y reglas de snapshots/estados (núcleo del valor).
- Integration: flujos con Supabase (RLS, quote lifecycle, work orders).
- Security: aislamiento de tenant + enlace público.
- E2E: happy path completo del MVP ampliado (con medidas y aprobación pública).

Cada REQ debe tener al menos un criterio de aceptación verificable antes de considerar la versión terminada.

## Unit tests

### Pricing (SPEC-001)
Probar:
- material único;
- múltiples materiales;
- cantidades;
- desperdicio;
- mano de obra fija;
- mano de obra por horas;
- complejidad;
- urgencia;
- margen (default tenant y override por quote);
- múltiples jobs en un presupuesto;
- redondeo;
- override de precio final (conserva sugerido).

### Historical pricing (obligatorio)
```text
Material = Satén
Precio A = 41
Quote A → snapshot 41

Precio actual cambia a 45

Quote A debe continuar mostrando 41.
Nuevo Quote B debe utilizar 45.
```

### Versionado y caducidad
- Editar draft no crea versión.
- sendQuote crea versión `sent`.
- acceptQuote crea versión `accepted`.
- Vencido no cambia montos solo.
- recalculateAfterExpiry cambia montos y crea versión `recalculated_after_expiry`.

### Estados
- Transiciones inválidas rechazadas (ej. editar quote `accepted`, aceptar `draft`).
- convertQuoteToWorkOrder solo desde `accepted`.

### Medidas
- Snapshot del set usado queda en quote_job / work_order.
- Editar set posterior no altera snapshot histórico del trabajo.
- Sugerencia devuelve el set más reciente y permite advertir antigüedad.

## Integration tests
- Auth + tenant isolation.
- CRUD cliente, persona, servicio, material, categoría de trabajo.
- Cambiar precio (INSERT historial) y recalcular quote nueva.
- Crear presupuesto con N jobs → guardar → snapshots presentes.
- Enviar → aceptar por enlace público → versión accepted.
- Aceptar presupuesto → convertir a trabajo → transiciones → finalizar.
- Medidas: crear set → usar en job → snapshot al guardar.

## Security tests
Intentar (todos deben fallar):
- consultar cliente de otro tenant;
- modificar material o quote de otro tenant;
- acceder a archivos privados ajenos;
- leer quote con token inexistente / de otro tenant;
- `POST accept` sobre quote draft, expired o de otro token;
- aceptar dos veces con el mismo token → idempotente, sin estado inválido;
- enviar montos manipulados desde el cliente y que el servidor los use en definitiva (debe recalcular en servidor).

## E2E
Flujo mínimo:

```text
Registro
→ configuración (tarifa, margen, categorías)
→ crear cliente + persona destinataria
→ crear servicio + material + precio
→ crear set de medidas de la persona
→ crear presupuesto con 2 trabajos (fijo y por horas)
→ revisar desglose
→ guardar (snapshots)
→ enviar → enlace público → aceptar
→ convertir en trabajo (snapshot de medidas)
→ finalizar → resultado real en histórico
```

## Acceptance
- Mapear cada REQ-001..REQ-026 y NFR-001..NFR-007 al menos a un criterio verificable.
- SPEC-001: AC-001..AC-008 ya definidos; la fórmula se congela cuando la clienta testing la valide.
