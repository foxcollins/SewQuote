# API / Contracts — SewQuote

Estado: revisado contra `requirements.md` y `data-model.md` aprobados. Medidas y enlace público incluidos en esta versión.

## Principio

Las operaciones de negocio críticas se ejecutan con lógica centralizada (Server Actions / Edge Functions). El servidor resuelve precios y configuración autorizados: **no confiar en valores monetarios enviados por el cliente** para operaciones definitivas.

Auth: sesión Supabase. Toda operación mutante valida `tenant_id` del usuario autenticado (RLS + validación server-side).

## Contratos principales

### calculateQuote

Input conceptual:

```json
{
  "clientId": "uuid",
  "jobs": [
    {
      "jobCategoryId": "uuid",
      "personId": "uuid|null",
      "garmentType": "dress",
      "laborMethod": "fixed|hourly",
      "laborFixedPrice": 250,
      "estimatedMinutes": 480,
      "complexity": "medium",
      "urgency": "normal",
      "services": [
        { "serviceId": "uuid", "quantity": 1 }
      ],
      "materials": [
        { "materialId": "uuid", "quantity": 3.2 }
      ],
      "measurementSetId": "uuid|null"
    }
  ],
  "marginPercent": 40,
  "otherCosts": 0
}
```

Output conceptual:

```json
{
  "jobs": [
    {
      "materials": 144.32,
      "labor": 240,
      "complexity": 0,
      "urgency": 0,
      "margin": 0,
      "suggestedPrice": 0
    }
  ],
  "materials": 123,
  "labor": 80,
  "complexity": 16,
  "urgency": 0,
  "margin": 43.8,
  "suggestedPrice": 262.8
}
```

Los nombres exactos y fórmula definitiva se fijan en SPEC-001 (pendiente de validación con la clienta testing).

### createQuote / updateQuote
- Solo en `status = draft`.
- Resuelve precios vigentes de materiales y guarda snapshots (`quote_materials`, `quote_items`).
- Genera/actualiza `quote_jobs`.
- No crea versión formal en borrador (REQ-018).

### recalculateQuoteAfterExpiry
- Solo si `status = expired` o `valid_until < hoy` (marcado expired primero).
- Recalcula con precios actuales.
- **Crea nueva versión** en `quote_versions` (`reason = recalculated_after_expiry`).
- Estado final: **`sent`** (reactivación aprobada).
- Nunca recalculo automático en background (REQ-017).

### sendQuote
- draft → sent.
- Regenera `public_token` si no existe o si se decide rotar.
- Crea entrada de versión (`reason = sent`) con snapshot del total vigente.

### acceptQuote (público o tenant)
- sent → accepted.
- Registra `accepted_at`, crea versión (`reason = accepted`).
- A partir de aquí: sin edición directa del contenido (REQ-016).

### rejectQuote / cancelQuote / expireQuote
- Transiciones a rejected / cancelled / expired.
- `expireQuote` puede ejecutarse bajo demanda o por job ligero al listar; marca estado, **no** modifica montos.

### convertQuoteToWorkOrder
- Requiere `status = accepted`.
- Crea `work_orders` con snapshot de versión (`quote_version_number`).
- Copia `measurements_snapshot` desde `quote_jobs` si existen.

### updateWorkOrder
- Transiciones válidas de estados de trabajo (REQ-020).
- Actualiza `actual_minutes`, `actual_price`, `notes` según estado.

### completeWorkOrder
- → ready / delivered.
- Conserva resultado real para histórico (REQ-021, REQ-022).

## Catálogo y tenant

### upsertMaterialPrice
- INSERT en `material_prices` con `valid_from`.
- Prohibido modificar el registro histórico anterior.

### CRUD services / materials / job_categories / clients / persons
- Estándar, scoped por tenant, con archivado soft donde aplique (`archived_at`, `active`).

## Medidas (REQ-025)

### createMeasurementSet / updateMeasurementSet
- Set por `person_id` con lista de `measurement_values`.
- Las medidas anteriores no se reescriben: editar set reciente o crear set nuevo (histórico por fecha).

### suggestMeasurements (lectura)
- Devuelve el set más reciente de la persona + `recorded_at` para la advertencia de antigüedad.

### snapshot al guardar quote/work
- Al persistir job o work_order: copiar valores al `measurements_snapshot` + `measurements_source_id`.

## Enlace público (REQ-026)

### GET public quote
- Ruta: `/orcamento/[token]` (o equivalente i18n).
- Input: `public_token` opaco.
- Devuelve mínimos: `quote_number` (#001), estado, caducidad, cliente/persona (nombre), trabajos, materiales relevantes, desglose/total, observaciones.
- Sin sesión; sin exponer otros tenants; teléfono/email ocultos por defecto.

### POST public accept
- Input: `public_token`.
- Valida que quote esté `sent` y no vencida.
- Ejecuta `acceptQuote`.
- Respuesta: confirmación registrada; idempotente.

### POST public reject
- Input: `public_token`, nota opcional.
- Solo si `sent` y no vencida → `rejected` + `rejected_at`.
- Idempotente.

### POST public comment (sugerencia de cambios)
- Input: `public_token`, `body` (texto), `author_name` opcional.
- Crea fila en `public_comments`.
- **No** cambia el estado (sigue `sent`).
- El tenant ve las sugerencias en la ficha de la quote.

Seguridad: token de alta entropía, no enumerable; rate limit básico; no aceptar montos del cliente público.

## Operaciones (resumen)
- calculateQuote
- createQuote / updateQuote
- sendQuote
- acceptQuote / rejectQuote / cancelQuote / expireQuote
- recalculateQuoteAfterExpiry
- convertQuoteToWorkOrder
- updateWorkOrder / completeWorkOrder
- upsertMaterialPrice
- CRUD catalog/clients/persons/categories
- CRUD measurementSets
- getPublicQuote
- postPublicAccept / postPublicReject / postPublicComment
- (CRUDs anteriores)

## Regla
No confiar en valores monetarios enviados por el cliente para operaciones definitivas. El servidor debe resolver precios y configuración autorizados.
