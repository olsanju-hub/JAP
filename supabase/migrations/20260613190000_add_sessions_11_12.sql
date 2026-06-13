-- Añade los temas 11 y 12 al programa JAP 2026-2027 y actualiza recursos/carteles.

insert into public.sesiones (
  id,
  jornada_id,
  titulo,
  slug,
  bloque,
  orden,
  objetivo,
  descripcion,
  contenidos_clave,
  modalidad,
  teams_url,
  imagen_url,
  estado,
  is_active
) values
  (
    '40000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000001',
    'Ginecología en Atención Primaria',
    'ginecologia-ap',
    'Sesión 11',
    11,
    'Revisar el abordaje práctico de la salud de la mujer y los problemas ginecológicos frecuentes en Atención Primaria.',
    'Abordaje práctico de problemas ginecológicos frecuentes en Atención Primaria, salud sexual y reproductiva, anticoncepción, cribado, menopausia, síntomas ginecológicos frecuentes, criterios de derivación y coordinación con Ginecología.',
    array['Alteraciones menstruales', 'Anticoncepción y salud sexual', 'Síntomas vulvovaginales', 'Sangrado uterino anómalo y menopausia', 'Cribado, criterios de alarma y derivación preferente'],
    'Preferentemente presencial, con opción online por Teams',
    'Enlace Teams pendiente de confirmar',
    'assets/img/sesion-ginecologia-ap.png',
    'publicada',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000001',
    'Insuficiencia cardiaca crónica en Atención Primaria',
    'insuficiencia-cardiaca-cronica',
    'Sesión 12',
    12,
    'Actualizar el seguimiento longitudinal de la insuficiencia cardiaca crónica desde Atención Primaria y la coordinación asistencial.',
    'Seguimiento longitudinal de la insuficiencia cardiaca crónica desde Atención Primaria, identificación de descompensaciones, optimización terapéutica, educación sanitaria, autocuidados, coordinación con Cardiología/Urgencias y criterios de derivación.',
    array['Paciente con diagnóstico reciente', 'Revisión tras alta hospitalaria', 'Ajuste de tratamiento y control de síntomas', 'Control de peso, diuresis y signos de alarma', 'Comorbilidad, derivación y prevención de reingresos'],
    'Preferentemente presencial, con opción online por Teams',
    'Enlace Teams pendiente de confirmar',
    'assets/img/sesion-insuficiencia-cardiaca-cronica.png',
    'publicada',
    true
  )
on conflict (id) do update set
  titulo = excluded.titulo,
  slug = excluded.slug,
  bloque = excluded.bloque,
  orden = excluded.orden,
  objetivo = excluded.objetivo,
  descripcion = excluded.descripcion,
  contenidos_clave = excluded.contenidos_clave,
  modalidad = excluded.modalidad,
  teams_url = excluded.teams_url,
  imagen_url = excluded.imagen_url,
  estado = excluded.estado,
  is_active = excluded.is_active;

insert into public.recursos (id, sesion_id, titulo, tipo, categoria, url, descripcion, orden, visible) values
  (
    '50000000-0000-4000-8000-000000000015',
    '40000000-0000-4000-8000-000000000011',
    'Cartel sesión 11: Ginecología en Atención Primaria',
    'cartel',
    'Carteles de sesiones',
    'assets/img/sesion-ginecologia-ap.png',
    null,
    15,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000016',
    '40000000-0000-4000-8000-000000000012',
    'Cartel sesión 12: Insuficiencia cardiaca crónica',
    'cartel',
    'Carteles de sesiones',
    'assets/img/sesion-insuficiencia-cardiaca-cronica.png',
    null,
    16,
    true
  )
on conflict (id) do update set
  sesion_id = excluded.sesion_id,
  titulo = excluded.titulo,
  tipo = excluded.tipo,
  categoria = excluded.categoria,
  url = excluded.url,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  visible = excluded.visible;

insert into public.site_settings (key, value, type, group_name, label, description) values
  ('home.metric_sessions_value', '12', 'text', 'Datos clave', 'Valor sesiones', 'Valor del dato clave de sesiones.')
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
