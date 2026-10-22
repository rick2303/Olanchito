-- ════════════════════════════════════════════════════════════════════════════
-- Seguridad de la base (RLS) — 22 oct 2026
--
-- Antes: businesses, catalog_items y business_photos tenían RLS apagado, así que
-- cualquiera con la clave pública (que va en el navegador) podía editar o borrar
-- cualquier negocio, ponerse el plan destacado o cambiar el owner_email.
--
-- Después:
--   · Todos pueden LEER (el sitio es público).
--   · Cualquiera puede REGISTRAR un negocio, pero sin plan, sin verificar y sin destacar.
--   · El DUEÑO (owner_email = su correo de sesión) edita solo su negocio, su catálogo
--     y sus fotos, y no puede tocar plan, verificación, Stripe ni owner_email.
--   · El ADMIN (tabla public.admins) puede todo.
--   · Las API del servidor usan la service role y no pasan por estas reglas.
--
-- Se ejecuta completo en Supabase → SQL Editor. Es idempotente: se puede correr más de una vez.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── Admins ─────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- Sin políticas: solo la service role y las funciones de abajo pueden leerla.

insert into public.admins (email) values ('admin@olanchito.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.owns_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id
      and owner_email is not null
      and lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.owns_business(uuid) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.owns_business(uuid) to anon, authenticated;

-- ─── businesses ─────────────────────────────────────────────────────────────
alter table public.businesses enable row level security;

drop policy if exists "businesses: lectura pública" on public.businesses;
create policy "businesses: lectura pública"
  on public.businesses for select
  to anon, authenticated
  using (true);

-- Registro público (/registrar): entra como negocio gratis, sin verificar ni destacar
drop policy if exists "businesses: registro público" on public.businesses;
create policy "businesses: registro público"
  on public.businesses for insert
  to anon, authenticated
  with check (
    public.is_admin()
    or (
      coalesce(verified, false) = false
      and coalesce(featured, false) = false
      and coalesce(subscription_active, false) = false
      and coalesce(subscription_tier, 'free') = 'free'
      and stripe_customer_id is null
      and stripe_subscription_id is null
      and coalesce(view_count, 0) = 0
      and announcement is null
    )
  );

drop policy if exists "businesses: dueño o admin editan" on public.businesses;
create policy "businesses: dueño o admin editan"
  on public.businesses for update
  to authenticated
  using (public.is_admin() or lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (public.is_admin() or lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "businesses: solo admin borra" on public.businesses;
create policy "businesses: solo admin borra"
  on public.businesses for delete
  to authenticated
  using (public.is_admin());

-- RLS decide QUÉ filas; este trigger decide QUÉ columnas puede cambiar el dueño.
-- Corre como quien hace la petición (security invoker): anon/authenticated vienen del
-- navegador; la service role y las funciones internas (increment_view_count) pasan libres.
create or replace function public.protect_business_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if new.name                    is distinct from old.name
  or new.slug                    is distinct from old.slug
  or new.category_id             is distinct from old.category_id
  or new.verified                is distinct from old.verified
  or new.featured                is distinct from old.featured
  or new.view_count              is distinct from old.view_count
  or new.owner_email             is distinct from old.owner_email
  or new.subscription_active     is distinct from old.subscription_active
  or new.subscription_plan       is distinct from old.subscription_plan
  or new.subscription_tier       is distinct from old.subscription_tier
  or new.subscription_started_at is distinct from old.subscription_started_at
  or new.stripe_customer_id      is distinct from old.stripe_customer_id
  or new.stripe_subscription_id  is distinct from old.stripe_subscription_id
  or new.cancel_at_period_end    is distinct from old.cancel_at_period_end
  then
    raise exception 'Solo el administrador puede cambiar el nombre, la categoría, el plan o la verificación del negocio'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_business_columns on public.businesses;
create trigger protect_business_columns
  before update on public.businesses
  for each row execute function public.protect_business_columns();

-- El contador de visitas lo llama el navegador (anon). Con RLS encendido necesita
-- correr con permisos del dueño de la función para poder sumar la visita.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'increment_view_count'
  loop
    execute format('alter function %s security definer', f);
    execute format('alter function %s set search_path = public', f);
  end loop;
end $$;

-- ─── catalog_items ──────────────────────────────────────────────────────────
alter table public.catalog_items enable row level security;

drop policy if exists "catalog_items: lectura pública" on public.catalog_items;
create policy "catalog_items: lectura pública"
  on public.catalog_items for select
  to anon, authenticated
  using (true);

drop policy if exists "catalog_items: dueño o admin escriben" on public.catalog_items;
create policy "catalog_items: dueño o admin escriben"
  on public.catalog_items for all
  to authenticated
  using (public.is_admin() or public.owns_business(business_id))
  with check (public.is_admin() or public.owns_business(business_id));

-- ─── business_photos ────────────────────────────────────────────────────────
alter table public.business_photos enable row level security;

drop policy if exists "business_photos: lectura pública" on public.business_photos;
create policy "business_photos: lectura pública"
  on public.business_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "business_photos: dueño o admin escriben" on public.business_photos;
create policy "business_photos: dueño o admin escriben"
  on public.business_photos for all
  to authenticated
  using (public.is_admin() or public.owns_business(business_id))
  with check (public.is_admin() or public.owns_business(business_id));

commit;

-- ─── Verificación (opcional) ────────────────────────────────────────────────
-- select relname, relrowsecurity from pg_class
-- where relname in ('businesses', 'catalog_items', 'business_photos', 'admins');
