-- SPEC-002: el portal público necesita el timezone del tenant para formatear fechas.

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
      'name', t.name, 'currency', t.currency, 'locale', t.locale,
      'timezone', t.timezone
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

grant execute on function public.get_public_quote(text) to anon, authenticated;
