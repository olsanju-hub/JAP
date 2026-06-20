-- Limpia fechas antiguas del catalogo publico tras la actualizacion JAP 2026-2027.
-- No elimina fechas historicas si alguna asignacion, incluida anulada, las referencia.

with official_dates(date_value) as (
  values
    ('2026-09-04'::date),
    ('2026-09-25'::date),
    ('2026-10-16'::date),
    ('2026-11-06'::date),
    ('2026-11-27'::date),
    ('2026-12-18'::date),
    ('2027-01-15'::date),
    ('2027-02-05'::date),
    ('2027-02-26'::date),
    ('2027-03-19'::date),
    ('2027-04-09'::date),
    ('2027-04-30'::date),
    ('2027-05-14'::date)
)
delete from public.signup_dates d
where not exists (
    select 1 from official_dates o where o.date_value = d.date_value
  )
  and not exists (
    select 1
    from public.session_assignments a
    where a.signup_date_id = d.id
       or a.selected_public_date = d.date_value
       or a.final_date = d.date_value
  );

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
  with official_dates(date_value) as (
    values
      ('2026-09-04'::date),
      ('2026-09-25'::date),
      ('2026-10-16'::date),
      ('2026-11-06'::date),
      ('2026-11-27'::date),
      ('2026-12-18'::date),
      ('2027-01-15'::date),
      ('2027-02-05'::date),
      ('2027-02-26'::date),
      ('2027-03-19'::date),
      ('2027-04-09'::date),
      ('2027-04-30'::date),
      ('2027-05-14'::date)
  ),
  active_assignments as (
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
    join official_dates o on o.date_value = d.date_value
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
