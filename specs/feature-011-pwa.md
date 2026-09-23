# SPEC-011 — PWA y experiencia mobile-first

## Objetivo
SewQuote debe ser una PWA responsive: instalable en celular/escritorio, usable en taller con poca fricción.

## Input
- Manifest PWA, service worker, icons.
- Breakpoints mobile-first (Tailwind).
- Cámara/upload de fotos: **fuera** de esta versión (fotos = V1); solo inputs de formularios.

## Reglas
1. Responsive mobile-first: creación de presupuesto con mínimo de pasos en móvil (NFR-006).
2. Visuales según **`design.md`** (tokens del prototipo Stitch adaptados): light obligatorio; dark con tokens existentes si no retrasa.
3. Instalable: manifest + icons + scope correcto; funciona en HTTPS (Vercel).
4. Navegación: bottom nav mobile (Dashboard, Presupuestos, +Nuevo, Trabajos, Clientes; catálogo/config en Más) o equivalente en `design.md`.
5. Formularios con validación inline y errores claros en ES/PT (SPEC-002).
6. Offline completo: **fuera** de esta versión (futuro). Service worker: cache de assets estáticos aceptable; datos siempre red+auth.
7. Enlace público debe renderizar bien en WebView de WhatsApp (mobile-first crítico).
8. Accesibilidad básica: contraste, targets táctiles (≥44px), labels de formulario.

## DECISIÓN PENDIENTE
No aplica (offline y fotos ya marcados fuera de esta versión).

## Acceptance Criteria

### AC-001
Dado un móvil, Cuando abre la app, Entonces las pantallas principales son usables sin scroll horizontal y con targets táctiles suficientes.

### AC-002
Dado Chrome/Android, Cuando usa "Instalar app", Entonces se instala con icono y abre en standalone.

### AC-003
Dado el enlace público en el navegador del cliente (móvil), Cuando carga, Entonces ve el presupuesto legible y puede pulsar APROBAR cómodamente.

### AC-004
Dado un formulario de presupuesto, Cuando envía datos inválidos, Entonces ve errores en el idioma activo sin perder el borrador cargado.

### AC-005
Dado un usuario en desktop, Cuando usa la app, Entonces el layout se adapta (no solo mobile).
