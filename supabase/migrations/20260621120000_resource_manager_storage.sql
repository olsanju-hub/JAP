-- Gestor de recursos JAP con Supabase Storage privado.
-- Pendiente de aplicar con supabase db push tras revision.
-- Fase hibrida: los recursos vigentes locales siguen en assets/ y los nuevos
-- subidos desde admin usan el bucket privado jap-resources.

create extension if not exists unaccent;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jap-resources',
  'jap-resources',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.recursos
  add column if not exists slug text,
  add column if not exists file_path text,
  add column if not exists public_url text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint,
  add column if not exists status text not null default 'visible',
  add column if not exists sort_order integer,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recursos_status_check'
      and conrelid = 'public.recursos'::regclass
  ) then
    alter table public.recursos
      add constraint recursos_status_check
      check (status in ('visible', 'hidden', 'archived'));
  end if;
end $$;

update public.recursos
set
  status = case when visible then 'visible' else 'hidden' end,
  sort_order = coalesce(sort_order, orden),
  slug = coalesce(
    slug,
    regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(titulo, id::text))),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    )
  )
where slug is null
   or sort_order is null
   or (visible = true and status <> 'visible')
   or (visible = false and status = 'visible');

create or replace function public.sync_resource_visibility_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is null then
    new.status := case when coalesce(new.visible, false) then 'visible' else 'hidden' end;
  end if;

  if tg_op = 'UPDATE' and new.visible is distinct from old.visible and new.status is not distinct from old.status then
    new.status := case when new.visible then 'visible' else 'hidden' end;
  else
    new.visible := new.status = 'visible';
  end if;

  if new.sort_order is null then
    new.sort_order := new.orden;
  end if;

  if new.orden is null then
    new.orden := new.sort_order;
  end if;

  if new.slug is null or btrim(new.slug) = '' then
    new.slug := regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(new.titulo, new.id::text))),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists recursos_sync_visibility_status on public.recursos;
create trigger recursos_sync_visibility_status
before insert or update on public.recursos
for each row execute function public.sync_resource_visibility_status();

create index if not exists recursos_slug_idx
on public.recursos (slug)
where slug is not null;

create index if not exists recursos_status_sort_idx
on public.recursos (status, sort_order, orden);

create index if not exists recursos_file_path_idx
on public.recursos (file_path)
where file_path is not null;

drop policy if exists "recursos_public_select" on public.recursos;
create policy "recursos_public_select"
on public.recursos
for select
to anon, authenticated
using (
  visible = true
  and status = 'visible'
  and (
    sesion_id is null
    or exists (
      select 1
      from public.sesiones
      where sesiones.id = recursos.sesion_id
        and sesiones.estado in ('publicada', 'realizada')
        and sesiones.is_active = true
    )
  )
);

drop policy if exists "recursos_admin_editor_manage" on public.recursos;
drop policy if exists "recursos_admin_manage" on public.recursos;
create policy "recursos_admin_manage"
on public.recursos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "jap_resources_public_visible_read" on storage.objects;
create policy "jap_resources_public_visible_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'jap-resources'
  and exists (
    select 1
    from public.recursos r
    where r.file_path = storage.objects.name
      and r.visible = true
      and r.status = 'visible'
  )
);

drop policy if exists "jap_resources_admin_read" on storage.objects;
create policy "jap_resources_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'jap-resources'
  and public.is_admin()
);

drop policy if exists "jap_resources_admin_insert" on storage.objects;
create policy "jap_resources_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'jap-resources'
  and public.is_admin()
);

drop policy if exists "jap_resources_admin_update" on storage.objects;
create policy "jap_resources_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'jap-resources'
  and public.is_admin()
)
with check (
  bucket_id = 'jap-resources'
  and public.is_admin()
);

drop policy if exists "jap_resources_admin_delete" on storage.objects;
create policy "jap_resources_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'jap-resources'
  and public.is_admin()
);

grant select on public.recursos to anon, authenticated;
grant insert, update, delete on public.recursos to authenticated;
