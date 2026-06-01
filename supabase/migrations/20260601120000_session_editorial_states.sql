-- Fase 3.0: estados editoriales de sesiones y eliminacion controlada.

update public.sesiones
set estado = 'publicada'
where estado is null
   or estado not in ('borrador', 'publicada', 'realizada', 'archivada');

alter table public.sesiones
drop constraint if exists sesiones_estado_check;

alter table public.sesiones
add constraint sesiones_estado_check
check (estado in ('borrador', 'publicada', 'realizada', 'archivada'));

alter table public.sesiones enable row level security;
alter table public.sesion_ponentes enable row level security;
alter table public.recursos enable row level security;

drop policy if exists "sesiones_public_select" on public.sesiones;
create policy "sesiones_public_select"
on public.sesiones
for select
to anon, authenticated
using (estado in ('publicada', 'realizada') and is_active = true);

drop policy if exists "sesiones_admin_editor_manage" on public.sesiones;
drop policy if exists "sesiones_admin_editor_insert" on public.sesiones;
create policy "sesiones_admin_editor_insert"
on public.sesiones
for insert
to authenticated
with check (public.is_admin_or_editor());

drop policy if exists "sesiones_admin_editor_update" on public.sesiones;
create policy "sesiones_admin_editor_update"
on public.sesiones
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sesiones_admin_delete" on public.sesiones;
create policy "sesiones_admin_delete"
on public.sesiones
for delete
to authenticated
using (public.is_admin());

drop policy if exists "sesion_ponentes_public_select" on public.sesion_ponentes;
create policy "sesion_ponentes_public_select"
on public.sesion_ponentes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sesiones
    where sesiones.id = sesion_ponentes.sesion_id
      and sesiones.estado in ('publicada', 'realizada')
      and sesiones.is_active = true
  )
);

drop policy if exists "recursos_public_select" on public.recursos;
create policy "recursos_public_select"
on public.recursos
for select
to anon, authenticated
using (
  visible = true
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

revoke delete on public.sesiones from anon;
grant delete on public.sesiones to authenticated;
