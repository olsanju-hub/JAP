-- Fase 2.8: roles de personas y asociacion de ponentes a sesiones.
-- Ejecutar despues de supabase/migration-security-backup.sql.

alter table public.ponentes
add column if not exists rol_persona text not null default 'ponente';

alter table public.ponentes
drop constraint if exists ponentes_rol_persona_check;

alter table public.ponentes
add constraint ponentes_rol_persona_check
check (rol_persona in ('organizador', 'ponente', 'apoyo'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sesion_ponentes'::regclass
      and contype = 'p'
  ) then
    alter table public.sesion_ponentes
    add constraint sesion_ponentes_pkey primary key (sesion_id, ponente_id);
  end if;
end
$$;

alter table public.ponentes enable row level security;
alter table public.sesion_ponentes enable row level security;

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

revoke insert, update, delete on public.ponentes, public.sesion_ponentes from anon;
grant select on public.ponentes, public.sesion_ponentes to anon, authenticated;
grant insert, update on public.ponentes to authenticated;
grant insert, update, delete on public.sesion_ponentes to authenticated;

with organizadores(id, nombre, especialidad, bio) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 'Julio Fernando Ospino Arias', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'Guillermo José Olivero Sanjuanelo', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'Kelly Esther Escorcia Reyes', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizadora / coordinación R4'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'Valenska Vania Arellano Flores', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizadora / coordinación R4'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'Jorvi José Aguilar Valero', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4')
)
update public.ponentes
set
  especialidad = organizadores.especialidad,
  bio = organizadores.bio,
  rol_persona = 'organizador',
  is_active = true
from organizadores
where ponentes.nombre = organizadores.nombre;

with organizadores(id, nombre, especialidad, bio) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 'Julio Fernando Ospino Arias', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'Guillermo José Olivero Sanjuanelo', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'Kelly Esther Escorcia Reyes', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizadora / coordinación R4'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'Valenska Vania Arellano Flores', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizadora / coordinación R4'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'Jorvi José Aguilar Valero', 'Residente de 4.º año de Medicina Familiar y Comunitaria', 'Organizador / coordinación R4')
)
insert into public.ponentes (id, nombre, especialidad, centro, bio, rol_persona, is_active)
select id, nombre, especialidad, null, bio, 'organizador', true
from organizadores
where not exists (
  select 1
  from public.ponentes
  where ponentes.nombre = organizadores.nombre
);

update public.site_settings
set value = 'Equipo docente'
where key in ('speakers.title', 'home.secondary_button_speakers')
  and value in ('Ponentes', 'Equipo docente');

update public.site_settings
set value = 'Organización, coordinación y ponentes asociados a las sesiones.'
where key = 'speakers.description';

update public.site_settings
set value = 'Guillermo José Olivero Sanjuanelo, Julio Fernando Ospino Arias, Kelly Esther Escorcia Reyes, Valenska Vania Arellano Flores y Jorvi José Aguilar Valero'
where key = 'contact.coordination_value';
