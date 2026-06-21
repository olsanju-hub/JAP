-- Desactiva la inscripcion publica: la organizacion gestiona asignaciones desde admin.
-- Pendiente de aplicar con supabase db push tras revision.

update public.signup_dates
set
  public_selectable = false,
  status = 'no_publica'
where public_selectable = true
   or status <> 'no_publica';

revoke all on public.session_assignments from anon;
revoke all on public.session_assignments from public;

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_session_assignment', 'get_signup_options')
  loop
    execute format('revoke execute on function %s from anon', fn);
    execute format('revoke execute on function %s from authenticated', fn);
    execute format('revoke execute on function %s from public', fn);
  end loop;
end $$;

insert into public.site_settings (key, value, type, group_name, label, description) values
  (
    'home.title',
    'Jornadas de Actualización en Atención Primaria (JAP)',
    'textarea',
    'Inicio',
    'Título principal',
    'Título visible en la portada.'
  ),
  (
    'welcome.subtitle',
    'Jornadas de Actualización en Atención Primaria (JAP) 2026-2027',
    'text',
    'Bienvenida / instrucciones',
    'Subtítulo',
    'Subtítulo opcional visible en tarjeta y modal.'
  ),
  (
    'welcome.intro',
    'Las Jornadas de Actualización en Atención Primaria (JAP) son un programa anual de sesiones clínicas rotatorias, aprobado por la Comisión de Docencia, orientado a reforzar la formación práctica, la actualización basada en la evidencia y la integración entre residentes, tutores y profesionales del área.',
    'textarea',
    'Bienvenida / instrucciones',
    'Texto introductorio',
    'Resumen visible en la home y apertura del modal.'
  ),
  (
    'welcome.schedule_text',
    'Las JAP se desarrollarán entre el 4 de septiembre de 2026 y el 14 de mayo de 2027, con 13 sesiones aprobadas y producto final por sesión. La asignación de ponentes, tutores, centros y fechas se gestionará desde la organización.',
    'textarea',
    'Bienvenida / instrucciones',
    'Texto cronograma',
    'Descripción del cronograma general.'
  ),
  (
    'contact.coordination_value',
    'Organización JAP',
    'textarea',
    'Contacto',
    'Coordinación',
    'Texto de coordinación.'
  ),
  (
    'footer.text',
    'Jornadas de Actualización en Atención Primaria (JAP) · Programa anual 2026-2027.',
    'textarea',
    'Footer',
    'Texto del footer',
    'Texto visible en el pie de página.'
  )
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
