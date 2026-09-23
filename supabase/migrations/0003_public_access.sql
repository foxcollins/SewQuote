-- Acceso público por public_token (SPEC-004)
-- Lectura/mutación solo vía RPC con token (no policies amplias para anon).

create or replace function public.get_public_quote(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'quote', to_jsonb(q) - 'tenant_id' - 'public_token',
    'client', jsonb_build_object('name', c.name),
    'tenant', jsonb_build_object(
      'name', t.name, 'currency', t.currency, 'locale', t.locale
    ),
    'jobs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', j.id,
          'garment_type', j.garment_type,
          'garment_description', j.garment_description,
          'labor_method', j.labor_method,
          'labor_fixed_price', j.labor_fixed_price,
          'estimated_minutes', j.estimated_minutes,
          'complexity', j.complexity,
          'urgency', j.urgency,
          'measurements_snapshot', j.measurements_snapshot,
          'job_category', (
            select jsonb_build_object('name', jc.name)
            from job_categories jc where jc.id = j.job_category_id
          ),
          'person', (
            select jsonb_build_object('name', p.name)
            from persons p where p.id = j.person_id
          ),
          'items', (
            select jsonb_agg(to_jsonb(i))
            from quote_items i where i.quote_job_id = j.id
          ),
          'materials', (
            select jsonb_agg(to_jsonb(m))
            from quote_materials m where m.quote_job_id = j.id
          )
        )
        order by j.sort_order
      )
      from quote_jobs j where j.quote_id = q.id
    ), '[]'::jsonb),
    'comments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'body', pc.body,
          'author_name', pc.author_name,
          'created_at', pc.created_at
        )
        order by pc.created_at
      )
      from public_comments pc where pc.quote_id = q.id
    ), '[]'::jsonb),
    'versions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'version_number', v.version_number,
          'reason', v.reason,
          'suggested_price', v.suggested_price,
          'final_price', v.final_price,
          'created_at', v.created_at
        )
        order by v.version_number desc
      )
      from quote_versions v where v.quote_id = q.id
      limit 5
    ), '[]'::jsonb)
  )
  from quotes q
  join clients c on c.id = q.client_id
  join tenants t on t.id = q.tenant_id
  where q.public_token = p_token
  limit 1;
$$;

create or replace function public.public_accept(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q quotes%rowtype;
  v_next int;
  jobs_data jsonb;
begin
  select * into q from quotes where public_token = p_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if q.status = 'accepted' then
    return jsonb_build_object('ok', true, 'status', 'accepted');
  end if;
  if q.status <> 'sent' then
    return jsonb_build_object('ok', false, 'error', 'invalid_status', 'status', q.status);
  end if;
  if q.valid_until is not null and q.valid_until < current_date then
    return jsonb_build_object('ok', false, 'error', 'expired', 'status', 'expired');
  end if;

  v_next := coalesce(q.version_number, 0) + 1;
  update quotes
    set status = 'accepted',
        version_number = v_next,
        accepted_at = now(),
        updated_at = now()
    where id = q.id;

  select coalesce(jsonb_agg(to_jsonb(j)), '[]'::jsonb) into jobs_data
  from quote_jobs j where j.quote_id = q.id;

  insert into quote_versions (
    tenant_id, quote_id, version_number, reason,
    suggested_price, final_price, payload_snapshot
  )
  values (
    q.tenant_id, q.id, v_next, 'accepted',
    q.suggested_price, q.final_price,
    jsonb_build_object('jobs', jobs_data, 'source', 'public_accept')
  )
  on conflict (quote_id, version_number) do nothing;

  return jsonb_build_object('ok', true, 'status', 'accepted');
end;
$$;

create or replace function public.public_reject(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q quotes%rowtype;
begin
  select * into q from quotes where public_token = p_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if q.status = 'rejected' then
    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;
  if q.status <> 'sent' then
    return jsonb_build_object('ok', false, 'error', 'invalid_status', 'status', q.status);
  end if;

  update quotes
    set status = 'rejected',
        rejected_at = now(),
        updated_at = now()
    where id = q.id;

  return jsonb_build_object('ok', true, 'status', 'rejected');
end;
$$;

create or replace function public.public_comment(
  p_token text,
  p_body text,
  p_author text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q quotes%rowtype;
  v_body text;
begin
  v_body := left(trim(p_body), 1000);
  if v_body = '' then
    return jsonb_build_object('ok', false, 'error', 'empty');
  end if;

  select * into q from quotes where public_token = p_token for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if q.status <> 'sent' then
    return jsonb_build_object('ok', false, 'error', 'invalid_status');
  end if;

  insert into public_comments (tenant_id, quote_id, body, author_name)
  values (q.tenant_id, q.id, v_body, left(nullif(trim(coalesce(p_author, '')), ''), 120));

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.next_quote_number(p_tenant_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
begin
  perform pg_advisory_xact_lock(hashtext(p_tenant_id::text));
  select coalesce(max(quote_number), 0) + 1
    into v_next
    from quotes
    where tenant_id = p_tenant_id;
  return v_next;
end;
$$;

revoke all on function public.get_public_quote(text) from public;
revoke all on function public.public_accept(text) from public;
revoke all on function public.public_reject(text) from public;
revoke all on function public.public_comment(text, text, text) from public;

grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.public_accept(text) to anon, authenticated;
grant execute on function public.public_reject(text) to anon, authenticated;
grant execute on function public.public_comment(text, text, text) to anon, authenticated;
grant execute on function public.next_quote_number(uuid) to authenticated;
