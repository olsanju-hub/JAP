-- Sistema de inscripción y asignación de sesiones JAP.
-- La reserva pública se hace por RPC y la garantía anti-duplicados vive en índices únicos parciales.

create table if not exists public.signup_dates (
  id uuid primary key default gen_random_uuid(),
  date_value date not null unique,
  label text not null,
  sort_order integer not null,
  status text not null default 'disponible' check (status in ('disponible', 'reserva', 'no_publica')),
  public_selectable boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sesiones(id) on delete restrict,
  signup_date_id uuid references public.signup_dates(id) on delete set null,
  selected_public_date date not null,
  final_date date not null,
  status text not null default 'recibida' check (status in ('recibida', 'revisada', 'confirmada', 'anulada')),
  full_name text not null,
  email text not null,
  phone text not null,
  profile text not null check (profile in ('R1', 'R2', 'R3', 'R4', 'EIR', 'FIR', 'tutor/a', 'otro')),
  health_center text not null,
  tutor_name text,
  other_residents text,
  comments text,
  internal_notes text,
  public_health_center text,
  show_public_health_center boolean not null default false,
  reviewed_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists session_assignments_one_active_per_session
on public.session_assignments (session_id)
where status in ('recibida', 'revisada', 'confirmada');

create unique index if not exists session_assignments_one_active_per_final_date
on public.session_assignments (final_date)
where status in ('recibida', 'revisada', 'confirmada');

create unique index if not exists session_assignments_one_active_per_public_date_when_final
on public.session_assignments (selected_public_date)
where status in ('recibida', 'revisada', 'confirmada')
  and selected_public_date = final_date;

create index if not exists session_assignments_status_idx
on public.session_assignments (status, final_date);

create index if not exists signup_dates_sort_idx
on public.signup_dates (sort_order, date_value);

drop trigger if exists signup_dates_set_updated_at on public.signup_dates;
create trigger signup_dates_set_updated_at
before update on public.signup_dates
for each row execute function public.set_updated_at();

drop trigger if exists session_assignments_set_updated_at on public.session_assignments;
create trigger session_assignments_set_updated_at
before update on public.session_assignments
for each row execute function public.set_updated_at();

insert into public.signup_dates (date_value, label, sort_order, status, public_selectable) values
  ('2026-09-04', 'Viernes 4 de septiembre de 2026', 10, 'disponible', true),
  ('2026-09-25', 'Viernes 25 de septiembre de 2026', 20, 'disponible', true),
  ('2026-10-16', 'Viernes 16 de octubre de 2026', 30, 'disponible', true),
  ('2026-11-06', 'Viernes 6 de noviembre de 2026', 40, 'disponible', true),
  ('2026-11-27', 'Viernes 27 de noviembre de 2026', 50, 'disponible', true),
  ('2026-12-18', 'Viernes 18 de diciembre de 2026', 60, 'disponible', true),
  ('2027-01-08', 'Viernes 8 de enero de 2027', 70, 'disponible', true),
  ('2027-01-29', 'Viernes 29 de enero de 2027', 80, 'disponible', true),
  ('2027-02-19', 'Viernes 19 de febrero de 2027', 90, 'disponible', true),
  ('2027-03-12', 'Viernes 12 de marzo de 2027', 100, 'disponible', true),
  ('2027-04-02', 'Viernes 2 de abril de 2027', 110, 'disponible', true),
  ('2027-04-23', 'Viernes 23 de abril de 2027', 120, 'disponible', true),
  ('2027-05-14', 'Viernes 14 de mayo de 2027', 130, 'disponible', true)
on conflict (date_value) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

alter table public.signup_dates enable row level security;
alter table public.session_assignments enable row level security;

drop policy if exists "signup_dates_public_select" on public.signup_dates;
create policy "signup_dates_public_select"
on public.signup_dates
for select
to anon, authenticated
using (true);

drop policy if exists "signup_dates_admin_editor_manage" on public.signup_dates;
create policy "signup_dates_admin_editor_manage"
on public.signup_dates
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "session_assignments_admin_editor_select" on public.session_assignments;
create policy "session_assignments_admin_editor_select"
on public.session_assignments
for select
to authenticated
using (public.is_admin_or_editor());

drop policy if exists "session_assignments_admin_editor_insert" on public.session_assignments;
create policy "session_assignments_admin_editor_insert"
on public.session_assignments
for insert
to authenticated
with check (public.is_admin_or_editor());

drop policy if exists "session_assignments_admin_editor_update" on public.session_assignments;
create policy "session_assignments_admin_editor_update"
on public.session_assignments
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

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
  initial_rows as (
    select
      d.date_value,
      d.label,
      d.sort_order,
      true as is_initial_date,
      case when a.id is null then 'Disponible' else 'Asignada' end as status_public,
      a.session_id,
      a.slug as session_slug,
      a.titulo as session_title,
      a.bloque as session_block,
      case when a.show_public_health_center then nullif(a.public_health_center, '') else null end as health_center_public,
      a.status as assignment_status
    from public.signup_dates d
    left join active_assignments a on a.final_date = d.date_value
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

create or replace function public.create_session_assignment(
  p_session_id uuid,
  p_signup_date_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_profile text,
  p_health_center text,
  p_tutor_name text default null,
  p_other_residents text default null,
  p_comments text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_date public.signup_dates%rowtype;
  selected_session public.sesiones%rowtype;
  new_assignment_id uuid;
begin
  if btrim(coalesce(p_full_name, '')) = ''
    or btrim(coalesce(p_email, '')) = ''
    or btrim(coalesce(p_phone, '')) = ''
    or btrim(coalesce(p_health_center, '')) = '' then
    raise exception 'Completa los campos obligatorios antes de enviar la inscripción.';
  end if;

  if p_profile not in ('R1', 'R2', 'R3', 'R4', 'EIR', 'FIR', 'tutor/a', 'otro') then
    raise exception 'El perfil seleccionado no es válido.';
  end if;

  select *
  into selected_session
  from public.sesiones
  where id = p_session_id
    and is_active = true
    and estado = 'publicada';

  if not found then
    raise exception 'La sesión seleccionada no está disponible.';
  end if;

  select *
  into selected_date
  from public.signup_dates
  where id = p_signup_date_id
    and public_selectable = true
    and status in ('disponible', 'reserva');

  if not found then
    raise exception 'La fecha seleccionada no está disponible.';
  end if;

  if exists (
    select 1
    from public.session_assignments
    where session_id = p_session_id
      and status in ('recibida', 'revisada', 'confirmada')
  ) then
    raise exception 'La sesión seleccionada acaba de ser reservada. Elige otra sesión.';
  end if;

  if exists (
    select 1
    from public.session_assignments
    where final_date = selected_date.date_value
      and status in ('recibida', 'revisada', 'confirmada')
  ) then
    raise exception 'La fecha seleccionada acaba de ser reservada. Elige otra fecha.';
  end if;

  insert into public.session_assignments (
    session_id,
    signup_date_id,
    selected_public_date,
    final_date,
    status,
    full_name,
    email,
    phone,
    profile,
    health_center,
    tutor_name,
    other_residents,
    comments
  ) values (
    p_session_id,
    p_signup_date_id,
    selected_date.date_value,
    selected_date.date_value,
    'recibida',
    btrim(p_full_name),
    lower(btrim(p_email)),
    btrim(p_phone),
    p_profile,
    btrim(p_health_center),
    nullif(btrim(coalesce(p_tutor_name, '')), ''),
    nullif(btrim(coalesce(p_other_residents, '')), ''),
    nullif(btrim(coalesce(p_comments, '')), '')
  )
  returning id into new_assignment_id;

  return jsonb_build_object(
    'id', new_assignment_id,
    'status', 'recibida',
    'message', 'Inscripción registrada. La sesión y la fecha quedan reservadas.'
  );
exception
  when unique_violation then
    raise exception 'La sesión o la fecha seleccionada acaba de ser reservada. Elige otra opción.';
end;
$$;

revoke all on public.session_assignments from anon;
grant select, insert, update on public.session_assignments to authenticated;
grant select on public.signup_dates to anon, authenticated;
grant insert, update, delete on public.signup_dates to authenticated;

revoke execute on function public.get_signup_options() from public;
revoke execute on function public.get_public_agenda() from public;
revoke execute on function public.create_session_assignment(uuid, uuid, text, text, text, text, text, text, text, text) from public;
grant execute on function public.get_signup_options() to anon, authenticated;
grant execute on function public.get_public_agenda() to anon, authenticated;
grant execute on function public.create_session_assignment(uuid, uuid, text, text, text, text, text, text, text, text) to anon, authenticated;
