-- Checklist docente interno por asignación JAP.
-- No modifica la reserva pública ni expone tareas a anon.

create table if not exists public.assignment_tasks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.session_assignments(id) on delete cascade,
  key text not null,
  label text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completada', 'no_aplica')),
  due_date date,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, key)
);

create index if not exists assignment_tasks_assignment_id_idx
on public.assignment_tasks (assignment_id);

create index if not exists assignment_tasks_status_idx
on public.assignment_tasks (status);

create index if not exists assignment_tasks_due_date_idx
on public.assignment_tasks (due_date)
where due_date is not null;

drop trigger if exists assignment_tasks_set_updated_at on public.assignment_tasks;
create trigger assignment_tasks_set_updated_at
before update on public.assignment_tasks
for each row execute function public.set_updated_at();

alter table public.assignment_tasks enable row level security;

drop policy if exists "assignment_tasks_admin_editor_select" on public.assignment_tasks;
create policy "assignment_tasks_admin_editor_select"
on public.assignment_tasks
for select
to authenticated
using (public.is_admin_or_editor());

drop policy if exists "assignment_tasks_admin_editor_insert" on public.assignment_tasks;
create policy "assignment_tasks_admin_editor_insert"
on public.assignment_tasks
for insert
to authenticated
with check (public.is_admin_or_editor());

drop policy if exists "assignment_tasks_admin_editor_update" on public.assignment_tasks;
create policy "assignment_tasks_admin_editor_update"
on public.assignment_tasks
for update
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "assignment_tasks_admin_editor_delete" on public.assignment_tasks;
create policy "assignment_tasks_admin_editor_delete"
on public.assignment_tasks
for delete
to authenticated
using (public.is_admin_or_editor());

create or replace function public.ensure_assignment_tasks(p_assignment_id uuid)
returns setof public.assignment_tasks
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_or_editor() then
    raise exception 'No tienes permisos para gestionar el checklist docente.';
  end if;

  if not exists (
    select 1
    from public.session_assignments
    where id = p_assignment_id
  ) then
    raise exception 'La asignación indicada no existe.';
  end if;

  insert into public.assignment_tasks (assignment_id, key, label, sort_order)
  values
    (p_assignment_id, 'template_reviewed', 'Plantilla común revisada.', 10),
    (p_assignment_id, 'case_defined', 'Caso clínico inicial definido.', 20),
    (p_assignment_id, 'tutor_review', 'Revisión con tutor/a.', 30),
    (p_assignment_id, 'presentation_received', 'Presentación recibida.', 40),
    (p_assignment_id, 'final_material_received', 'Material final recibido.', 50),
    (p_assignment_id, 'final_material_anonymized', 'Material anonimizado.', 60),
    (p_assignment_id, 'final_material_published', 'Material final publicado.', 70)
  on conflict (assignment_id, key) do nothing;

  return query
  select *
  from public.assignment_tasks
  where assignment_id = p_assignment_id
  order by sort_order, label;
end;
$$;

revoke all on public.assignment_tasks from anon;
revoke all on public.assignment_tasks from authenticated;
grant select, insert, update, delete on public.assignment_tasks to authenticated;

revoke execute on function public.ensure_assignment_tasks(uuid) from public;
grant execute on function public.ensure_assignment_tasks(uuid) to authenticated;
