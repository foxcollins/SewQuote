# Data Model — SewQuote

Estado: revisado contra `requirements.md` (aprobado) y `architecture.md` (aprobado).

Principio: todo dato de negocio pertenece a un `tenant_id` y está cubierto por RLS. Snapshots para reproducibilidad histórica. Nunca sobrescribir historial de precios.

## Entidades

### tenants
- id
- name
- country
- currency
- timezone
- locale
- hourly_rate
- default_margin_percent
- default_waste_percent
- created_at

### profiles
- id (= auth.users.id)
- tenant_id
- name
- role
- created_at

### clients
- id
- tenant_id
- name
- phone
- whatsapp
- email
- address
- notes
- archived_at
- created_at
- updated_at

### persons  (persona destinataria — REQ-004)
- id
- tenant_id
- client_id (opcional: a quién se le facturó/agendó; puede existir sin cliente en catálogo)
- name
- notes
- created_at
- updated_at

Regla: el cliente contrata; la persona usa la prenda. No fusionar en una sola tabla.

### job_categories  (REQ-010)
- id
- tenant_id
- name (ej. Reparación, Ajuste, Confección, Personalizado)
- active
- created_at

### services
- id
- tenant_id
- name
- category
- base_price (opcional)
- estimated_minutes
- unit
- active
- created_at
- updated_at

### materials
- id
- tenant_id
- name
- category
- unit
- active
- created_at

### material_prices  (historial inmutable — REQ-008)
- id
- tenant_id
- material_id
- unit_price
- currency
- valid_from
- created_at

Nunca UPDATE/DELETE de precios vigentes pasados: siempre INSERT con nueva `valid_from`.

### quotes  (cabecera — REQ-009, REQ-016..018)
- id
- tenant_id
- client_id
- quote_number (int, correlativo **por tenant**: #001, #002…)
- status: draft | sent | accepted | rejected | expired | cancelled
- version_number (número de versión formal actual)
- margin_percent (override opcional; null = default del tenant)
- currency
- subtotal_materials
- subtotal_labor
- complexity_amount
- urgency_amount
- other_costs_amount
- margin_amount
- suggested_price
- final_price
- override_reason
- valid_until (fecha de caducidad — REQ-017)
- notes
- public_token (enlace público — REQ-026, incluido)
- accepted_at
- rejected_at
- created_at
- updated_at

Reglas:
- draft editable; accepted no editable directamente (REQ-016).
- vencido: status → expired por marcado, **no** recálculo automático (REQ-017).
- Recalcular expired → snapshots nuevos + versión + **status = sent** (aprobado).

### quote_jobs  (trabajos/piezas del presupuesto — REQ-009, REQ-010, REQ-014)
- id
- tenant_id
- quote_id
- job_category_id
- person_id (persona destinataria, opcional)
- garment_type / garment_description
- labor_method: fixed | hourly
- labor_fixed_price (si fixed)
- estimated_minutes (si hourly — tarifa se resuelve del tenant al calcular)
- complexity: low | medium | high | very_high
- urgency: normal | urgent | very_urgent
- measurements_snapshot (jsonb, nullable — REQ-025)
- measurements_source_id (reference a measurement_sets/persons.measures, nullable)
- notes
- sort_order
- created_at

Un presupuesto = N quote_jobs. Cada job tiene categoría propia.

### quote_items  (servicios por job)
- id
- tenant_id
- quote_job_id
- service_id
- description_snapshot
- quantity
- estimated_minutes
- unit_price_snapshot
- total

### quote_materials  (snapshots de materiales por job — REQ-012)
- id
- tenant_id
- quote_job_id
- material_id
- material_name_snapshot
- quantity
- unit_snapshot
- unit_price_snapshot
- waste_percent
- total

Regla crítica: al guardar el presupuesto, nombre/unidad/precio quedan congelados. No depender de consultas futuras a `material_prices`.

### quote_versions  (REQ-018)
- id
- tenant_id
- quote_id
- version_number
- reason: sent | accepted | recalculated_after_expiry
- suggested_price
- final_price
- payload_snapshot (jsonb: jobs + items + materials de esa versión)
- created_at

Solo en modificaciones formales; no por edición de borrador.

### work_orders  (REQ-019..022 — ejecución; ADR-006 aceptado)
- id
- tenant_id
- quote_id  (vínculo obligatorio; **`Quote 1 ─ N WorkOrders`**; MVP crea 1 OT al convertir; índice único **parcial** `where status <> 'cancelled'`)
- quote_version_number
- status: accepted | waiting_garment | in_production | fitting | adjustments | ready | delivered | cancelled
  (roll-up de la OT; detalle de producción por pieza en `work_order_items`)
- started_at
- completed_at
- actual_minutes
- actual_price
- measurements_snapshot (jsonb, nullable — copia/uso real, REQ-025)
- notes
- created_at
- updated_at

Regla (ADR-006): no añadir a esta tabla `payment_status`, `delivery_status` ni flags de presupuesto.

### work_order_items  (piezas en producción — ADR-006 aceptado)
- id
- tenant_id
- work_order_id
- quote_job_id  (pieza origen; `quote_jobs 1 ─ N work_order_items`; única por OT+job)
- status  (MVP: mismos valores que la OT; vocabulario fino de item = DECISIÓN PENDIENTE en SPEC-006)
- measurements_snapshot (jsonb — copia desde el job al convertir)
- started_at / completed_at (nullable)
- notes
- sort_order
- created_at
- updated_at

Al convertir la quote aceptada: 1 OT + 1 item por `quote_job`. Medidas solo desde snapshot; no releer personas.

### work_materials  (materiales realmente usados)
- id
- tenant_id
- work_order_id
- material_id
- quantity
- unit_price
- total

### measurement_sets  (historial de medidas por persona — REQ-025, incluida en esta versión)
- id
- tenant_id
- person_id
- label (ej. "Medidas 2026-09")
- recorded_at
- notes
- created_at

### measurement_values
- id
- measurement_set_id
- name (busto, cintura, cadera, largo, manga, hombro, cuello…)
- value
- unit

Regla: medidas viven en la **persona**, con historial. El trabajo guarda **snapshot** + referencia al `measurement_set` de origen. Cambios posteriores no alteran trabajos históricos.

Umbral de "medidas antiguas" para advertencia: **1 mes** (default; configurable en tenant).

### public_comments  (sugerencias del cliente en el enlace — SPEC-004)
- id
- tenant_id
- quote_id
- body (texto, máx. ~1000)
- author_name (opcional: nombre que escribe el cliente)
- created_at
- read_at (cuando el tenant lo revisa)

No cambia el estado de la quote; solo agrega la sugerencia.

## Snapshot de precios — ejemplo operativo

```text
22/09 → material_prices: Satén = 41
Quote A → quote_materials.unit_price_snapshot = 41

25/09 → material_prices: Satén = 45  (nuevo INSERT)

Quote A → sigue 41
Quote B → snapshot 45
```

## Estados

### quotes (comercial)
```text
draft → sent → accepted
             ↘ rejected
             ↘ expired (por fecha, marcado)
                    ↘ recalcular manual → sent (nueva versión)
             ↘ cancelled
```

accepted no se edita: cambios → nueva versión (o nuevo presupuesto según regla de negocio en REQ-016/018).
La quote **no** lleva estados de producción ni de pago (ADR-006).

### work_orders (ejecución — roll-up; detalle en work_order_items)
```text
accepted → waiting_garment → in_production → fitting → adjustments
         → ready → delivered
cualquiera activo → cancelled
```

```text
quotes.quote_jobs (pieza cotizada) 1 ─ N work_order_items
quotes 1 ─ N work_orders (MVP: 1 al convertir)
```

## Multi-tenancy
- Todas las tablas de negocio: `tenant_id` + RLS.
- `material_prices`, `quote_*`, `work_*` heredan tenant directamente (no solo por join) para políticas simples.
- `public_token` (si se construye): acceso por token opaco sin sesión, mínimo expuesto (solo quote aprobada/enviada, sin datos de otros tenants ni PII innecesaria).

## Índices sugeridos (MVP)
- quotes (tenant_id, status), quotes (tenant_id, valid_until)
- quote_jobs (quote_id)
- material_prices (material_id, valid_from DESC)
- work_orders (tenant_id, status)
- work_orders (quote_id) **unique parcial** `where status <> 'cancelled'`
- work_order_items (work_order_id)
- measurement_sets (person_id, recorded_at DESC)

## Fuera del modelo (MVP)
- Pagos, inventario/stock, gastos, agenda, notificaciones WhatsApp, analytics V2.
