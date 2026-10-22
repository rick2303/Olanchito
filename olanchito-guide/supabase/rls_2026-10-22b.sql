-- ════════════════════════════════════════════════════════════════════════════
-- Seguridad (2ª parte) — 22 oct 2026
--
-- En Postgres las políticas permisivas se SUMAN: las viejas con "true" anulaban las
-- nuevas. Aquí se quitan y se cierran reviews, correction_suggestions, business_events
-- y el storage. Las API del servidor usan la service role y no pasan por estas reglas.
-- Idempotente: se puede correr más de una vez.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── businesses: quitar las políticas viejas que dejaban a cualquier cuenta editar/borrar ───
drop policy if exists "Admin can update businesses" on public.businesses;
drop policy if exists "Admin can delete businesses" on public.businesses;
drop policy if exists "Admin can insert businesses" on public.businesses;

-- ─── reviews ────────────────────────────────────────────────────────────────
drop policy if exists "Admin puede actualizar reseñas" on public.reviews;
drop policy if exists "Admin can delete reviews" on public.reviews;
drop policy if exists "Cualquiera puede insertar una reseña" on public.reviews;

-- Publicar reseña: sin respuesta del dueño inventada, calificación 1–5 y largos razonables
drop policy if exists "reviews: cualquiera publica" on public.reviews;
create policy "reviews: cualquiera publica"
  on public.reviews for insert
  to anon, authenticated
  with check (
    owner_reply is null
    and owner_reply_at is null
    and coalesce(is_visible, true) = true
    and rating between 1 and 5
    and char_length(btrim(author_name)) between 1 and 80
    and char_length(coalesce(comment, '')) <= 1000
  );

-- El admin ve también las ocultas (la lectura pública ya filtra is_visible = true)
drop policy if exists "reviews: admin lee todas" on public.reviews;
create policy "reviews: admin lee todas"
  on public.reviews for select
  to authenticated
  using (public.is_admin());

create or replace function public.owns_business_slug(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where slug = p_slug
      and owner_email is not null
      and lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.owns_business_slug(text) from public;
grant execute on function public.owns_business_slug(text) to anon, authenticated;

drop policy if exists "reviews: dueño responde, admin modera" on public.reviews;
create policy "reviews: dueño responde, admin modera"
  on public.reviews for update
  to authenticated
  using (public.is_admin() or public.owns_business_slug(business_slug))
  with check (public.is_admin() or public.owns_business_slug(business_slug));

drop policy if exists "reviews: solo admin borra" on public.reviews;
create policy "reviews: solo admin borra"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());

-- El dueño solo puede tocar su respuesta, no la calificación ni el texto del cliente
create or replace function public.protect_review_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if new.business_slug is distinct from old.business_slug
  or new.author_name   is distinct from old.author_name
  or new.rating        is distinct from old.rating
  or new.comment       is distinct from old.comment
  or new.is_visible    is distinct from old.is_visible
  or new.created_at    is distinct from old.created_at
  then
    raise exception 'El dueño solo puede responder la reseña' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_review_columns on public.reviews;
create trigger protect_review_columns
  before update on public.reviews
  for each row execute function public.protect_review_columns();

-- ─── correction_suggestions: contiene correos y WhatsApp de terceros ─────────
-- Todo se inserta desde las API del servidor (service role); el navegador ya no escribe aquí.
drop policy if exists "anon_insert" on public.correction_suggestions;
drop policy if exists "auth_select" on public.correction_suggestions;
drop policy if exists "auth_delete" on public.correction_suggestions;

drop policy if exists "correction_suggestions: admin lee" on public.correction_suggestions;
create policy "correction_suggestions: admin lee"
  on public.correction_suggestions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "correction_suggestions: admin borra" on public.correction_suggestions;
create policy "correction_suggestions: admin borra"
  on public.correction_suggestions for delete
  to authenticated
  using (public.is_admin());

-- ─── business_events: los clics los registra /api/track con la service role ──
drop policy if exists "public insert" on public.business_events;

-- Antes no había lectura: el portal de los destacados mostraba 0 clics
drop policy if exists "business_events: dueño o admin leen" on public.business_events;
create policy "business_events: dueño o admin leen"
  on public.business_events for select
  to authenticated
  using (public.is_admin() or public.owns_business(business_id));

-- ─── Storage (bucket Olanchito-guide) ───────────────────────────────────────
drop policy if exists "Anyone can upload business images" on storage.objects;
drop policy if exists "Admin can upload images" on storage.objects;
drop policy if exists "Give anon users access to JPG images in folder 1axfkx0_1" on storage.objects;
drop policy if exists "Admin can delete images" on storage.objects;

-- Subir: solo imágenes (sin SVG, que puede llevar scripts) y solo en las carpetas que usa el sitio
drop policy if exists "storage: subir imágenes del directorio" on storage.objects;
create policy "storage: subir imágenes del directorio"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'Olanchito-guide'
    and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'])
    and split_part(name, '/', 1) = any (array['business', 'catalog', 'gallery'])
  );

-- Borrar: el admin, o el dueño de la imagen (foto principal, del catálogo o de su galería)
create or replace function public.owns_storage_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.businesses b
      where (b.image = p_name or 'business/' || b.image = p_name)
        and public.owns_business(b.id)
    )
    or exists (
      select 1 from public.catalog_items c
      where c.image_path = p_name and public.owns_business(c.business_id)
    )
    or (
      split_part(p_name, '/', 1) = 'gallery'
      and split_part(p_name, '/', 2) ~ '^[0-9a-f-]{36}$'
      and public.owns_business(split_part(p_name, '/', 2)::uuid)
    );
$$;
revoke all on function public.owns_storage_object(text) from public;
grant execute on function public.owns_storage_object(text) to authenticated;

drop policy if exists "storage: admin o dueño borran" on storage.objects;
create policy "storage: admin o dueño borran"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'Olanchito-guide' and (public.is_admin() or public.owns_storage_object(name)));

-- Lectura de metadatos del bucket (ya es público). Sin esto, borrar con filtro fallaba para
-- usuarios con sesión: Postgres exige poder leer la fila que se borra.
drop policy if exists "storage: leer imágenes del directorio" on storage.objects;
create policy "storage: leer imágenes del directorio"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'Olanchito-guide');

commit;
