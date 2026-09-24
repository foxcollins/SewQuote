# ADR-004 — Base de UI: prototipo Stitch + design.md

## Estado
Aceptado.

## Contexto
Existe un prototipo Stitch (`docs/stitch_sewquote_atelier_management_saas/`) con design system Atelier Craft Tech (light/dark) y pantallas de login, dashboard, detalle de presupuesto, clientes/medidas y vista pública. El producto SDD ya tiene specs; hace falta fijar cómo se usa el mock sin desviarse del alcance.

## Decisión
1. El prototipo es la **base visual de referencia**, no especificación funcional.
2. Fuente de verdad de UI/alcance: `design.md` + `requirements.md` + `specs/*`. En conflicto, gana SDD.
3. Design tokens del Atelier Craft Tech (colores, tipografía, radius, spacing) se implementan en Tailwind/CSS variables en el MVP.
4. Pantallas a tomar del mock (adaptadas): login/registro, shell+nav, lista/detalle presupuesto, form nuevo presupuesto, clientes/personas/medidas, vista pública, trabajos, catálogo, config, dashboard.
5. Se omiten del mock: Google login, botón WhatsApp de **integración/API**, idioma EN, impuestos, IA activa en dashboard, copy de features fuera de MVP. *(Share `wa.me` del presupuesto se incorpora luego por ADR-005 / SPEC-004.)*
6. Light mode obligatorio; dark mode con tokens existentes si no retrasa el MVP.
7. i18n ES/PT desde el inicio (SPEC-002); moneda/fechas vía `Intl` (NFR-004).

## Consecuencias positivas
- UI coherente desde el primer commit sin diseñar desde cero.
- Tokens ya probados en mocks light/dark.
- Menos debate visual durante validación con la clienta testing.

## Consecuencias
- Habrá que traducir/mapear badges y textos del mock a claves i18n.
- Pantallas sin mock (catálogo, config, work orders) se construyen con los mismos tokens.
- Si el prototipo y un AC chocan, se corrige la UI, no el AC.

## Alternativas descartadas
### Diseñar UI desde cero
Mayor costo y retraso sin necesidad durante la validación.

### Copiar el HTML del mock tal cual
Incluye alcance fuera de specs (Google, WhatsApp API, EN) y no integra Next/i18n/RLS.

## Condiciones de revisión
- Cambio mayor de marca o design system.
- Decisión de dark mode como obligatorio.
- Incorporación de component library pesada (shadcn/ui u otra) que sustituya tokens.
