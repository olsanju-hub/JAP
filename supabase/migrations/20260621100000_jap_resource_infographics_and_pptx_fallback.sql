-- Publica las infografias informativas oficiales JAP 2026-2027 y mejora la ficha de la plantilla PPTX.
-- Pendiente de aplicar con supabase db push tras revision.

update public.recursos
set
  titulo = 'Plantilla de presentación JAP',
  tipo = 'pptx',
  categoria = 'Plantillas',
  descripcion = 'Plantilla común para preparar las sesiones docentes JAP. Esta plantilla debe descargarse para editarse en PowerPoint, Keynote, LibreOffice o similar.',
  visible = true
where url = 'assets/docs/plantilla-jornadas-docentes-ap.pptx';

with desired_resources (id, sesion_id, titulo, tipo, categoria, url, descripcion, orden, visible) as (
  values
  (
    '50000000-0000-4000-8000-000000000103'::uuid,
    null::uuid,
    'Infografía JAP: programa general',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-programa-general-01.png',
    'Material informativo oficial de las JAP 2026-2027.',
    3,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000104'::uuid,
    null::uuid,
    'Infografía JAP: calendario 2026-2027',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-calendario-2026-2027.png',
    'Material informativo oficial de las JAP 2026-2027.',
    4,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000105'::uuid,
    null::uuid,
    'Infografía JAP: convocatoria',
    'imagen',
    'Imágenes promocionales',
    'assets/img/infografia-jap-convocatoria.png',
    'Material informativo oficial de las JAP 2026-2027.',
    5,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000106'::uuid,
    null::uuid,
    'Infografía JAP: productos finales',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-productos-finales.png',
    'Material informativo oficial de las JAP 2026-2027.',
    6,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000107'::uuid,
    null::uuid,
    'Infografía JAP: cómo funcionan las jornadas',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-funcionamiento.png',
    'Material informativo oficial de las JAP 2026-2027.',
    7,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000108'::uuid,
    null::uuid,
    'Infografía JAP: programa general complementaria',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-programa-general-02.png',
    'Material informativo oficial de las JAP 2026-2027.',
    8,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000109'::uuid,
    null::uuid,
    'Infografía JAP: calendario en ruta 2026-2027',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-calendario-ruta-2026-2027.png',
    'Material informativo oficial de las JAP 2026-2027.',
    9,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000110'::uuid,
    null::uuid,
    'Infografía JAP: calendario lineal 2026-2027',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-calendario-lineal-2026-2027.png',
    'Material informativo oficial de las JAP 2026-2027.',
    10,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000111'::uuid,
    null::uuid,
    'Infografía JAP: calendario circular 2026-2027',
    'imagen',
    'Programa',
    'assets/img/infografia-jap-calendario-circular-2026-2027.png',
    'Material informativo oficial de las JAP 2026-2027.',
    11,
    true
  )
),
updated as (
  update public.recursos r
  set
    sesion_id = d.sesion_id,
    titulo = d.titulo,
    tipo = d.tipo,
    categoria = d.categoria,
    url = d.url,
    descripcion = d.descripcion,
    orden = d.orden,
    visible = d.visible
  from desired_resources d
  where r.url = d.url
     or r.titulo = d.titulo
  returning r.url
)
insert into public.recursos (id, sesion_id, titulo, tipo, categoria, url, descripcion, orden, visible)
select d.id, d.sesion_id, d.titulo, d.tipo, d.categoria, d.url, d.descripcion, d.orden, d.visible
from desired_resources d
where not exists (
  select 1
  from public.recursos r
  where r.url = d.url
     or r.titulo = d.titulo
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
