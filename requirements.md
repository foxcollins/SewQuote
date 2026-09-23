# Requirements

Estado: aprobado. Alineado con `product.md` (SewQuote) y `Project_context.md`.

**Nombre de la app: SewQuote.**

## Requisitos funcionales

### REQ-001 Autenticación
El sistema debe permitir registro, login, logout y recuperación de acceso.

### REQ-002 Negocio/Tenant
Cada usuario debe pertenecer a un tenant/negocio. Los datos de un tenant no deben ser visibles para otro. Aislamiento por RLS desde el MVP.

### REQ-003 Clientes
Crear, editar, consultar y archivar clientes con: nombre, teléfono, WhatsApp, email, dirección y notas. Asociar presupuestos y trabajos.

### REQ-004 Persona destinataria
Separar **cliente** (quien contrata) de **persona destinataria** de la prenda (quien la usa). Un presupuesto/trabajo debe poder referenciar una persona destinataria distinta del cliente.

### REQ-005 Prendas
Una cotización debe poder identificar la prenda: vestido, pantalón, camisa, blusa, falda, chaqueta, traje, uniforme u otra.

### REQ-006 Servicios
El usuario puede crear y modificar servicios con nombre, categoría, precio base opcional, tiempo estimado, unidad y estado.

### REQ-007 Materiales
El usuario puede crear materiales con nombre, categoría y unidad. El sistema no interpreta la naturaleza del material: lo define el tenant.

### REQ-008 Historial de precios
Cada cambio de precio de material debe crear un registro histórico con fecha de vigencia. Nunca se debe sobrescribir el historial.

### REQ-009 Presupuestos
El usuario puede crear un presupuesto con cliente, fecha de caducidad, notas y **uno o varios trabajos/piezas**. Cada trabajo incluye: categoría, prenda descripción/tipo, persona destinataria opcional, servicios, materiales, cantidades, complejidad, urgencia y notas.

### REQ-010 Categorías de trabajo
Cada trabajo dentro de un presupuesto tiene su propia categoría (ej. reparación, ajuste, confección, personalizado). Un presupuesto no asume una única categoría ni una sola prenda. El catálogo de categorías es configurable por tenant.

### REQ-011 Cálculo
El sistema debe producir un desglose verificable del precio sugerido (materiales, mano de obra, complejidad, urgencia, margen). Motor determinístico; mismo input + configuración → mismo resultado.

### REQ-012 Congelación
Una vez guardado un presupuesto, los precios de materiales utilizados deben quedar como snapshot (nombre, unidad, precio unitario, cantidad, desperdicio, total). Cambios posteriores del catálogo no alteran presupuestos guardados.

### REQ-013 Override
El profesional puede modificar el precio sugerido y registrar precio final y motivo opcional. El precio sugerido original se conserva.

### REQ-014 Mano de obra
Soportar dos métodos de mano de obra por trabajo/presupuesto: **precio fijo** y **por horas** (horas × tarifa horaria del tenant).

### REQ-015 Margen
Margen por defecto configurable por tenant; cada presupuesto puede usar un margen distinto (el del tenant es default, no obligatorio).

### REQ-016 Estados de presupuesto
Borrador, enviado, aprobado, rechazado, vencido, cancelado. Mientras sea borrador es editable. Una vez aprobado **no** se edita directamente: cualquier cambio posterior exige nueva versión.

### REQ-017 Caducidad
Todo presupuesto tiene fecha de caducidad. Al vencer: marcar como vencido e indicar que los precios pueden haber cambiado; **no recalcular automáticamente**. El usuario puede actualizar/recalcular manualmente con precios actuales, lo que genera una **nueva versión**.

### REQ-018 Versionado
Versionar presupuestos solo en modificaciones formales: envío, aprobación y recálculo por vencimiento. No crear versión por cada edición en borrador. Conservar historial de versiones (número y precio total).

### REQ-019 Orden de trabajo
Un presupuesto aprobado puede convertirse en orden/trabajo de producción.

### REQ-020 Estados de trabajo
accepted, waiting_garment, in_production, fitting, adjustments, ready, delivered, cancelled (flujo conceptual: aprobado → trabajo → en producción → listo → entregado).

### REQ-021 Resultado real
Registrar tiempo real, materiales realmente utilizados, precio final y observaciones.

### REQ-022 Historial
Los trabajos finalizados deben quedar disponibles para análisis futuro.

### REQ-023 PWA
La interfaz debe ser responsive e instalable como PWA.

### REQ-024 Configuración
Configurar moneda, idioma, zona horaria, tarifa horaria, margen, desperdicio, factores de complejidad, recargos de urgencia y categorías de trabajo.

### REQ-025 Medidas
Incluida en esta versión (aprobado por el usuario; alcance unificado MVP/V1):

- Historial de medidas por **persona** (no solo por cliente), con fecha.
- Cada trabajo guarda **snapshot** de las medidas realmente utilizadas + referencia al registro de origen.
- Sugerir medidas recientes al crear trabajo; advertir si son antiguas.

### REQ-026 Enlace público de aprobación
Incluida en esta versión (aprobado por el usuario; alcance unificado MVP/V1):

- Presupuesto compartible por enlace público (sin cuenta del cliente).
- Vista con cliente/persona, trabajos, materiales, total, caducidad y observaciones.
- Acciones: **aprobar**, **rechazar** (nota opcional) y **sugerir cambios** (campo de nota al tenant; no cambia el estado).
- Teléfono/email del cliente ocultos por defecto en la vista pública.

### REQ-027 UI / Design
La interfaz usa la base del prototipo adaptado en `design.md` (tokens Atelier Craft Tech light/dark, tipografías Newsreader / Plus Jakarta Sans / JetBrains Mono). Solo las pantallas y controles alineados a los specs de esta versión; ver `design.md` para altas y bajas respecto del mock.

## Requisitos no funcionales

### NFR-001 Seguridad
Usar Supabase Auth + RLS y validación server-side. Toda consulta/mutación limitada al tenant autenticado. El servidor resuelve precios y configuración; no confiar en valores monetarios enviados por el cliente.

### NFR-002 Consistencia
El mismo input debe producir el mismo resultado de cálculo.

### NFR-003 Auditabilidad
El sistema debe poder explicar cómo se obtuvo un precio. Registrar cambios relevantes: precio de material, precio final, aceptación/rechazo, modificación de trabajo.

### NFR-004 Internacionalización
No hardcodear BRL, formatos de fecha ni textos del dominio. Idiomas iniciales: español y portugués brasileño.

### NFR-005 Escalabilidad
La arquitectura debe permitir evolucionar de un MVP a SaaS multi-tenant sin rediseñar el dominio central.

### NFR-006 Usabilidad
Crear un presupuesto debe requerir el mínimo de pasos posible. Los campos avanzados deben poder ser opcionales.

### NFR-007 Costo de infraestructura
MVP en Vercel Hobby + Supabase Free (costo $0) con un cliente de revisión/testing. No incorporar servicios de pago sin aprobación. Ver ADR-003.
