-- Los navegadores del equipo (fabrizio y Michel) no cuentan como visitas.
--
-- Antes solo se descartaba un navegador si alguna vez mandaba un evento de
-- la web con la sesión de un admin abierta; entrar sin sesión, desde otro
-- dispositivo o directo al panel quedaba contado. Ahora, cada vez que un
-- admin abre el panel, su navegador manda su id anónimo de visita y queda
-- anotado acá: se descarta para atrás (lo que ya había contado) y para
-- adelante (la web deja de medir en ese navegador).

create table public.navegadores_equipo (
  visita_id uuid primary key,
  perfil_id uuid references public.perfiles (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create index navegadores_equipo_perfil_idx on public.navegadores_equipo (perfil_id);

alter table public.navegadores_equipo enable row level security;

create policy "Solo los admin, navegadores del equipo" on public.navegadores_equipo
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

revoke all on public.navegadores_equipo from anon, authenticated;
grant select, insert, update, delete on public.navegadores_equipo to authenticated;
grant all on public.navegadores_equipo to service_role;

-- El resumen, igual que en 20261022120100, descartando además estos navegadores.
create or replace function public.resumen_visitas()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with local as (
    select now() at time zone 'America/Argentina/Buenos_Aires' as ahora
  ),
  primera as (
    select min(creado_en) as en from public.eventos where tipo = 'visita'
  ),
  equipo as (
    select e.visita_id
    from public.eventos e
    join public.perfiles p on p.id = e.perfil_id
    where p.rol <> 'usuario' and e.visita_id is not null
    union
    select visita_id from public.navegadores_equipo
  ),
  periodos as (
    select nombre, greatest(inicio, coalesce(primera.en, inicio)) as desde
    from local, primera, lateral (values
      ('hoy', date_trunc('day', local.ahora) at time zone 'America/Argentina/Buenos_Aires'),
      ('semana', date_trunc('week', local.ahora) at time zone 'America/Argentina/Buenos_Aires'),
      ('mes', date_trunc('month', local.ahora) at time zone 'America/Argentina/Buenos_Aires')
    ) as v (nombre, inicio)
  )
  select jsonb_build_object(
    'medido_desde', (select en from primera),
    'periodos', coalesce(jsonb_object_agg(periodos.nombre, jsonb_build_object(
      'desde', periodos.desde,
      'personas', (
        select count(distinct e.visita_id) from public.eventos e
        where e.tipo = 'visita' and e.creado_en >= periodos.desde
          and not exists (select 1 from equipo q where q.visita_id = e.visita_id)
      ),
      'registros', (
        select count(*) from public.perfiles p
        where p.rol = 'usuario' and p.creado_en >= periodos.desde
      )
    )), '{}'::jsonb)
  )
  from periodos;
$$;
