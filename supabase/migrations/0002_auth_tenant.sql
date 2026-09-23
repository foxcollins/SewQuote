-- Alta automática de tenant + profile al registrarse (email o Google)
-- SPEC-009: un tenant por registro; quien registra = owner

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
begin
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
  values (v_tenant_name, coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'es'))
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, name, role)
  values (new.id, v_tenant_id, v_profile_name, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
