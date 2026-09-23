# Security — SewQuote

Estado: revisado contra `requirements.md`, `api.md` y `data-model.md` aprobados.

## Auth
Supabase Auth (email/password en MVP): registro, login, logout, recuperación.

## Authorization
Row Level Security obligatoria en **todas** las tablas multi-tenant:
- `profiles`, `clients`, `persons`, `job_categories`, `services`, `materials`, `material_prices`
- `quotes`, `quote_jobs`, `quote_items`, `quote_materials`, `quote_versions`
- `work_orders`, `work_materials`
- `measurement_sets`, `measurement_values`

Política base: `tenant_id = current tenant del usuario autenticado`. Sin tenant → sin filas.

## Tenant isolation
Toda consulta y mutación limitada al tenant autenticado. Validación server-side además de RLS (defensa en profundidad):
- IDs pertenecientes al tenant (client, material, service, category, person, measurement_set);
- cantidades positivas;
- precios válidos (resueltos en servidor);
- estados y transiciones válidos;
- permisos del rol.

## Server-side de precios
No confiar en `suggestedPrice`, `final_price`, snapshots ni montos enviados por el cliente web para operaciones definitivas. El servidor calcula con su configuración y su catálogo.

## Enlace público (REQ-026)
- `public_token`: opaco, alta entropía (no UUID enumerable), regenerable al enviar.
- Acceso solo a la quote indicada; nunca listing por token.
- Métodos permitidos: `GET` de lectura limitada + `POST accept`.
- `accept` solo si status `sent` y no vencida; idempotente.
- No exponer: notas internas del tenant, otros tenants, datos de terceros, `service_role`, precios de catálogo no incluidos en la quote.
- Datos de contacto del cliente (teléfono/email) en la vista pública: por defecto **ocultos** salvo que la UI lo habilite explícitamente; no son necesarios para aprobar.
- Rate limiting básico en `GET`/`POST` del token (anti-fuerza bruta / scraping).
- El cliente público no envía montos: solo token (+ opcionalmente nombre de quien aprueba si se desea registrar).

## Storage
- Buckets privados para fotos/documentos con información del cliente.
- URL firmadas de vida corta.
- Validación de tipo/tamaño de archivo en server-side.
- Enlace público no da acceso a Storage: solo datos embebidos en la respuesta de la quote.

## Datos personales
- Clientes, personas destinatarias y medidas = información privada del tenant.
- Solo visibles vía RLS del tenant dueño.
- Medidas en snapshot del trabajo: copia histórica inmutable del trabajo; no se lee desde personas ajenas al tenant.

## IA
- MVP sin IA (V2). Cuando exista: no enviar información innecesaria a proveedores; minimizar PII.
- Input de cliente/prenda = no confiable (prompt injection): nunca ejecutar instrucciones de sistema, modificar precios ni saltar validaciones.

## Auditoría
Registrar cambios relevantes:
- cambio de precio de material (`material_prices` INSERT es el propio rastro);
- cambio de precio final / override;
- aceptación/rechazo (incluida la pública) con fecha y token usado;
- transiciones de orden de trabajo;
- creación de versiones de quote.

## Secrets y entornos
- Nunca secretos en Git.
- `SUPABASE_SERVICE_ROLE_KEY` solo server-side (Vercel env).
- Anon key pública solo con RLS correcta verificada.
- Producción aislada de staging/local (ADR-003).

## Tests de seguridad obligatorios (testing.md)
- leer cliente de otro tenant → falla;
- modificar material/quote de otro tenant → falla;
- acceder a storage privado ajeno → falla;
- token de quote inexistente o de otro tenant → 404/403;
- `POST accept` con quote `draft`/`expired` → rechazado;
- aceptar dos veces con el mismo token → idempotente, sin estado inválido.
