create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'lector' check (role in ('admin', 'editor', 'lector')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jornadas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text,
  curso text,
  descripcion text,
  modalidad text,
  teams_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid references public.jornadas(id) on delete set null,
  sede_id uuid references public.sedes(id) on delete set null,
  titulo text not null,
  slug text not null unique,
  bloque text,
  orden integer,
  objetivo text,
  descripcion text,
  contenidos_clave text[] not null default '{}',
  fecha date,
  hora_inicio time,
  hora_fin time,
  modalidad text,
  teams_url text,
  imagen_url text,
  estado text not null default 'borrador' check (estado in ('borrador', 'publicada', 'realizada')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ponentes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  especialidad text,
  centro text,
  bio text,
  foto_url text,
  email_publico text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sesion_ponentes (
  sesion_id uuid not null references public.sesiones(id) on delete cascade,
  ponente_id uuid not null references public.ponentes(id) on delete cascade,
  rol text,
  orden integer not null default 1,
  created_at timestamptz not null default now(),
  primary key (sesion_id, ponente_id)
);

create table if not exists public.recursos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid references public.sesiones(id) on delete set null,
  titulo text not null,
  tipo text not null default 'otro' check (tipo in ('pdf', 'pptx', 'imagen', 'cartel', 'enlace', 'bibliografia', 'otro')),
  categoria text,
  url text not null,
  descripcion text,
  orden integer,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'lector')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'editor')
  );
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists jornadas_set_updated_at on public.jornadas;
create trigger jornadas_set_updated_at
before update on public.jornadas
for each row execute function public.set_updated_at();

drop trigger if exists sedes_set_updated_at on public.sedes;
create trigger sedes_set_updated_at
before update on public.sedes
for each row execute function public.set_updated_at();

drop trigger if exists sesiones_set_updated_at on public.sesiones;
create trigger sesiones_set_updated_at
before update on public.sesiones
for each row execute function public.set_updated_at();

drop trigger if exists ponentes_set_updated_at on public.ponentes;
create trigger ponentes_set_updated_at
before update on public.ponentes
for each row execute function public.set_updated_at();

drop trigger if exists recursos_set_updated_at on public.recursos;
create trigger recursos_set_updated_at
before update on public.recursos
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.jornadas enable row level security;
alter table public.sedes enable row level security;
alter table public.sesiones enable row level security;
alter table public.ponentes enable row level security;
alter table public.sesion_ponentes enable row level security;
alter table public.recursos enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_manage_admin" on public.profiles;
create policy "profiles_manage_admin"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "jornadas_public_select" on public.jornadas;
create policy "jornadas_public_select"
on public.jornadas
for select
to anon, authenticated
using (published = true);

drop policy if exists "jornadas_admin_editor_manage" on public.jornadas;
create policy "jornadas_admin_editor_manage"
on public.jornadas
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sedes_public_select" on public.sedes;
create policy "sedes_public_select"
on public.sedes
for select
to anon, authenticated
using (true);

drop policy if exists "sedes_admin_editor_manage" on public.sedes;
create policy "sedes_admin_editor_manage"
on public.sedes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sesiones_public_select" on public.sesiones;
create policy "sesiones_public_select"
on public.sesiones
for select
to anon, authenticated
using (estado = 'publicada' and is_active = true);

drop policy if exists "sesiones_admin_editor_manage" on public.sesiones;
create policy "sesiones_admin_editor_manage"
on public.sesiones
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "ponentes_public_select" on public.ponentes;
create policy "ponentes_public_select"
on public.ponentes
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ponentes_admin_editor_manage" on public.ponentes;
create policy "ponentes_admin_editor_manage"
on public.ponentes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "sesion_ponentes_public_select" on public.sesion_ponentes;
create policy "sesion_ponentes_public_select"
on public.sesion_ponentes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sesiones
    where sesiones.id = sesion_ponentes.sesion_id
      and sesiones.estado = 'publicada'
      and sesiones.is_active = true
  )
);

drop policy if exists "sesion_ponentes_admin_editor_manage" on public.sesion_ponentes;
create policy "sesion_ponentes_admin_editor_manage"
on public.sesion_ponentes
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

drop policy if exists "recursos_public_select" on public.recursos;
create policy "recursos_public_select"
on public.recursos
for select
to anon, authenticated
using (
  visible = true
  and (
    sesion_id is null
    or exists (
      select 1
      from public.sesiones
      where sesiones.id = recursos.sesion_id
        and sesiones.estado = 'publicada'
        and sesiones.is_active = true
    )
  )
);

drop policy if exists "recursos_admin_editor_manage" on public.recursos;
create policy "recursos_admin_editor_manage"
on public.recursos
for all
to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());

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

grant usage on schema public to anon, authenticated;
grant select on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update, delete on public.jornadas, public.sedes, public.sesiones, public.ponentes, public.sesion_ponentes, public.recursos, public.site_settings to authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin_or_editor() to authenticated;
