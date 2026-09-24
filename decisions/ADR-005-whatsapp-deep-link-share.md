# ADR-005 — Compartir presupuesto por WhatsApp (deep-link wa.me)

## Estado
Aceptado.

## Contexto
`product.md` / `design.md` / ADR-004 marcaban el botón WhatsApp del mock como fuera del MVP (asociado a “WhatsApp oficial”). El flujo real de la clienta es enviar el **enlace público** del presupuesto por WhatsApp de forma manual. SPEC-004 ya contempla compartir “por link (WhatsApp u otro)” pero no definía un CTA en la app del tenant.

## Decisión
1. **Incluir en el MVP** un botón “Enviar por WhatsApp” en el detalle de presupuesto que abra un **deep-link** `https://wa.me/{numero}?text={mensaje}` con mensaje precompuesto (saludo, `#NNN`, enlace `/orcamento/[token]`, total opcional).
2. **Condición:** el botón solo se habilita/muestra si el cliente de la quote tiene número WhatsApp (campo `whatsapp`; fallback aceptable `phone`). Sin número → oculto o disabled con hint; no se arma URL sin destino.
3. **No es integración oficial:** sin WhatsApp Business API, plantillas, webhooks, envío automático ni registro de “mensaje entregado”. El envío lo confirma la usuaria en WhatsApp.
4. “WhatsApp oficial” (API/notificaciones) sigue **fuera del MVP** → V1 (`product.md` §10).
5. Specs/UI de referencia: SPEC-004 reglas 12–15 + AC-011..013; `design.md` tabla de mock.

## Consecuencias positivas
- La profesional comparte el link en un tap, sin copiar/pegar.
- Cero costo de infraestructura y sin dependencia de Meta.
- Alineado con el problema de producto: “enviar por WS es manual y sin registro” (el registro lo aporta el token/estado `sent`, no el chat).

## Consecuencias
- Si el cliente no tiene número en la ficha, el CTA no aparece → hay que mantener `clients.whatsapp` actualizado.
- El deep-link depende del cliente de wa.me/WhatsApp Web (fuera de nuestro control).
- No hay métrica de “enviado por WS” en el sistema (aceptado).

## Alternativas descartadas
### Sin botón (status quo)
La usuaria copia “Abrir página pública” a mano; más fricción en el flujo principal.

### WhatsApp Business API / Cloud API
Costo, revisión de plantillas, spam risk y alcance V1 según `product.md`.

### Solo copiar link al portapapeles
Útil como complemento, pero no sustituye abrir el chat con el número ya puesto cuando existe.

## Condiciones de revisión
- Pasar a API oficial (mensajes automáticos al enviar quote) → nuevo ADR y sacar de V1/“fuera de MVP”.
- Cambio de UX: share nativo (`navigator.share`) además o en vez de wa.me.
