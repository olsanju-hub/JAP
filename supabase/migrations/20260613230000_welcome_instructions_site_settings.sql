-- Añade la configuración editable de bienvenida e instrucciones JAP.
-- No crea tablas nuevas: reutiliza public.site_settings y es idempotente por key.

create or replace function pg_temp.jap_json_array_min_length(raw_value text, min_length int)
returns boolean
language plpgsql
as $$
declare
  parsed jsonb;
begin
  if raw_value is null or btrim(raw_value) = '' then
    return false;
  end if;

  parsed := raw_value::jsonb;
  return jsonb_typeof(parsed) = 'array' and jsonb_array_length(parsed) >= min_length;
exception
  when others then
    return false;
end;
$$;

insert into public.site_settings (key, value, type, group_name, label, description) values
  (
    'welcome.visible',
    'true',
    'boolean',
    'Bienvenida / instrucciones',
    'Visible',
    'Muestra u oculta el bloque de bienvenida en la home.'
  ),
  (
    'welcome.title',
    'Bienvenida a las JAP',
    'text',
    'Bienvenida / instrucciones',
    'Título',
    'Título de la tarjeta y del modal.'
  ),
  (
    'welcome.subtitle',
    'Jornadas Docentes de Atención Primaria 2026-2027',
    'text',
    'Bienvenida / instrucciones',
    'Subtítulo',
    'Subtítulo opcional visible en tarjeta y modal.'
  ),
  (
    'welcome.intro',
    'Las Jornadas Docentes de Atención Primaria (JAP) son un programa anual de sesiones clínicas rotatorias, aprobado por la Comisión de Docencia, orientado a reforzar la formación práctica, la actualización basada en la evidencia y la integración entre residentes, tutores y profesionales del área.',
    'textarea',
    'Bienvenida / instrucciones',
    'Texto introductorio',
    'Resumen visible en la home y apertura del modal.'
  ),
  (
    'welcome.button_label',
    'Ver instrucciones y cronograma',
    'text',
    'Bienvenida / instrucciones',
    'Texto del botón',
    'Etiqueta del botón que abre el modal.'
  ),
  (
    'welcome.sections',
    $$[
      {
        "title": "Objetivo de las JAP",
        "text": "Las JAP buscan crear un espacio docente estable, práctico y compartido, centrado en problemas frecuentes de Atención Primaria. El objetivo es revisar la evidencia útil, compartir criterios de manejo y generar materiales aplicables en consulta.",
        "bullets": []
      },
      {
        "title": "Enfoque de cada sesión",
        "text": "Cada sesión debe partir de un caso clínico real o verosímil y responder preguntas clínicas concretas: qué hacer en consulta, cuándo tratar, cuándo revisar, cuándo derivar y qué errores conviene evitar.",
        "bullets": []
      },
      {
        "title": "Estructura recomendada",
        "text": "",
        "bullets": [
          "Caso clínico inicial.",
          "Planteamiento del problema en Atención Primaria.",
          "Revisión práctica de una guía clínica o evidencia relevante.",
          "Aplicación al manejo en consulta.",
          "Criterios de seguimiento, derivación o coordinación con otros niveles.",
          "Conclusiones prácticas.",
          "Material breve final."
        ]
      },
      {
        "title": "Papel del residente ponente",
        "text": "El residente preparará y presentará la sesión con un enfoque práctico, claro y aplicable. Se recomienda evitar revisiones teóricas extensas y priorizar decisiones clínicas, casos y mensajes útiles para la consulta.",
        "bullets": []
      },
      {
        "title": "Papel del tutor",
        "text": "El tutor acompañará la preparación de la sesión, revisará el enfoque clínico, ayudará a seleccionar la evidencia principal y asegurará que el contenido sea adecuado para la práctica real en Atención Primaria.",
        "bullets": []
      },
      {
        "title": "Apoyo de R3/R4",
        "text": "Los residentes de tercer y cuarto año podrán apoyar en la estructura docente, revisión de bibliografía, preparación del caso clínico, diseño de la presentación y elaboración del material final.",
        "bullets": []
      },
      {
        "title": "Material final esperado",
        "text": "Cada sesión debería terminar con un recurso breve y reutilizable: algoritmo, tabla resumen, checklist, hoja de manejo o puntos clave para consulta.",
        "bullets": []
      }
    ]$$,
    'json',
    'Bienvenida / instrucciones',
    'Secciones de instrucciones',
    'Lista estructurada de secciones con título, texto y bullets.'
  ),
  (
    'welcome.schedule_title',
    'Cronograma general',
    'text',
    'Bienvenida / instrucciones',
    'Título cronograma',
    'Título del bloque de cronograma general.'
  ),
  (
    'welcome.schedule_text',
    'Las JAP se desarrollarán entre septiembre de 2026 y mayo de 2027. La propuesta inicial contempla sesiones preferentemente los viernes, con una cadencia aproximada de cada tres semanas. Aunque se proponen 12 temas, se dejan 13 fechas inicialmente disponibles para facilitar la organización, permitir ajustes por incidencias o reservar alguna fecha si fuera necesario.',
    'textarea',
    'Bienvenida / instrucciones',
    'Texto cronograma',
    'Descripción del cronograma general.'
  ),
  (
    'welcome.dates_title',
    'Fechas inicialmente disponibles',
    'text',
    'Bienvenida / instrucciones',
    'Título fechas',
    'Título del listado de fechas.'
  ),
  (
    'welcome.dates',
    $$[
      { "date": "2026-09-04", "label": "Viernes 4 de septiembre de 2026.", "status": "disponible" },
      { "date": "2026-09-25", "label": "Viernes 25 de septiembre de 2026.", "status": "disponible" },
      { "date": "2026-10-16", "label": "Viernes 16 de octubre de 2026.", "status": "disponible" },
      { "date": "2026-11-06", "label": "Viernes 6 de noviembre de 2026.", "status": "disponible" },
      { "date": "2026-11-27", "label": "Viernes 27 de noviembre de 2026.", "status": "disponible" },
      { "date": "2026-12-18", "label": "Viernes 18 de diciembre de 2026.", "status": "disponible" },
      { "date": "2027-01-08", "label": "Viernes 8 de enero de 2027.", "status": "disponible" },
      { "date": "2027-01-29", "label": "Viernes 29 de enero de 2027.", "status": "disponible" },
      { "date": "2027-02-19", "label": "Viernes 19 de febrero de 2027.", "status": "disponible" },
      { "date": "2027-03-12", "label": "Viernes 12 de marzo de 2027.", "status": "disponible" },
      { "date": "2027-04-02", "label": "Viernes 2 de abril de 2027.", "status": "disponible" },
      { "date": "2027-04-23", "label": "Viernes 23 de abril de 2027.", "status": "disponible" },
      { "date": "2027-05-14", "label": "Viernes 14 de mayo de 2027.", "status": "disponible" }
    ]$$,
    'json',
    'Bienvenida / instrucciones',
    'Fechas inicialmente disponibles',
    'Fechas inicialmente disponibles como lista estructurada.'
  )
on conflict (key) do update set
  value = case
    when excluded.key = 'welcome.visible'
      and lower(btrim(coalesce(public.site_settings.value, ''))) not in ('true', 'false')
      then excluded.value
    when excluded.key in (
      'welcome.title',
      'welcome.subtitle',
      'welcome.intro',
      'welcome.button_label',
      'welcome.schedule_title',
      'welcome.schedule_text',
      'welcome.dates_title'
    )
      and btrim(coalesce(public.site_settings.value, '')) = ''
      then excluded.value
    when excluded.key = 'welcome.sections'
      and not pg_temp.jap_json_array_min_length(public.site_settings.value, 7)
      then excluded.value
    when excluded.key = 'welcome.dates'
      and not pg_temp.jap_json_array_min_length(public.site_settings.value, 13)
      then excluded.value
    else public.site_settings.value
  end,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
