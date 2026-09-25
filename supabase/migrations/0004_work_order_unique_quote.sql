-- ADR-006 (Aceptado): Quote 1→N WorkOrders + work_order_items por pieza
-- Anti-duplicados: unique parcial sobre OTs NO canceladas (permite reconvertir tras cancelar)

-- 1) Si existiera unique absoluto de una versión previa no aplicada, no crearlo aquí.

-- 2) Dedupe de OTs activas: se conserva la más antigua no cancelada por quote_id;
--    las demás (clics repetidos) pasan a cancelled (no se borran por trazabilidad)
update public.work_orders w
set status = 'cancelled',
    updated_at = now()
where w.status <> 'cancelled'
  and exists (
    select 1
    from public.work_orders k
    where k.quote_id = w.quote_id
      and k.status <> 'cancelled'
      and k.id <> w.id
      and (k.created_at < w.created_at
           or (k.created_at = w.created_at and k.id::text < w.id::text))
  );

-- 3) Unique parcial: a lo sumo una OT activa por presupuesto
create unique index if not exists work_orders_quote_id_active_key
  on public.work_orders (quote_id)
  where status <> 'cancelled';

-- 4) work_order_items: piezas en producción (1 quote_job → N items)
create table if not exists public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  quote_job_id uuid references public.quote_jobs(id),
  status text not null default 'accepted'
    check (status in ('accepted','waiting_garment','in_production','fitting','adjustments','ready','delivered','cancelled')),
  measurements_snapshot jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_order_items_wo_idx
  on public.work_order_items (work_order_id, sort_order);

create unique index if not exists work_order_items_wo_qj_key
  on public.work_order_items (work_order_id, quote_job_id)
  where quote_job_id is not null;

-- 5) RLS
alter table public.work_order_items enable row level security;

create policy work_order_items_tenant_all on public.work_order_items
  for all using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- 6) Backfill: 1 item por quote_job de cada OT existente
insert into public.work_order_items (
  tenant_id, work_order_id, quote_job_id, status,
  measurements_snapshot, sort_order, created_at, updated_at
)
select
  wo.tenant_id,
  wo.id,
  j.id,
  case when wo.status = 'cancelled' then 'cancelled' else wo.status end,
  j.measurements_snapshot,
  coalesce(j.sort_order, 0),
  now(),
  now()
from public.work_orders wo
join public.quote_jobs j on j.quote_id = wo.quote_id
on conflict do nothing;
