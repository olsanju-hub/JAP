-- Fase 2.7: refuerzo de RLS y permisos base para contenido JAP.
-- Ejecutar despues de supabase/schema.sql y supabase/migration-site-content.sql.

alter table public.profiles enable row level security;
alter table public.jornadas enable row level security;
alter table public.sedes enable row level security;
alter table public.sesiones enable row level security;
alter table public.ponentes enable row level security;
alter table public.sesion_ponentes enable row level security;
alter table public.recursos enable row level security;
alter table public.site_settings enable row level security;

revoke insert, update, delete on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings from anon;
revoke delete on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings from authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings to anon, authenticated;
grant insert, update on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings to authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_editor() to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_manage_admin" on public.profiles;
create policy "profiles_manage_admin"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "jornadas_public_select" on public.jornadas;
create policy "jornadas_public_select"
on public.jornadas
for select
to anon, authenticated
using (published = true);

drop policy if exists "jornadas_admin_editor_manage" on public.jornadas;
create policy "jornadas_admin_editor_manage"
on public.jornadas
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sedes_public_select" on public.sedes;
create policy "sedes_public_select"
on public.sedes
for select
to anon, authenticated
using (true);

drop policy if exists "sedes_admin_editor_manage" on public.sedes;
create policy "sedes_admin_editor_manage"
on public.sedes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sesiones_public_select" on public.sesiones;
create policy "sesiones_public_select"
on public.sesiones
for select
to anon, authenticated
using (estado = 'publicada' and is_active = true);

drop policy if exists "sesiones_admin_editor_manage" on public.sesiones;
create policy "sesiones_admin_editor_manage"
on public.sesiones
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "ponentes_public_select" on public.ponentes;
create policy "ponentes_public_select"
on public.ponentes
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ponentes_admin_editor_manage" on public.ponentes;
create policy "ponentes_admin_editor_manage"
on public.ponentes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

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
      and sesiones.estado = 'publicada'
      and sesiones.is_active = true
  )
);

drop policy if exists "sesion_ponentes_admin_editor_manage" on public.sesion_ponentes;
create policy "sesion_ponentes_admin_editor_manage"
on public.sesion_ponentes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

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
        and sesiones.estado = 'publicada'
        and sesiones.is_active = true
    )
  )
);

drop policy if exists "recursos_admin_editor_manage" on public.recursos;
create policy "recursos_admin_editor_manage"
on public.recursos
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "site_settings_admin_editor_manage" on public.site_settings;
create policy "site_settings_admin_editor_manage"
on public.site_settings
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());
