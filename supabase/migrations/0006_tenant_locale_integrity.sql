-- Integridad del locale del tenant: solo 'es' y 'pt-BR' (SPEC-002).

update public.tenants
set locale = case
  when lower(replace(trim(coalesce(locale, '')), '_', '-')) like 'pt%' then 'pt-BR'
  else 'es'
end
where coalesce(locale, '') not in ('es', 'pt-BR');

alter table public.tenants
  drop constraint if exists tenants_locale_check;

alter table public.tenants
  add constraint tenants_locale_check check (locale in ('es', 'pt-BR'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_tenant_name text;
  v_profile_name text;
  v_locale text;
begin
  v_locale := case
    when lower(replace(trim(coalesce(new.raw_user_meta_data ->> 'locale', '')), '_', '-'))
      like 'pt%' then 'pt-BR'
    else 'es'
  end;

  v_tenant_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'atelier_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Mi Atelier'
  );

  v_profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuaria'
  );

  insert into public.tenants (name, locale)
  values (v_tenant_name, v_locale)
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, name, role)
  values (new.id, v_tenant_id, v_profile_name, 'owner');

  return new;
end;
$$;
