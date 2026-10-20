-- ── Visitas: el límite y el resumen del panel ────────────────────────
-- La web manda "visita" una vez por pestaña (ver componentes/medicion).
-- La base además la cuenta como mucho una vez cada 30 minutos por visita,
-- como ya hacía con vista_nicho.
create or replace function privado.limitar_eventos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.visita_id is null then
    return new;
  end if;
  if (
    select count(*) from public.eventos
    where visita_id = new.visita_id and creado_en > now() - interval '10 minutes'
  ) >= 60 then
    return null;
  end if;
  if new.tipo in ('vista_nicho', 'visita') and exists (
    select 1 from public.eventos
    where visita_id = new.visita_id
      and tipo = new.tipo
      and nicho_id is not distinct from new.nicho_id
      and creado_en > now() - interval '30 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;

create index eventos_visitas_idx on public.eventos (creado_en desc, visita_id) where tipo = 'visita';

-- Cuántas personas entraron (navegadores distintos) y cuántas se
-- registraron, hoy, esta semana y este mes en hora de Buenos Aires.
-- No cuenta a los admin: se descarta todo navegador que alguna vez mandó
-- un evento con la sesión de un admin abierta.
-- Las visitas se miden desde que se publica este cambio: si el período empezó antes,
-- los registros se cuentan desde la primera visita medida (si no, el
-- porcentaje compararía registros de días sin visitas medidas). "desde"
-- dice desde cuándo vale cada número.
create function public.resumen_visitas()
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
  admins as (
    select distinct e.visita_id
    from public.eventos e
    join public.perfiles p on p.id = e.perfil_id
    where p.rol <> 'usuario' and e.visita_id is not null
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
          and e.visita_id not in (select visita_id from admins)
      ),
      'registros', (
        select count(*) from public.perfiles p
        where p.rol = 'usuario' and p.creado_en >= periodos.desde
      )
    )), '{}'::jsonb)
  )
  from periodos;
$$;

revoke all on function public.resumen_visitas() from public, anon;
grant execute on function public.resumen_visitas() to authenticated, service_role;
