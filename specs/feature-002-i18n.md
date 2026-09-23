# SPEC-002 — Multi-idioma (ES / PT-BR)

## Objetivo
La app **SewQuote** debe soportar español y portugués brasileño desde esta versión, sin hardcodear textos de dominio, moneda, fechas ni números en el código. Idioma configurable por tenant y ajustable en la UI.

## Input
- Idioma seleccionado del usuario/tenant (código BCP-47: `es`, `pt-BR`).
- Claves de traducción del dominio (catálogo i18n).
- Valores regionales del tenant: `currency`, `timezone`, `locale`.

## Reglas
1. Idiomas iniciales soportados: **es** y **pt-BR**. Arquitectura abierta a más idiomas sin rediseño.
2. Fuente de verdad de textos de UI y dominio: archivos de traducción (ej. `es.json`, `pt-BR.json`), no strings literales en componentes.
3. Claves de traducción estables en inglés o snake_case (ej. `quotes.status.draft`); el valor cambia por idioma.
4. Idioma de la sesión/usuario tiene prioridad sobre el del tenant en UI; el tenant aporta default para vistas públicas si el visitante no eligió.
5. Vistas públicas (enlace de presupuesto): respetan idioma por query/cookie/`Accept-Language` con fallback al tenant.
6. **Moneda**: formatear con `Intl.NumberFormat` usando `currency` del tenant + locale activo. No hardcodear `BRL`, `R$` ni `pt-BR` como único formato.
7. **Fechas/horas**: `Intl.DateTimeFormat` con `timezone` y locale del tenant/usuario. No hardcodear `dd/mm/yyyy` ni UTC.
8. **Números/cantidades** (medidas, horas): locale activo (coma/punto decimal).
9. Estados de presupuesto/trabajo y nombres de categorías del catálogo: traducibles si son del sistema; textos libres del tenant (nombres de servicios, materiales, notas) **no** se traducen automáticamente — son datos.
10. Falta de clave: fallback a idioma por defecto del tenant y log de clave faltante en dev; no romper la UI.
11. Cambio de idioma en runtime sin recargar datos del servidor.
12. Emails/notificaciones futuras (fuera de alcance actual) deberán usar el mismo catálogo de claves.

## Fuera de alcance
- Traducción automática de contenido escrito por el usuario.
- Más de dos idiomas en esta versión.
- Traducción de IA de notas/libres.

## DECISIÓN PENDIENTE
No aplica. Alcance aprobado: ES + PT-BR en esta versión.

## Acceptance Criteria

### AC-001
Dado un usuario con idioma `es`, Cuando abre la app, Entonces todos los textos de UI del dominio se muestran en español sin literales en portugués residual en pantallas principales.

### AC-002
Dado un usuario con idioma `pt-BR`, Cuando abre la app, Entonces todos los textos de UI del dominio se muestran en portugués brasileño.

### AC-003
Dado un tenant con moneda configurable, Cuando se muestra un precio, Entonces el símbolo y formato siguen la moneda del tenant y el locale activo (ej. `R$ 1.234,56` en pt-BR y formato local en es), sin valor `BRL` hardcodeado en el código fuente.

### AC-004
Dado un presupuesto con fecha de caducidad, Cuando se renderiza en ES y en PT-BR, Entonces la fecha se formatea con timezone y locale del tenant en ambos idiomas.

### AC-004b
Dado el enlace público de un presupuesto, Cuando se abre sin sesión con `Accept-Language: pt`, Entonces la vista pública se muestra en PT-BR con fallback al idioma del tenant si no hay match.

### AC-005
Dado un string de UI sin clave de traducción, Cuando se renderiza, Entonces se usa el fallback del tenant y la UI no se rompe.

### AC-006
Dado un nombre de material o nota escrita por la profesional, Cuando se cambia el idioma de la app, Entonces esos datos libres no se traducen ni se alteran.

### AC-007
Dado el código fuente, Cuando se busca un literal de texto de UI en componentes principales (presupuestos, clientes, login), Entonces no se encuentran strings de dominio fuera del catálogo i18n.

### AC-008
Dado un usuario autenticado, Cuando cambia el idioma en configuración o selector, Entonces la UI aplica el nuevo idioma en la sesión actual y persiste la preferencia.
