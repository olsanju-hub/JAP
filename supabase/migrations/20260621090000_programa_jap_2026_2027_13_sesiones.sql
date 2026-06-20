-- Actualiza JAP 2026-2027 al programa aprobado de 13 sesiones.
-- No aplicar si existen asignaciones activas: la comprobacion inicial aborta la migracion.

do $$
begin
  if exists (
    select 1
    from public.session_assignments
    where status in ('recibida', 'revisada', 'confirmada')
  ) then
    raise exception 'No se puede actualizar el programa JAP: existen asignaciones activas.';
  end if;
end $$;

alter table public.sesiones
add column if not exists orientacion_docente text,
add column if not exists producto_final text;

insert into public.sedes (id, nombre, direccion, tipo_sede, orden, notas, is_active) values
  ('30000000-0000-4000-8000-000000000901', 'Edificio J', null, 'hospital', 901, 'Sede confirmada para la sesion 1.', true),
  ('30000000-0000-4000-8000-000000000913', 'Sala de Actos D', null, 'hospital', 913, 'Sede confirmada para la jornada final.', true)
on conflict (id) do update set
  nombre = excluded.nombre,
  direccion = excluded.direccion,
  tipo_sede = excluded.tipo_sede,
  orden = excluded.orden,
  notas = excluded.notas,
  is_active = excluded.is_active;

update public.sesiones
set is_active = false,
    estado = case when estado = 'realizada' then estado else 'archivada' end
where is_active = true;

update public.sesiones
set slug = slug || '-archivo-2026-previo'
where id not in (
    '40000000-0000-4000-8000-000000000101',
    '40000000-0000-4000-8000-000000000102',
    '40000000-0000-4000-8000-000000000103',
    '40000000-0000-4000-8000-000000000104',
    '40000000-0000-4000-8000-000000000105',
    '40000000-0000-4000-8000-000000000106',
    '40000000-0000-4000-8000-000000000107',
    '40000000-0000-4000-8000-000000000108',
    '40000000-0000-4000-8000-000000000109',
    '40000000-0000-4000-8000-000000000110',
    '40000000-0000-4000-8000-000000000111',
    '40000000-0000-4000-8000-000000000112',
    '40000000-0000-4000-8000-000000000113'
  )
  and slug in (
    'sindrome-cardiorrenal-metabolico',
    'hipertension-arterial',
    'diabetes-mellitus',
    'dislipemia',
    'insuficiencia-cardiaca',
    'obesidad',
    'epoc-asma',
    'dispepsia-erge-sii',
    'ansiedad-depresion-insomnio-bzd',
    'anticoncepcion-menopausia-trh',
    'manejo-del-dolor',
    'adulto-mayor',
    'jornada-final'
  )
  and slug not like '%-archivo-2026-previo';

insert into public.sesiones (
  id, jornada_id, sede_id, titulo, slug, bloque, orden, objetivo,
  orientacion_docente, producto_final, descripcion, metodologia,
  contenidos_clave, fecha, modalidad, teams_url, imagen_url, estado, is_active
)
select *
from (
  values
    ('40000000-0000-4000-8000-000000000101'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-000000000901'::uuid, 'Síndrome cardiorrenal metabólico', 'sindrome-cardiorrenal-metabolico', 'Sesión 1', 1, 'Integración clínica cardiometabólica y renal', 'Integración clínica cardiometabólica y renal', 'Infografía marco del programa', 'Integración clínica cardiometabólica y renal. Producto final previsto: Infografía marco del programa.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Paciente cardiometabólico y renal','Cribado inicial','Estratificación de riesgo','Seguimiento longitudinal','Criterios de alarma y derivación'], '2026-09-04'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-01-sindrome-cardiorrenal-metabolico.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000102'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Hipertensión arterial', 'hipertension-arterial', 'Sesión 2', 2, 'Prevención cardiovascular y manejo longitudinal', 'Prevención cardiovascular y manejo longitudinal', 'Algoritmo diagnóstico-terapéutico', 'Prevención cardiovascular y manejo longitudinal. Producto final previsto: Algoritmo diagnóstico-terapéutico.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Medición correcta','AMPA y MAPA','Estratificación de riesgo','Tratamiento inicial y escalado','Seguimiento y adherencia'], '2026-09-25'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-02-hipertension-arterial.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000103'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Diabetes mellitus', 'diabetes-mellitus', 'Sesión 3', 3, 'Cronicidad, riesgo vascular y complicaciones', 'Cronicidad, riesgo vascular y complicaciones', 'Tabla de manejo inicial', 'Cronicidad, riesgo vascular y complicaciones. Producto final previsto: Tabla de manejo inicial.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Objetivos individualizados','Tratamiento inicial','Riesgo vascular y renal','Cribado de complicaciones','Educación diabetológica'], '2026-10-16'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-03-diabetes-mellitus.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000104'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Dislipemia', 'dislipemia', 'Sesión 4', 4, 'Riesgo cardiovascular y decisión terapéutica', 'Riesgo cardiovascular y decisión terapéutica', 'Mapa de decisión terapéutica', 'Riesgo cardiovascular y decisión terapéutica. Producto final previsto: Mapa de decisión terapéutica.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Perfil lipídico','Riesgo cardiovascular','Objetivos de LDL','Estatinas y ezetimiba','Intolerancia y derivación'], '2026-11-06'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-04-dislipemia.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000105'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Insuficiencia cardiaca', 'insuficiencia-cardiaca', 'Sesión 5', 5, 'Cronicidad, diagnóstico inicial y descompensación', 'Cronicidad, diagnóstico inicial y descompensación', 'Checklist de IC en AP', 'Cronicidad, diagnóstico inicial y descompensación. Producto final previsto: Checklist de IC en AP.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Sospecha clínica','Pruebas iniciales','Pilares terapéuticos','Seguimiento en AP','Descompensación y derivación'], '2026-11-27'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-05-insuficiencia-cardiaca.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000106'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Obesidad', 'obesidad', 'Sesión 6', 6, 'Abordaje integral y longitudinal', 'Abordaje integral y longitudinal', 'Infografía de intervención escalonada', 'Abordaje integral y longitudinal. Producto final previsto: Infografía de intervención escalonada.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Valoración integral','Comorbilidades','Entrevista motivacional','Intervención escalonada','Seguimiento longitudinal'], '2026-12-18'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-06-obesidad.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000107'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'EPOC y asma', 'epoc-asma', 'Sesión 7', 7, 'Respiratorio frecuente en AP', 'Respiratorio frecuente en AP', 'Guía de inhaladores y crisis', 'Respiratorio frecuente en AP. Producto final previsto: Guía de inhaladores y crisis.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Historia respiratoria','Espirometría básica','Tratamiento inhalado','Técnica y adherencia','Exacerbaciones y derivación'], '2027-01-15'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-07-epoc-asma.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000108'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Dispepsia, ERGE y SII: manejo inicial en AP y criterios de derivación', 'dispepsia-erge-sii', 'Sesión 8', 8, 'Digestivo frecuente y uso racional de pruebas', 'Digestivo frecuente y uso racional de pruebas', 'Algoritmo digestivo de AP', 'Digestivo frecuente y uso racional de pruebas. Producto final previsto: Algoritmo digestivo de AP.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Dispepsia','ERGE','SII','Uso racional de pruebas','Criterios de derivación'], '2027-02-05'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-08-dispepsia-erge-sii.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000109'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Ansiedad, depresión, insomnio y desprescripción de BZD', 'ansiedad-depresion-insomnio-bzd', 'Sesión 9', 9, 'Salud mental frecuente y seguridad clínica', 'Salud mental frecuente y seguridad clínica', 'Plan de desprescripción', 'Salud mental frecuente y seguridad clínica. Producto final previsto: Plan de desprescripción.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Entrevista clínica breve','Riesgo suicida','Tratamiento inicial','Insomnio','Desprescripción de benzodiacepinas'], '2027-02-26'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-09-salud-mental-bzd.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000110'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Anticoncepción, menopausia y TRH: diagnóstico y tratamiento', 'anticoncepcion-menopausia-trh', 'Sesión 10', 10, 'Salud de la mujer en AP', 'Salud de la mujer en AP', 'Tabla de elección terapéutica', 'Salud de la mujer en AP. Producto final previsto: Tabla de elección terapéutica.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Consejo anticonceptivo','Contraindicaciones','Menopausia','TRH','Criterios de derivación'], '2027-03-19'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-10-anticoncepcion-menopausia-trh.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000111'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Manejo del dolor', 'manejo-del-dolor', 'Sesión 11', 11, 'Síntoma transversal, seguridad e iatrogenia', 'Síntoma transversal, seguridad e iatrogenia', 'Escalera analgésica práctica', 'Síntoma transversal, seguridad e iatrogenia. Producto final previsto: Escalera analgésica práctica.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Tipo de dolor','Seguridad farmacológica','Opioides','Dolor en paciente frágil','Banderas rojas'], '2027-04-09'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-11-manejo-dolor.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000112'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, null::uuid, 'Atención integral del adulto mayor', 'adulto-mayor', 'Sesión 12', 12, 'Geriatría AP, fragilidad y continuidad', 'Geriatría AP, fragilidad y continuidad', 'Checklist geriátrico', 'Geriatría AP, fragilidad y continuidad. Producto final previsto: Checklist geriátrico.', 'Caso clínico inicial, revisión práctica y cierre con material final reutilizable.', array['Valoración geriátrica breve','Fragilidad','Polifarmacia','Prevención de caídas','Continuidad asistencial'], '2027-04-30'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-12-adulto-mayor.png', 'publicada', true),
    ('40000000-0000-4000-8000-000000000113'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-000000000913'::uuid, 'Jornada final', 'jornada-final', 'Sesión 13', 13, 'Síntesis, transferencia y banco común de materiales', 'Síntesis, transferencia y banco común de materiales', 'Banco final de infografías', 'Síntesis, transferencia y banco común de materiales. Producto final previsto: Banco final de infografías.', 'Presentación de productos finales, revisión de utilidad clínica y cierre del banco común de materiales.', array['Presentación de productos finales','Revisión de utilidad clínica','Casos integradores','Banco común de materiales','Evaluación del programa'], '2027-05-14'::date, 'Preferentemente presencial, con opción online por Teams', 'Enlace Teams pendiente de confirmar', 'assets/img/sesion-13-jornada-final.png', 'publicada', true)
) as s(id, jornada_id, sede_id, titulo, slug, bloque, orden, objetivo, orientacion_docente, producto_final, descripcion, metodologia, contenidos_clave, fecha, modalidad, teams_url, imagen_url, estado, is_active)
on conflict (id) do update set
  sede_id = excluded.sede_id,
  titulo = excluded.titulo,
  slug = excluded.slug,
  bloque = excluded.bloque,
  orden = excluded.orden,
  objetivo = excluded.objetivo,
  orientacion_docente = excluded.orientacion_docente,
  producto_final = excluded.producto_final,
  descripcion = excluded.descripcion,
  metodologia = excluded.metodologia,
  contenidos_clave = excluded.contenidos_clave,
  fecha = excluded.fecha,
  modalidad = excluded.modalidad,
  teams_url = excluded.teams_url,
  imagen_url = excluded.imagen_url,
  estado = excluded.estado,
  is_active = excluded.is_active;

update public.signup_dates
set public_selectable = false,
    status = 'no_publica'
where date_value not in (
  '2026-09-04','2026-09-25','2026-10-16','2026-11-06','2026-11-27','2026-12-18',
  '2027-01-15','2027-02-05','2027-02-26','2027-03-19','2027-04-09','2027-04-30','2027-05-14'
);

insert into public.signup_dates (date_value, label, sort_order, status, public_selectable) values
  ('2026-09-04', 'Viernes 4 de septiembre de 2026', 10, 'disponible', true),
  ('2026-09-25', 'Viernes 25 de septiembre de 2026', 20, 'disponible', true),
  ('2026-10-16', 'Viernes 16 de octubre de 2026', 30, 'disponible', true),
  ('2026-11-06', 'Viernes 6 de noviembre de 2026', 40, 'disponible', true),
  ('2026-11-27', 'Viernes 27 de noviembre de 2026', 50, 'disponible', true),
  ('2026-12-18', 'Viernes 18 de diciembre de 2026', 60, 'disponible', true),
  ('2027-01-15', 'Viernes 15 de enero de 2027', 70, 'disponible', true),
  ('2027-02-05', 'Viernes 5 de febrero de 2027', 80, 'disponible', true),
  ('2027-02-26', 'Viernes 26 de febrero de 2027', 90, 'disponible', true),
  ('2027-03-19', 'Viernes 19 de marzo de 2027', 100, 'disponible', true),
  ('2027-04-09', 'Viernes 9 de abril de 2027', 110, 'disponible', true),
  ('2027-04-30', 'Viernes 30 de abril de 2027', 120, 'disponible', true),
  ('2027-05-14', 'Viernes 14 de mayo de 2027', 130, 'no_publica', false)
on conflict (date_value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  status = excluded.status,
  public_selectable = excluded.public_selectable;

create or replace function public.get_signup_options()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sessions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'slug', s.slug,
            'title', s.titulo,
            'block', s.bloque,
            'order', s.orden
          )
          order by s.orden nulls last, s.titulo
        )
        from public.sesiones s
        where s.is_active = true
          and s.estado = 'publicada'
          and s.slug <> 'jornada-final'
          and not exists (
            select 1
            from public.session_assignments a
            where a.session_id = s.id
              and a.status in ('recibida', 'revisada', 'confirmada')
          )
      ),
      '[]'::jsonb
    ),
    'dates',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', d.id,
            'date', d.date_value,
            'label', d.label,
            'status', d.status,
            'sort_order', d.sort_order
          )
          order by d.sort_order, d.date_value
        )
        from public.signup_dates d
        where d.public_selectable = true
          and d.status in ('disponible', 'reserva')
          and not exists (
            select 1
            from public.session_assignments a
            where a.final_date = d.date_value
              and a.status in ('recibida', 'revisada', 'confirmada')
          )
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.get_public_agenda()
returns table (
  date_value date,
  label text,
  sort_order integer,
  is_initial_date boolean,
  status_public text,
  session_id uuid,
  session_slug text,
  session_title text,
  session_block text,
  health_center_public text,
  assignment_status text
)
language sql
security definer
set search_path = public
as $$
  with active_assignments as (
    select a.*, s.slug, s.titulo, s.bloque
    from public.session_assignments a
    join public.sesiones s on s.id = a.session_id
    where a.status in ('recibida', 'revisada', 'confirmada')
      and s.is_active = true
      and s.estado in ('publicada', 'realizada')
  ),
  planned_sessions as (
    select s.id, s.slug, s.titulo, s.bloque, s.fecha
    from public.sesiones s
    where s.is_active = true
      and s.estado in ('publicada', 'realizada')
      and s.fecha is not null
  ),
  initial_rows as (
    select
      d.date_value,
      d.label,
      d.sort_order,
      true as is_initial_date,
      case
        when a.id is not null then 'Asignada'
        when d.public_selectable = false or d.status = 'no_publica' then 'No inscribible'
        else 'Disponible'
      end as status_public,
      coalesce(a.session_id, p.id) as session_id,
      coalesce(a.slug, p.slug) as session_slug,
      coalesce(a.titulo, p.titulo) as session_title,
      coalesce(a.bloque, p.bloque) as session_block,
      case when a.show_public_health_center then nullif(a.public_health_center, '') else null end as health_center_public,
      a.status as assignment_status
    from public.signup_dates d
    left join active_assignments a on a.final_date = d.date_value
    left join planned_sessions p on p.fecha = d.date_value
  ),
  extra_rows as (
    select
      a.final_date as date_value,
      null::text as label,
      1000 + row_number() over (order by a.final_date)::integer as sort_order,
      false as is_initial_date,
      'Asignada' as status_public,
      a.session_id,
      a.slug as session_slug,
      a.titulo as session_title,
      a.bloque as session_block,
      case when a.show_public_health_center then nullif(a.public_health_center, '') else null end as health_center_public,
      a.status as assignment_status
    from active_assignments a
    where not exists (
      select 1
      from public.signup_dates d
      where d.date_value = a.final_date
    )
  )
  select *
  from (
    select * from initial_rows
    union all
    select * from extra_rows
  ) agenda
  order by date_value, sort_order;
$$;

update public.recursos
set visible = false
where categoria in ('Carteles de sesiones', 'Imágenes promocionales', 'Programa')
  and url <> 'assets/docs/plantilla-jornadas-docentes-ap.pptx';

insert into public.recursos (id, sesion_id, titulo, tipo, categoria, url, descripcion, orden, visible) values
  ('50000000-0000-4000-8000-000000000101', null, 'Programa anual JAP 2026-2027', 'pdf', 'Programa', 'assets/docs/programa-anual-jap-2026-2027.pdf', null, 1, true),
  ('50000000-0000-4000-8000-000000000102', null, 'Programa anual JAP 2026-2027 editable', 'otro', 'Programa', 'assets/docs/programa-anual-jap-2026-2027-editable.docx', null, 2, true),
  ('50000000-0000-4000-8000-000000000103', null, 'Infografía JAP: programa general', 'imagen', 'Programa', 'assets/img/infografia-jap-programa-general-01.png', null, 3, true),
  ('50000000-0000-4000-8000-000000000104', null, 'Infografía JAP: calendario 2026-2027', 'imagen', 'Programa', 'assets/img/infografia-jap-calendario-2026-2027.png', null, 4, true),
  ('50000000-0000-4000-8000-000000000105', null, 'Infografía JAP: convocatoria', 'imagen', 'Imágenes promocionales', 'assets/img/infografia-jap-convocatoria.png', null, 5, true),
  ('50000000-0000-4000-8000-000000000106', null, 'Infografía JAP: productos finales', 'imagen', 'Programa', 'assets/img/infografia-jap-productos-finales.png', null, 6, true),
  ('50000000-0000-4000-8000-000000000107', null, 'Infografía JAP: cómo funcionan las jornadas', 'imagen', 'Programa', 'assets/img/infografia-jap-funcionamiento.png', null, 7, true),
  ('50000000-0000-4000-8000-000000000201', '40000000-0000-4000-8000-000000000101', 'Cartel Sesión 1: Síndrome cardiorrenal metabólico', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-01-sindrome-cardiorrenal-metabolico.png', null, 20, true),
  ('50000000-0000-4000-8000-000000000202', '40000000-0000-4000-8000-000000000102', 'Cartel Sesión 2: Hipertensión arterial', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-02-hipertension-arterial.png', null, 21, true),
  ('50000000-0000-4000-8000-000000000203', '40000000-0000-4000-8000-000000000103', 'Cartel Sesión 3: Diabetes mellitus', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-03-diabetes-mellitus.png', null, 22, true),
  ('50000000-0000-4000-8000-000000000204', '40000000-0000-4000-8000-000000000104', 'Cartel Sesión 4: Dislipemia', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-04-dislipemia.png', null, 23, true),
  ('50000000-0000-4000-8000-000000000205', '40000000-0000-4000-8000-000000000105', 'Cartel Sesión 5: Insuficiencia cardiaca', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-05-insuficiencia-cardiaca.png', null, 24, true),
  ('50000000-0000-4000-8000-000000000206', '40000000-0000-4000-8000-000000000106', 'Cartel Sesión 6: Obesidad', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-06-obesidad.png', null, 25, true),
  ('50000000-0000-4000-8000-000000000207', '40000000-0000-4000-8000-000000000107', 'Cartel Sesión 7: EPOC y asma', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-07-epoc-asma.png', null, 26, true),
  ('50000000-0000-4000-8000-000000000208', '40000000-0000-4000-8000-000000000108', 'Cartel Sesión 8: Dispepsia, ERGE y SII', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-08-dispepsia-erge-sii.png', null, 27, true),
  ('50000000-0000-4000-8000-000000000209', '40000000-0000-4000-8000-000000000109', 'Cartel Sesión 9: Ansiedad, depresión, insomnio y desprescripción de BZD', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-09-salud-mental-bzd.png', null, 28, true),
  ('50000000-0000-4000-8000-000000000210', '40000000-0000-4000-8000-000000000110', 'Cartel Sesión 10: Anticoncepción, menopausia y TRH', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-10-anticoncepcion-menopausia-trh.png', null, 29, true),
  ('50000000-0000-4000-8000-000000000211', '40000000-0000-4000-8000-000000000111', 'Cartel Sesión 11: Manejo del dolor', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-11-manejo-dolor.png', null, 30, true),
  ('50000000-0000-4000-8000-000000000212', '40000000-0000-4000-8000-000000000112', 'Cartel Sesión 12: Atención integral del adulto mayor', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-12-adulto-mayor.png', null, 31, true),
  ('50000000-0000-4000-8000-000000000213', '40000000-0000-4000-8000-000000000113', 'Cartel Sesión 13: Jornada final', 'cartel', 'Carteles de sesiones', 'assets/img/sesion-13-jornada-final.png', null, 32, true)
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
  ('home.title', 'Jornadas de Actualización en Atención Primaria (JAP)', 'text', 'Inicio', 'Título principal', null),
  ('home.subtitle', 'Programa docente 2026-2027', 'text', 'Inicio', 'Subtítulo', null),
  ('home.description', 'Programa docente anual de sesiones clínicas prácticas, centradas en problemas frecuentes de Atención Primaria y orientadas a decisiones de consulta.', 'textarea', 'Inicio', 'Descripción', null),
  ('home.metric_sessions_value', '13', 'text', 'Datos clave', 'Valor sesiones', null),
  ('agenda.description', 'Vista rápida del programa 2026-2027 con 13 sesiones aprobadas.', 'textarea', 'Agenda', 'Descripción agenda', null),
  ('resources.description', 'Material organizado por categorías. Cada recurso se abre dentro de la app y puede descargarse.', 'textarea', 'Recursos', 'Descripción recursos', null),
  ('welcome.schedule_text', 'Las JAP se desarrollarán entre el 4 de septiembre de 2026 y el 14 de mayo de 2027, con 13 sesiones aprobadas y producto final por sesión.', 'textarea', 'Bienvenida', 'Cronograma', null)
on conflict (key) do update set
  value = excluded.value,
  type = excluded.type,
  group_name = excluded.group_name,
  label = excluded.label,
  description = excluded.description;
