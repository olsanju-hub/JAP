-- Retira datos personales de la superficie publica de la app JAP.
-- La gestion de personas y asignaciones queda disponible para usuarios autenticados con RLS admin/editor.

revoke select on public.ponentes from anon;
revoke select on public.ponentes from public;
revoke select on public.sesion_ponentes from anon;
revoke select on public.sesion_ponentes from public;

insert into public.site_settings (key, value, type, group_name, label, description) values
  (
    'speakers.description',
    'La asignación docente será gestionada por la organización de las JAP.',
    'textarea',
    'Equipo docente',
    'Descripción',
    'Descripción breve de equipo docente.'
  )
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
