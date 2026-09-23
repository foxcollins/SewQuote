# SPEC-009 — Auth, tenant y aislamiento multi-tenant

## Objetivo
Registro/login y aislamiento total de datos por tenant (RLS + validación server-side) desde el primer deploy.

## Input
- Auth: email/password (registro, login, logout, recuperación).
- Alta de tenant/negocio y asignación de usuario a tenant.
- Rol en `profiles` (propuesto: owner | member; mínimo solo owner en validación).

## Reglas
1. Alta de usuario = **un tenant por usuario/registro**. Cada tenant maneja su sistema; cada uno solo ve lo suyo (aprobado).
2. **No** en esta versión: invitar miembros/roles al mismo tenant (solo 1 usuaria de testing por tenant).
3. Cada fila de negocio lleva `tenant_id`; RLS en todas las tablas del data-model.
4. Server-side revalida tenant en IDs de FK antes de mutar (no confiar solo en UI).
5. Service role solo en servidor; nunca en cliente.
6. Operaciones sin sesión autenticada: solo rutas públicas del SPEC-004 (token).
7. Alta inicial: quien registra el negocio = dueña del tenant.

## DECISIÓN PENDIENTE
No aplica. Aprobado: multi-tenant de aislamiento total; **un solo usuario por tenant** en esta versión (invitaciones/roles = futuro).

## Acceptance Criteria

### AC-001
Dado un usuario nuevo, Cuando completa registro, Entonces queda con sesión activa y un `tenant_id` asociado.

### AC-002
Dado un usuario de tenant A, Cuando consulta listados (clientes, quotes, materiales), Entonces solo ve filas de A.

### AC-003
Dado un id de quote/material/cliente de tenant B, Cuando un usuario de A intenta mutar por API, Entonces la operación falla (RLS/server).

### AC-004
Dado el bundle del cliente, Cuando se inspecciona, Entonces no hay service_role key expuesta.

### AC-005
Dado un usuario sin sesión, Cuando intenta CRUD de negocio fuera del enlace público, Entonces recibe 401/403.
