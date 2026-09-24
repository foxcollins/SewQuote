# Design — SewQuote

Base visual: prototipo Stitch en `docs/stitch_sewquote_atelier_management_saas/` (solo lo necesario, adaptado a los specs aprobados).

Fuentes del prototipo:
- Design system: `atelier_craft_tech/DESIGN.md` (claro) y `atelier_craft_tech_dark_mode_adaptation/DESIGN.md` (oscuro)
- Pantallas: login, dashboard, detalle de presupuesto, clientes/medidas, vista pública (+ variantes dark)
- **Desktop (nuevas):** `sewquote_dashboard_operativo_desktop_modo_oscuro`, `sewquote_detalle_de_presupuesto_desktop_modo_oscuro`, `sewquote_clientes_y_medidas_desktop_modo_oscuro`, `sewquote_vista_p_blica_del_cliente_desktop`

## Principio de adaptación
El prototipo es **base**, no especificación literal. Prioridad de verdad: `requirements.md` + `specs/*`. Si el mock muestra algo fuera de alcance, **no se construye**.

## Design tokens (adaptados)

### Color — Light (Atelier Craft Tech)
| Rol | Hex | Uso |
|-----|-----|-----|
| primary (terracotta) | `#C85A32` | CTAs, totales clave, activo |
| secondary (loden) | `#2C3E35` | acentos estructurales, badges aprobados |
| tertiary (amber) | `#C98A58` / warning `#B8621B` | pendientes, medidas antiguas, urgencia |
| canvas | `#FAF8F5` | fondo app |
| surface | `#FFFFFF` | cards, inputs |
| surface-2 | `#F3EFEA` | headers de tabla, chips, footer de total |
| border | `#E5DFD7` | hairline 1px |
| ink | `#1C1D1F` | texto principal |
| success | `#2D5A43` / bg `#EBF3EE` | entregado, aprobado |
| error | `#A83232` / bg `#FBEAEA` | atrasos, urgent, rechazado |
| draft | `#6D5D53` / bg `#F0ECE9` | borrador |

### Color — Dark (opcional en esta versión)
Mismos roles con tokens del DESIGN dark: canvas `#161618`, card `#1E1E22`, elevated `#26262B`, border `#333238`, ink `#EDE8E1`, primary `#C85A32` / focus `#E07148`.

**Alcance:** light first; dark mode con tokens ya definidos = **incluido si no retrasa** (mocks dark existen). Si hay que recortar, light es obligatorio.

### Tipografía
| Fuente | Rol |
|--------|-----|
| **Newsreader** | display, títulos de página, totales hero |
| **Plus Jakarta Sans** | body, forms, nav, labels |
| **JetBrains Mono** (`metric-md/lg`) | medidas, dinero, columnas numéricas, `#001` |

Escala clave: `display-lg`, `headline-lg/md/sm`, `title-md`, `body-lg/md/sm`, `label-md/sm`, `metric-md/lg` (ver DESIGN.md frontmatter).

### Forma y spacing
- Radius: cards/botones `6px` (0.375rem); chips/badges `4px`; sheets `8–12px` top.
- Grid 8pt; mobile margin/gutter `16px`.
- Touch target mínimo **44px**.
- Sombras suaves de papel (light) o bordes hairline (dark); sin shadow pesada.

### Fondos y elevación (light)
- L0 canvas `#FAF8F5`
- L1 card `#FFF` + border `#E5DFD7` + shadow sutil
- L2 hover/interactive
- L3 modal/sheet + blur backdrop

## Pantallas del prototipo → alcance SewQuote

| Pantalla prototipo | Archivo | ¿Se usa? | Adaptación |
|--------------------|---------|----------|------------|
| Login/registro | `sewquote_login_y_registro` | **Sí** | Ver reglas abajo |
| Login dark | `sewquote_login_y_registro_modo_oscuro` | Sí (dark) | tokens dark |
| Dashboard operativo | `sewquote_dashboard_operativo` | **Sí** | recortar a nuestros datos |
| Dashboard dark | `sewquote_dashboard_operativo_modo_oscuro` | Sí (dark) | — |
| Detalle presupuesto + cálculo | `sewquote_detalle_de_presupuesto_y_c_lculo` | **Sí — pantalla núcleo** | alinear a SPEC-001/003 |
| Detalle dark | `sewquote_detalle_de_presupuesto_modo_oscuro` | Sí (dark) | — |
| Clientes + personas + medidas | `sewquote_clientes_personas_y_medidas` | **Sí** | persona ≠ cliente (SPEC-005/007) |
| Vista pública cliente | `sewquote_vista_p_blica_del_cliente` | **Sí** | alinear a SPEC-004 (aprobar/rechazar/sugerir) |
| Dashboard desktop dark | `sewquote_dashboard_operativo_desktop_modo_oscuro` | **Sí** | sidebar + KPIs + 2 col |
| Detalle presupuesto desktop | `sewquote_detalle_de_presupuesto_desktop_modo_oscuro` | **Sí** | 2 col: trabajos + cálculo sticky |
| Clientes desktop | `sewquote_clientes_y_medidas_desktop_modo_oscuro` | **Sí** | lista + panel detalle |
| Vista pública desktop | `sewquote_vista_p_blica_del_cliente_desktop` | **Sí** | 2 col: trabajos + resumen/CTA |

## Layout desktop (>= lg)

- **Sidebar fija** (~240px): logo, CTA “+ Nuevo presupuesto”, nav (Dashboard, Presupuestos, Trabajos, Clientes, Catálogo, Configuración), salir al pie.
- **Topbar** sticky: búsqueda, chip tenant, ajustes, CTA “+ Nuevo encargo”.
- **Contenido** `max-w-6xl` centrado (sin topbar/sidebar en mobile: header compacto + bottom nav).
- **Detalle presupuesto / vista pública:** grid `1fr + 340–380px`; columna derecha sticky con cálculo, total y acciones.
- **Listados** (quotes, works, clients): cards en grid 1/2/3 columnas según breakpoint.
- **Dashboard:** KPIs en 4 col (`xl`), accesos + panel lateral.
- **Sin inventar features del mock** (IA, calendario, alertas operativas fake) — solo layout y jerarquía visual.

No hay mock de: listado de trabajos/work orders, catálogo servicios/materiales, config tenant, historial de precios → **se diseñan con mismos tokens** siguiendo specs (no inventar otro estilo).

## Qué se adapta del mock (mantener)

1. **Marca SewQuote** + tono “atelier craft”.
2. **Badge de estado** del presupuesto (ENVIADO, etc.) → mapear a nuestros estados: `draft/sent/accepted/rejected/expired/cancelled`.
3. **Caducidad visible** (“Válido hasta”, “Vence en 24h”) → SPEC-003.
4. **Selector de versión** (v2 – R$…, v1) → `quote_versions` + `#001`.
5. **Trabajos dentro del presupuesto** con categoría (Confección, Ajuste) → `quote_jobs`.
6. **Persona/ portadora** por job → SPEC-005.
7. **Medidas snapshot** en el presupuesto (Busto/Cintura/Cadera en mono) → snapshot + advertencia antigüedad **> 1 mes** (el mock dice 8 meses: se muestra, es correcto).
8. **Materiales congelados** con cantidad × precio → `quote_materials`.
9. **Mano de obra** horas × tarifa y precio fijo → `labor_method`.
10. **Cálculo transparente** (materiales + MO + subtotal + margen %) → desglose SPEC-001.
11. **CTA flotante** “Nuevo presupuesto” en mobile.
12. **Bottom nav** mobile → adaptar a módulos reales (ver abajo).
13. **Vista pública**: total, vigencia, botón grande APROBAR → ampliar a APROBAR / RECHAZAR / SUGERIR (SPEC-004).

## Qué se quita o cambia del mock (fuera o distinto)

| Del prototipo | Acción | Motivo |
|---------------|--------|--------|
| Login “Google” | **Quitar** o diferir | Auth email/password en SPEC-009 |
| Botón **WhatsApp** (API / integración) en presupuesto | **Quitar** | WhatsApp oficial = V1 |
| Compartir **wa.me** (deep-link) en presupuesto `sent` | **Incluir** | SPEC-004 / ADR-005; solo si cliente tiene número |
| Idioma **EN** en topbar | **Quitar** | Solo **ES / PT** (SPEC-002) |
| “Impuestos y materiales / Incluido” | **Quitar** | Sin impuestos en specs |
| Nav: *Fittings, New Spec, Atelier Clients* | **Reemplazar** | Ver nav real abajo |
| “Copia de seguridad automática / WhatsApp integrado” en login | **Quitar** copy | No prometer API oficial fuera de alcance |
| Régimen tipo “Bespoke Approved” inglés | **i18n** ES/PT | Textos de dominio en catálogo |
| Métricas dashboard con R$ hardcodeado | formatear por **currency tenant** | NFR-004 |
| “Asistente IA” activo en dashboard | **Ocultar/sección V2** | IA fuera del MVP actual |
| Address / phone en vista pública | **ocultos por defecto** | SPEC-004 / security |
| PDF / share nativo mock | fuera | PDF = V1 |

## Navegación (adaptada a módulos reales)

**Mobile bottom bar (5):**
1. Dashboard  
2. Presupuestos  
3. **+ Nuevo** (CTA central)  
4. Trabajos  
5. Clientes  
*(Catálogo y Configuración en “Más” o secondary drawer — si solo caben 4, Má s agrupa catálogo/config.)*

**Desktop:** sidebar con Dashboard, Presupuestos, Trabajos, Clientes, Catálogo, Configuración (implementado en `app-shell.tsx`, `lg:` breakpoints).

## Pantillas clave a implementar (orden sugerido)

1. **Login/registro** (email) — tokens light  
2. **Shell app** + bottom nav/sidebar  
3. **Lista + detalle de presupuesto** (pantalla núcleo: jobs, medidas, desglose, estados, versiones, caducidad)  
4. **Form nuevo presupuesto** (mínimo pasos, mobile-first)  
5. **Clientes / personas / medidas**  
6. **Vista pública** `/orcamento/[token]`  
7. **Trabajos** (estados del SPEC-006)  
8. **Catálogo** (servicios, materiales + historial de precios)  
9. **Configuración tenant** (tarifa, margen, i18n, categorías, umbral 1 mes)  
10. Dashboard (solo con datos reales de MVP: entregas, por aprobar, atrasados, presupuestos recientes)

## Reglas de UI ligadas a specs
- Dinero y medidas → `JetBrains Mono` + `Intl` (moneda/locale tenant).
- IDs de presupuesto → `#001` en mono.
- Adv. medidas antigüedad **> 1 mes** en ámbar + acción Confirmar.
- Enlace público: 3 acciones (aprobar / rechazar / sugerir nota) si `sent` y no vencido; si `expired`, solo lectura + aviso.
- Acciones tenant en quote `sent`: “Enviar por WhatsApp” (`wa.me` + enlace) solo si `clients.whatsapp`/`phone` con valor; si no, oculto o disabled + hint. Junto a “Abrir página pública”.
- Estados quote/work = mismos textos/badges en ES y PT (claves i18n).
- Snapshot de materiales y medidas: etiqueta visual “Congelado / Snapshot” como en el mock.
- i18n: selector ES/PT en login (como el mock sin EN).

## Fuera de esta base
- Componentes de inventario, pagos, agenda, chat WhatsApp embebido.
- Reescrever el design system completo: **usar tokens existentes** del prototipo salvo conflicto con NFR-004/i18n.
