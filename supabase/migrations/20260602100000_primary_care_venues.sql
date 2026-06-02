-- Fase 3.1b: sedes reales de Atencion Primaria en Ibiza.

alter table public.sedes
add column if not exists tipo_sede text not null default 'centro_salud',
add column if not exists orden integer,
add column if not exists telefono text,
add column if not exists is_active boolean not null default true;

alter table public.sedes
drop constraint if exists sedes_tipo_sede_check;

alter table public.sedes
add constraint sedes_tipo_sede_check
check (tipo_sede in ('pendiente', 'centro_salud', 'hospital', 'online'));

with venues(id, nombre, direccion, telefono, tipo_sede, orden, notas) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Sede pendiente de confirmar', null, null, 'pendiente', 10, 'La sede de cada sesión se publicará cuando esté confirmada.'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Online / Teams', null, null, 'online', 20, 'Sesión online mediante Teams.'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'CS de Can Misses', 'C/ Corona, 20-36 (Edificio J- antiguo Hospital Can Misses), 07800 Eivissa', '971397010', 'centro_salud', 100, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'CS de Es Viver', 'C/ Músic Fermí Marí 11-15, 07800 Eivissa', '971 391 632/38', 'centro_salud', 110, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'CS de Sant Antoni de Portmany', 'C/ De Ses Séquies 6, 07820 Sant Antoni de Portmany', '971 397000', 'centro_salud', 120, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'CS de Sant Jordi de Ses Salines', 'C/ Timbal nº 2, 07817 Sant Josep de sa Talaia', '971 308 175', 'centro_salud', 130, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'CS de Sant Josep de sa Talaia', 'Carrer Can Cantó 19, 07830 Sant Josep de sa Talaia', '971 801077', 'centro_salud', 140, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'CS de Santa Eulària des Riu', 'C/ l''historiador Clapés s/n, 07840 Santa Eulària des Riu', '971 332453/6985', 'centro_salud', 150, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'CS de Vila', 'Avinguda Vuit d''agost 30, 07800 Eivissa', '971 195 140', 'centro_salud', 160, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Hospital Can Misses', 'Calle Corona, s/n, 07800 Eivissa', '971 397 000', 'hospital', 300, 'Sede hospitalaria posible.')
)
update public.sedes
set
  direccion = venues.direccion,
  telefono = venues.telefono,
  tipo_sede = venues.tipo_sede,
  orden = venues.orden,
  notas = venues.notas,
  is_active = true
from venues
where sedes.nombre = venues.nombre;

with venues(id, nombre, direccion, telefono, tipo_sede, orden, notas) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Sede pendiente de confirmar', null, null, 'pendiente', 10, 'La sede de cada sesión se publicará cuando esté confirmada.'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Online / Teams', null, null, 'online', 20, 'Sesión online mediante Teams.'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'CS de Can Misses', 'C/ Corona, 20-36 (Edificio J- antiguo Hospital Can Misses), 07800 Eivissa', '971397010', 'centro_salud', 100, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'CS de Es Viver', 'C/ Músic Fermí Marí 11-15, 07800 Eivissa', '971 391 632/38', 'centro_salud', 110, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'CS de Sant Antoni de Portmany', 'C/ De Ses Séquies 6, 07820 Sant Antoni de Portmany', '971 397000', 'centro_salud', 120, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'CS de Sant Jordi de Ses Salines', 'C/ Timbal nº 2, 07817 Sant Josep de sa Talaia', '971 308 175', 'centro_salud', 130, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'CS de Sant Josep de sa Talaia', 'Carrer Can Cantó 19, 07830 Sant Josep de sa Talaia', '971 801077', 'centro_salud', 140, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'CS de Santa Eulària des Riu', 'C/ l''historiador Clapés s/n, 07840 Santa Eulària des Riu', '971 332453/6985', 'centro_salud', 150, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'CS de Vila', 'Avinguda Vuit d''agost 30, 07800 Eivissa', '971 195 140', 'centro_salud', 160, 'Centro de salud de Atención Primaria.'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Hospital Can Misses', 'Calle Corona, s/n, 07800 Eivissa', '971 397 000', 'hospital', 300, 'Sede hospitalaria posible.')
)
insert into public.sedes (id, nombre, direccion, telefono, tipo_sede, orden, notas, is_active)
select id, nombre, direccion, telefono, tipo_sede, orden, notas, true
from venues
where not exists (
  select 1
  from public.sedes
  where sedes.nombre = venues.nombre
);

drop policy if exists "sedes_public_select" on public.sedes;

create policy "sedes_public_select"
on public.sedes
for select
to anon, authenticated
using (is_active);
