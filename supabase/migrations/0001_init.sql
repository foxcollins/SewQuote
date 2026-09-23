-- SewQuote — migración inicial (fase 9)
-- Orden según data-model.md. Aplicar con RLS en cada tabla de negocio.
-- TODO: ejecutar en Supabase; ajustar extensions si hace falta.

create extension if not exists "pgcrypto";

-- tenants
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  currency text not null default 'BRL',
  timezone text not null default 'UTC',
  locale text not null default 'es',
  hourly_rate numeric(12,2) not null default 0,
  default_margin_percent numeric(6,2) not null default 40,
  default_waste_percent numeric(6,2) not null default 0,
  complexity_factors jsonb not null default '{"low":0,"medium":0.1,"high":0.2,"very_high":0.35}'::jsonb,
  urgency_factors jsonb not null default '{"normal":0,"urgent":0.2,"very_urgent":0.4}'::jsonb,
  measurement_stale_days int not null default 30,
  created_at timestamptz not null default now()
);

-- profiles (1 usuaria por tenant en esta versión)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists persons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  category text,
  base_price numeric(12,2),
  estimated_minutes int,
  unit text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  category text,
  unit text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- historial inmutable: solo INSERT
create table if not exists material_prices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  unit_price numeric(12,4) not null,
  currency text not null,
  valid_from date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id),
  quote_number int not null,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','rejected','expired','cancelled')),
  version_number int not null default 0,
  margin_percent numeric(6,2),
  currency text not null,
  subtotal_materials numeric(12,2) default 0,
  subtotal_labor numeric(12,2) default 0,
  complexity_amount numeric(12,2) default 0,
  urgency_amount numeric(12,2) default 0,
  other_costs_amount numeric(12,2) default 0,
  margin_amount numeric(12,2) default 0,
  suggested_price numeric(12,2) default 0,
  final_price numeric(12,2),
  override_reason text,
  valid_until date,
  notes text,
  public_token text unique,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, quote_number)
);

create table if not exists quote_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  job_category_id uuid references job_categories(id),
  person_id uuid references persons(id),
  garment_type text,
  garment_description text,
  labor_method text not null check (labor_method in ('fixed','hourly')),
  labor_fixed_price numeric(12,2),
  estimated_minutes int,
  complexity text not null default 'medium',
  urgency text not null default 'normal',
  measurements_snapshot jsonb,
  measurements_source_id uuid,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_job_id uuid not null references quote_jobs(id) on delete cascade,
  service_id uuid references services(id),
  description_snapshot text not null,
  quantity numeric(12,4) not null default 1,
  estimated_minutes int,
  unit_price_snapshot numeric(12,4) not null,
  total numeric(12,2) not null
);

create table if not exists quote_materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_job_id uuid not null references quote_jobs(id) on delete cascade,
  material_id uuid references materials(id),
  material_name_snapshot text not null,
  quantity numeric(12,4) not null,
  unit_snapshot text not null,
  unit_price_snapshot numeric(12,4) not null,
  waste_percent numeric(6,2) not null default 0,
  total numeric(12,2) not null
);

create table if not exists quote_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  version_number int not null,
  reason text not null check (reason in ('sent','accepted','recalculated_after_expiry')),
  suggested_price numeric(12,2),
  final_price numeric(12,2),
  payload_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (quote_id, version_number)
);

create table if not exists public_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  body text not null,
  author_name text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  quote_id uuid not null references quotes(id),
  quote_version_number int,
  status text not null default 'accepted'
    check (status in ('accepted','waiting_garment','in_production','fitting','adjustments','ready','delivered','cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  actual_minutes int,
  actual_price numeric(12,2),
  measurements_snapshot jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_materials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  work_order_id uuid not null references work_orders(id) on delete cascade,
  material_id uuid references materials(id),
  quantity numeric(12,4) not null,
  unit_price numeric(12,4) not null,
  total numeric(12,2) not null
);

create table if not exists measurement_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  person_id uuid not null references persons(id) on delete cascade,
  label text,
  recorded_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists measurement_values (
  id uuid primary key default gen_random_uuid(),
  measurement_set_id uuid not null references measurement_sets(id) on delete cascade,
  name text not null,
  value numeric(10,2) not null,
  unit text not null default 'cm'
);

-- Índices sugeridos
create index if not exists quotes_tenant_status_idx on quotes(tenant_id, status);
create index if not exists quotes_tenant_valid_idx on quotes(tenant_id, valid_until);
create index if not exists quote_jobs_quote_idx on quote_jobs(quote_id);
create index if not exists material_prices_material_idx on material_prices(material_id, valid_from desc);
create index if not exists work_orders_tenant_status_idx on work_orders(tenant_id, status);
create index if not exists measurement_sets_person_idx on measurement_sets(person_id, recorded_at desc);
create index if not exists quotes_public_token_idx on quotes(public_token) where public_token is not null;

-- RLS
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table persons enable row level security;
alter table job_categories enable row level security;
alter table services enable row level security;
alter table materials enable row level security;
alter table material_prices enable row level security;
alter table quotes enable row level security;
alter table quote_jobs enable row level security;
alter table quote_items enable row level security;
alter table quote_materials enable row level security;
alter table quote_versions enable row level security;
alter table public_comments enable row level security;
alter table work_orders enable row level security;
alter table work_materials enable row level security;
alter table measurement_sets enable row level security;
alter table measurement_values enable row level security;

-- Helper: tenant del usuario autenticado
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Políticas base (tenant = current_tenant_id()); revisar por tabla en producción
create policy clients_tenant_all on clients
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy persons_tenant_all on persons
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy job_categories_tenant_all on job_categories
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy services_tenant_all on services
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy materials_tenant_all on materials
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy material_prices_tenant_all on material_prices
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy quotes_tenant_all on quotes
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy quote_jobs_tenant_all on quote_jobs
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy quote_items_tenant_all on quote_items
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy quote_materials_tenant_all on quote_materials
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy quote_versions_tenant_all on quote_versions
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy public_comments_tenant_all on public_comments
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy work_orders_tenant_all on work_orders
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy work_materials_tenant_all on work_materials
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy measurement_sets_tenant_all on measurement_sets
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy measurement_values_tenant_all on measurement_values
  for all using (
    exists (
      select 1 from measurement_sets ms
      where ms.id = measurement_set_id
        and ms.tenant_id = public.current_tenant_id()
    )
  )
  with check (
    exists (
      select 1 from measurement_sets ms
      where ms.id = measurement_set_id
        and ms.tenant_id = public.current_tenant_id()
    )
  );

create policy profiles_own on profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());

create policy tenants_own on tenants
  for all using (id = public.current_tenant_id())
  with check (id = public.current_tenant_id());

-- material_prices: prohibir UPDATE/DELETE del histórico (solo INSERT)
create rule material_prices_no_update as on update to material_prices do instead nothing;
create rule material_prices_no_delete as on delete to material_prices do instead nothing;
