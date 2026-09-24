# SPEC-004 — Enlace público: aprobación, rechazo y sugerencias

## Objetivo
Compartir un presupuesto con el cliente por link (WhatsApp u otro) sin cuenta en SewQuote; el cliente puede **aprobar**, **rechazar** o dejar una **nota de sugerencia/cambio** para el tenant.

## Input
- `public_token` de la quote (opaco, alta entropía).
- Quote en estado `sent`, con jobs, materiales, totales, `valid_until`, observaciones.
- Acciones públicas:
  - `POST accept`
  - `POST reject` (opcionalmente con nota)
  - `POST comment` (nota de sugerencia del cliente → tenant)
- Nota de sugerencia: texto libre, longitud máxima (propuesto 1000 chars).

## Reglas
1. Solo quotes **enviadas** generan/mantienen token vigente.
2. Ruta: `/orcamento/[token]` (o prefijo i18n). Token no enumerable; regenerable al reenviar.
3. Vista pública muestra: estado, caducidad, cliente/persona (nombre), jobs con categoría, materiales relevantes, desglose/total, observaciones del tenant.
4. **Teléfono/email del cliente ocultos por defecto.**
5. No exponer: notes internas del tenant, otros tenants, storage, service_role.
6. Tres acciones en la vista (cuando `sent` y no vencida):
   - **APROBAR** → `accepted` + versión `reason=accepted`.
   - **RECHAZAR** → `rejected` (con nota opcional).
   - **SUGERIR CAMBIOS** → campo de nota; guarda `public_comments` **sin** cambiar el estado (sigue `sent`).
7. Idempotencia: repetir APROBAR/RECHAZAR no rompe; doble rechazo estable.
8. Vencida: solo lectura + aviso; sin aceptar ni rechazar hasta recálculo del tenant (que reactiva a `sent`).
9. Sin Storage del público; sin montos enviados por el cliente.
10. Rate limit en GET/POST del token.
11. Notas de sugerencia: solo lectura para el tenant en su UI de la quote; no ejecutan cambios automáticos en el cálculo — la profesional decide.
12. **Compartir por WhatsApp (deep-link, no API):** en detalle de quote con token público, botón **“Enviar por WhatsApp”** que abre `https://wa.me/{telefono}?text={mensaje}` con mensaje precompuesto (saludo, `#NNN`, enlace público `/orcamento/[token]`, total opcional).
13. **Habilitación del botón:** solo si el cliente de la quote tiene `whatsapp` (o `phone` como fallback) no vacío. Sin número → botón **oculto o deshabilitado** con hint; no se abre `wa.me` sin destino.
14. El deep-link **no** es la integración oficial de WhatsApp (sin Business API, plantillas, webhooks ni envío automático). Eso sigue fuera del MVP (V1).
15. Tras enviar (`status=sent`) y con token, el botón de share es CTA junto a “Abrir página pública”. En `draft` no se muestra (aún no hay token vigente para el cliente).

## DECISIÓN PENDIENTE
No aplica. Aprobado: aprobar + rechazar + nota de sugerencia en el mismo enlace. **Share WhatsApp por wa.me (deep-link) con número del cliente: DECISIÓN ACEPTADA (opción A).**

## Acceptance Criteria

### AC-001
Dado un presupuesto `sent` con token, Cuando el cliente abre el link sin login, Entonces ve trabajos, total, caducidad y observaciones de esa quote.

### AC-002
Dado el enlace, Cuando carga con `Accept-Language: pt`, Entonces la UI está en PT-BR (fallback: tenant).

### AC-003
Dado el enlace, Cuando se muestra, Entonces no aparecen teléfono ni email del cliente por defecto ni datos de otras quotes.

### AC-004
Dado el presupuesto `sent` no vencido, Cuando pulsa APROBAR, Entonces pasa a `accepted` con fecha y versión de aprobación.

### AC-005
Dado el mismo link, Cuando pulsa APROBAR otra vez, Entonces es idempotente: sigue `accepted`.

### AC-006
Dado un presupuesto `expired`, Cuando abre el link, Entonces ve aviso de vencimiento y **no** puede aprobar ni rechazar.

### AC-007
Dado un token inexistente, Cuando hace GET/POST, Entonces 404/403 sin fuga de datos.

### AC-008
Dado el presupuesto `sent`, Cuando pulsa RECHAZAR, Entonces pasa a `rejected` y queda registrado con fecha.

### AC-009
Dado el presupuesto `sent`, Cuando envía una sugerencia ("¿Se puede bajar el largo 5 cm?"), Entonces se guarda la nota asociada a la quote, el estado **sigue `sent`**, y el tenant la ve en su panel de la quote.

### AC-010
Dado el tenant, Cuando revisa la quote, Entonces distingue acciones: aprobada / rechazada / con sugerencias pendientes de respuesta.

### AC-011
Dado un presupuesto `sent` con `public_token` y un cliente con `whatsapp` no vacío, Cuando el tenant pulsa “Enviar por WhatsApp”, Entonces se abre `wa.me` (o WhatsApp Web) con destino el número del cliente y un mensaje que incluye el enlace público de la quote.

### AC-012
Dado un presupuesto con cliente **sin** número WhatsApp/telefónico utilizable, Cuando se muestra la UI de acciones, Entonces el botón de compartir por WhatsApp no está habilitado (oculto o disabled con hint) y no se genera URL `wa.me` sin número.

### AC-013
Dado el mismo botón, Cuando se activa, Entonces **no** se invoca la API oficial de WhatsApp ni se registra envío automático: solo se abre el deep-link y la usuaria envía el mensaje manualmente.
