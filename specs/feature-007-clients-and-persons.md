# SPEC-007 — Clientes y personas destinatarias

## Objetivo
Gestionar clientes (quien contrata) y personas destinatarias (quien usa la prenda) de forma separada, con archivado e historial asociado.

## Input
- Cliente: name, phone, whatsapp, email, address, notes, archived_at.
- Persona: name, client_id opcional, notes.
- Relaciones: presupuestos, trabajos, sets de medidas (de la persona), notas.

## Reglas
1. Cliente ≠ persona. Ej.: María contrata arreglo del vestido de Ana.
2. Persona puede existir ligada a un cliente o como registro propio del tenant.
3. CRUD + archivado soft del cliente (`archived_at`); archivado no borra presupuestos/trabajos históricos.
4. Un cliente → N presupuestos, N trabajos.
5. Persona → N sets de medidas, referencias en jobs.
6. Búsqueda básica por nombre/teléfono del cliente (tenant-scoped).
7. Datos = privados del tenant (RLS).

## DECISIÓN PENDIENTE
No aplica (reglas aprobadas en product/requirements).

## Acceptance Criteria

### AC-001
Dado un cliente con datos completos, Cuando se guarda, Entonces nombre, teléfono, WhatsApp, email, dirección y notas persisten en su tenant.

### AC-002
Dado María como cliente y Ana como persona, Cuando se crea un presupuesto, Entonces se puede seleccionar María de cliente y Ana como persona del job, sin fusionar registros.

### AC-003
Dado un cliente archivado, Cuando se lista el catálogo activo, Entonces no aparece por defecto, pero sus presupuestos históricos siguen consultables.

### AC-004
Dado un cliente de tenant A, Cuando tenant B busca su id, Entonces no lo encuentra (RLS).

### AC-005
Dada una persona con varios sets de medidas, Cuando se abre su ficha desde el presupuesto, Entonces se ven sus sets de medidas sin depender del cliente.
