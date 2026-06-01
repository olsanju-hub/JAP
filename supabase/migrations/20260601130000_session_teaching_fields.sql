-- Fase 3.1: campos docentes y bibliografia por sesion.

alter table public.sesiones
add column if not exists objetivos_docentes text,
add column if not exists metodologia text,
add column if not exists bibliografia text,
add column if not exists responsable_revision text,
add column if not exists fecha_revision date,
add column if not exists material_previo text,
add column if not exists material_posterior text,
add column if not exists observaciones_internas text;
