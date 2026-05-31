insert into public.jornadas (
  id,
  titulo,
  subtitulo,
  curso,
  descripcion,
  modalidad,
  teams_url,
  published
) values (
  '10000000-0000-4000-8000-000000000001',
  'Jornadas Docentes de Atención Primaria',
  'Programa anual de sesiones clínicas para profesionales de Atención Primaria',
  '2026-2027',
  'Espacio docente anual para profesionales de Atención Primaria, centrado en sesiones clínicas breves, aplicadas y orientadas a mejorar la práctica asistencial compartida.',
  'Preferentemente presencial, con opción online por Teams',
  'Enlace Teams pendiente de confirmar',
  true
) on conflict (id) do update set
  titulo = excluded.titulo,
  subtitulo = excluded.subtitulo,
  curso = excluded.curso,
  descripcion = excluded.descripcion,
  modalidad = excluded.modalidad,
  teams_url = excluded.teams_url,
  published = excluded.published;

insert into public.sedes (id, nombre, direccion, notas) values
  ('20000000-0000-4000-8000-000000000001', 'Sede pendiente de confirmar', null, 'La sede de cada sesión se publicará cuando esté confirmada.'),
  ('20000000-0000-4000-8000-000000000002', 'Hospital Can Misses', null, 'Sede incluida entre las opciones organizativas del programa.')
on conflict (id) do update set
  nombre = excluded.nombre,
  direccion = excluded.direccion,
  notas = excluded.notas;

insert into public.ponentes (id, nombre, especialidad, centro, bio, is_active) values
  ('30000000-0000-4000-8000-000000000001', 'Julio Fernando Ospino Arias', 'Residente de 4.º año de Medicina Familiar y Comunitaria', null, 'Pendiente de confirmar', true),
  ('30000000-0000-4000-8000-000000000002', 'Guillermo José Olivero Sanjuanelo', 'Residente de 4.º año de Medicina Familiar y Comunitaria', null, 'Pendiente de confirmar', true),
  ('30000000-0000-4000-8000-000000000003', 'Kelly Esther Escorcia Reyes', 'Residente de 4.º año de Medicina Familiar y Comunitaria', null, 'Pendiente de confirmar', true)
on conflict (id) do update set
  nombre = excluded.nombre,
  especialidad = excluded.especialidad,
  centro = excluded.centro,
  bio = excluded.bio,
  is_active = excluded.is_active;

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
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Hipertensión arterial en Atención Primaria', 'hipertension-arterial', 'Sesión 1', 1, 'Actualizar el abordaje diagnóstico, terapéutico y de seguimiento de la hipertensión arterial en Atención Primaria.', 'Diagnóstico y confirmación; estratificación del riesgo; objetivos de control; elección y ajuste de tratamiento; seguimiento, adherencia y abordaje de la HTA resistente.', array['Diagnóstico y confirmación', 'Estratificación del riesgo', 'Objetivos de control', 'Elección y ajuste de tratamiento', 'Seguimiento, adherencia y HTA resistente'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-hta.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Diabetes mellitus tipo 2 y protección cardiorrenal', 'diabetes-tipo-2', 'Sesión 2', 2, 'Revisar el manejo de la diabetes mellitus tipo 2 y la protección cardiorrenal desde Atención Primaria.', 'Cribado y diagnóstico; objetivos individualizados; manejo escalonado; papel de iSGLT2 y arGLP-1; control de comorbilidades; seguimiento y educación terapéutica.', array['Cribado y diagnóstico', 'Objetivos individualizados', 'Manejo escalonado', 'iSGLT2 y arGLP-1', 'Comorbilidades, seguimiento y educación terapéutica'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-diabetes.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Dislipemia y prevención cardiovascular', 'dislipemia-prevencion-cardiovascular', 'Sesión 3', 3, 'Homogeneizar criterios de prevención cardiovascular y tratamiento hipolipemiante en Atención Primaria.', 'Estimación del riesgo; indicación de estatinas y otros hipolipemiantes; objetivos de LDL; seguridad y monitorización; prevención primaria y secundaria en AP.', array['Estimación del riesgo', 'Estatinas y otros hipolipemiantes', 'Objetivos de LDL', 'Seguridad y monitorización', 'Prevención primaria y secundaria'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-dislipemia.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Obesidad, estilo de vida y entrevista motivacional', 'obesidad-estilo-vida', 'Sesión 4', 4, 'Revisar el abordaje integral de la obesidad y los cambios de estilo de vida desde la consulta.', 'Evaluación integral; objetivos realistas; intervención dietética y actividad física; entrevista motivacional; criterios de derivación; opciones farmacológicas y seguimiento.', array['Evaluación integral', 'Objetivos realistas', 'Intervención dietética y actividad física', 'Entrevista motivacional', 'Derivación, opciones farmacológicas y seguimiento'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-obesidad.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'EPOC y asma', 'epoc-asma', 'Sesión 5', 5, 'Actualizar el diagnóstico, control y seguimiento de EPOC y asma en Atención Primaria.', 'Diagnóstico y espirometría; clasificación y control; tratamiento inhalado; técnica inhalatoria; exacerbaciones; criterios de derivación y plan de acción.', array['Diagnóstico y espirometría', 'Clasificación y control', 'Tratamiento inhalado', 'Técnica inhalatoria', 'Exacerbaciones, derivación y plan de acción'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-epoc-asma.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Trastornos de salud mental frecuentes', 'salud-mental-frecuente', 'Sesión 6', 6, 'Revisar el abordaje inicial, seguimiento y derivación de los trastornos de salud mental frecuentes.', 'Abordaje de ansiedad, depresión e insomnio; evaluación del riesgo suicida; intervenciones no farmacológicas; uso prudente de psicofármacos; criterios de derivación y seguimiento.', array['Ansiedad, depresión e insomnio', 'Evaluación del riesgo suicida', 'Intervenciones no farmacológicas', 'Uso prudente de psicofármacos', 'Derivación y seguimiento'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-salud-mental.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Dolor osteomuscular y uso prudente de pruebas complementarias', 'dolor-osteomuscular', 'Sesión 7', 7, 'Actualizar el manejo del dolor osteomuscular frecuente y el uso prudente de pruebas complementarias.', 'Lumbalgia, cervicalgia y artrosis; banderas rojas; indicación de imagen y analítica; manejo escalonado del dolor; ejercicio terapéutico; derivación y seguridad farmacológica.', array['Lumbalgia, cervicalgia y artrosis', 'Banderas rojas', 'Imagen y analítica', 'Manejo escalonado del dolor', 'Ejercicio terapéutico, derivación y seguridad farmacológica'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-dolor-osteomuscular.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'Dermatología en Atención Primaria', 'dermatologia-atencion-primaria', 'Sesión 8', 8, 'Reforzar el reconocimiento y manejo inicial de lesiones dermatológicas frecuentes en Atención Primaria.', 'Lesiones frecuentes; criterios de alarma; dermatoscopia básica si disponible; tratamiento inicial; indicación de biopsia o derivación; educación y fotoprotección.', array['Lesiones frecuentes', 'Criterios de alarma', 'Dermatoscopia básica si disponible', 'Tratamiento inicial', 'Biopsia, derivación, educación y fotoprotección'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-dermatologia.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Patología digestiva frecuente y señales de alarma', 'patologia-digestiva-frecuente', 'Sesión 9', 9, 'Homogeneizar el manejo inicial de patología digestiva frecuente y la identificación de señales de alarma.', 'Dispepsia, ERGE y SII; manejo inicial; pruebas indicadas; anemia y sangrado digestivo; pérdida de peso y otros signos de alarma; criterios de derivación preferente.', array['Dispepsia, ERGE y SII', 'Manejo inicial', 'Pruebas indicadas', 'Anemia, sangrado digestivo y pérdida de peso', 'Signos de alarma y derivación preferente'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-patologia-digestiva.png', 'publicada', true),
  ('40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Fragilidad, pluripatología y seguridad farmacológica', 'fragilidad-pluripatologia', 'Sesión 10', 10, 'Revisar el abordaje de fragilidad, pluripatología y seguridad farmacológica con objetivos centrados en la persona.', 'Identificación de fragilidad; revisión de medicación y deprescripción; conciliación; prevención de caídas; objetivos centrados en la persona; coordinación con enfermería y trabajo social.', array['Identificación de fragilidad', 'Revisión de medicación y deprescripción', 'Conciliación', 'Prevención de caídas', 'Coordinación con enfermería y trabajo social'], 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-fragilidad.png', 'publicada', true)
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
  ('50000000-0000-4000-8000-000000000001', null, 'Programa anual de sesiones clínicas 2026-2027', 'pdf', 'Programa', 'assets/docs/programa-anual.pdf', null, 1, true),
  ('50000000-0000-4000-8000-000000000002', null, 'Plantilla Jornadas Docentes AP', 'pptx', 'Plantilla', 'assets/docs/plantilla-jornadas-docentes-ap.pptx', null, 2, true),
  ('50000000-0000-4000-8000-000000000003', null, 'Imagen promocional', 'imagen', 'Imágenes promocionales', 'assets/img/promocion.png', null, 3, true),
  ('50000000-0000-4000-8000-000000000004', null, 'Imagen promocional complementaria', 'imagen', 'Imágenes promocionales', 'assets/img/promocion-2.png', null, 4, true),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', 'Cartel sesión 1: Hipertensión arterial', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-hta.png', null, 5, true),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000002', 'Cartel sesión 2: Diabetes mellitus tipo 2', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-diabetes.png', null, 6, true),
  ('50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000003', 'Cartel sesión 3: Dislipemia y prevención cardiovascular', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-dislipemia.png', null, 7, true),
  ('50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000004', 'Cartel sesión 4: Obesidad, estilo de vida y entrevista motivacional', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-obesidad.png', null, 8, true),
  ('50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000005', 'Cartel sesión 5: EPOC y asma', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-epoc-asma.png', null, 9, true),
  ('50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000006', 'Cartel sesión 6: Trastornos de salud mental frecuentes', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-salud-mental.png', null, 10, true),
  ('50000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000007', 'Cartel sesión 7: Dolor osteomuscular', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-dolor-osteomuscular.png', null, 11, true),
  ('50000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000008', 'Cartel sesión 8: Dermatología en Atención Primaria', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-dermatologia.png', null, 12, true),
  ('50000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000009', 'Cartel sesión 9: Patología digestiva frecuente', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-patologia-digestiva.png', null, 13, true),
  ('50000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000010', 'Cartel sesión 10: Fragilidad, pluripatología y seguridad farmacológica', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-fragilidad.png', null, 14, true)
on conflict (id) do update set
  sesion_id = excluded.sesion_id,
  titulo = excluded.titulo,
  tipo = excluded.tipo,
  categoria = excluded.categoria,
  url = excluded.url,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  visible = excluded.visible;
