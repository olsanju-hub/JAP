-- Retira texto visible antiguo de contacto y bienvenida en la superficie publica.
-- No elimina personas, sesiones, asignaciones ni datos historicos.

insert into public.site_settings (key, value, type, group_name, label, description) values
  (
    'contact.coordination_value',
    'Organización JAP',
    'textarea',
    'Contacto',
    'Coordinación',
    'Texto de coordinación.'
  ),
  (
    'welcome.sections',
    '[
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
        "title": "Apoyo docente",
        "text": "La preparación de las sesiones contará con apoyo organizativo para orientar la estructura, los materiales y el enfoque práctico de cada tema.",
        "bullets": []
      },
      {
        "title": "Material final esperado",
        "text": "Cada sesión debería terminar con un recurso breve y reutilizable: algoritmo, tabla resumen, checklist, hoja de manejo o puntos clave para consulta.",
        "bullets": []
      }
    ]',
    'json',
    'Bienvenida',
    'Secciones',
    'Secciones informativas del dialogo de bienvenida.'
  )
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
