create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  type text not null default 'text',
  group_name text,
  label text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

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

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

insert into public.site_settings (key, value, type, group_name, label, description) values
  ('home.title', 'Jornadas Docentes de Atención Primaria', 'textarea', 'Inicio', 'Título principal', 'Título visible en la portada.'),
  ('home.subtitle', 'Programa anual de sesiones clínicas para profesionales de Atención Primaria', 'textarea', 'Inicio', 'Subtítulo', 'Texto destacado bajo el título principal.'),
  ('home.description', 'Espacio docente anual para profesionales de Atención Primaria, centrado en sesiones clínicas breves, aplicadas y orientadas a mejorar la práctica asistencial compartida.', 'textarea', 'Inicio', 'Descripción', 'Descripción breve de las jornadas.'),
  ('home.primary_button', 'Ver agenda', 'text', 'Inicio', 'Botón principal', 'Texto del botón principal de la portada.'),
  ('home.secondary_button_sessions', 'Sesiones', 'text', 'Inicio', 'Botón sesiones', 'Texto del acceso rápido a sesiones.'),
  ('home.secondary_button_speakers', 'Equipo docente', 'text', 'Inicio', 'Botón equipo', 'Texto del acceso rápido a equipo docente.'),
  ('home.secondary_button_resources', 'Recursos', 'text', 'Inicio', 'Botón recursos', 'Texto del acceso rápido a recursos.'),
  ('home.metric_sessions_label', 'Sesiones', 'text', 'Datos clave', 'Etiqueta sesiones', 'Etiqueta del dato clave de sesiones.'),
  ('home.metric_sessions_value', '12', 'text', 'Datos clave', 'Valor sesiones', 'Valor del dato clave de sesiones.'),
  ('home.metric_course_label', 'Curso', 'text', 'Datos clave', 'Etiqueta curso', 'Etiqueta del dato clave de curso.'),
  ('home.metric_course_value', '2026-2027', 'text', 'Datos clave', 'Valor curso', 'Valor del curso.'),
  ('home.metric_format_label', 'Formato', 'text', 'Datos clave', 'Etiqueta formato', 'Etiqueta del formato.'),
  ('home.metric_format_value', 'Presencial preferente + Teams', 'text', 'Datos clave', 'Valor formato', 'Resumen visible de la modalidad.'),
  ('home.metric_duration_label', 'Duración', 'text', 'Datos clave', 'Etiqueta duración', 'Etiqueta de duración.'),
  ('home.metric_duration_value', '45-60 min', 'text', 'Datos clave', 'Valor duración', 'Duración visible en portada.'),
  ('agenda.title', 'Agenda', 'text', 'Agenda', 'Título', 'Título de la vista Agenda.'),
  ('agenda.description', 'Vista rápida del programa. Cada sesión abre su detalle completo en una ventana emergente.', 'textarea', 'Agenda', 'Descripción', 'Descripción breve de la agenda.'),
  ('sessions.title', 'Sesiones', 'text', 'Sesiones', 'Título', 'Título de la vista Sesiones.'),
  ('sessions.description', 'Contenido docente organizado por temas clínicos frecuentes en Atención Primaria.', 'textarea', 'Sesiones', 'Descripción', 'Descripción breve de sesiones.'),
  ('speakers.title', 'Equipo docente', 'text', 'Equipo docente', 'Título', 'Título de la vista Equipo docente.'),
  ('speakers.description', 'Organización, coordinación y ponentes asociados a las sesiones.', 'textarea', 'Equipo docente', 'Descripción', 'Descripción breve de equipo y ponentes.'),
  ('resources.title', 'Recursos', 'text', 'Recursos', 'Título', 'Título de la vista Recursos.'),
  ('resources.description', 'Material organizado por categorías compactas. Cada recurso se abre dentro de la app.', 'textarea', 'Recursos', 'Descripción', 'Descripción breve de recursos.'),
  ('contact.title', 'Contacto', 'text', 'Contacto', 'Título', 'Título de la vista Contacto.'),
  ('contact.description', 'Datos de coordinación del programa.', 'textarea', 'Contacto', 'Descripción', 'Descripción breve de contacto.'),
  ('contact.coordination_label', 'Coordinación', 'text', 'Contacto', 'Etiqueta coordinación', 'Etiqueta del campo coordinación.'),
  ('contact.coordination_value', 'Guillermo José Olivero Sanjuanelo, Julio Fernando Ospino Arias, Kelly Esther Escorcia Reyes, Valenska Vania Arellano Flores y Jorvi José Aguilar Valero', 'textarea', 'Contacto', 'Coordinación', 'Texto de coordinación.'),
  ('contact.email_label', 'Email', 'text', 'Contacto', 'Etiqueta email', 'Etiqueta del campo email.'),
  ('contact.email_value', 'Pendiente de confirmar', 'text', 'Contacto', 'Email', 'Email de contacto.'),
  ('contact.phone_label', 'Teléfono', 'text', 'Contacto', 'Etiqueta teléfono', 'Etiqueta del campo teléfono.'),
  ('contact.phone_value', 'Pendiente de confirmar', 'text', 'Contacto', 'Teléfono', 'Teléfono de contacto.'),
  ('footer.text', 'Jornadas Docentes de Atención Primaria · Programa anual 2026-2027.', 'textarea', 'Footer', 'Texto del footer', 'Texto visible en el pie de página.'),
  ('footer.admin_label', 'Admin', 'text', 'Footer', 'Etiqueta Admin', 'Texto del enlace al panel administrativo.')
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
