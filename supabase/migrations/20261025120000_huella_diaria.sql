-- Una persona por día y aviso de visitas repetidas (22-oct-2026).
--
-- 1. huella: cada evento "visita" puede traer una huella del día que
--    calcula el servidor (/api/eventos): un HMAC de la IP + el navegador +
--    la fecha, con una clave que solo tiene el servidor. La IP nunca se
--    guarda; la huella cambia cada día (no deja seguir a nadie de un día
--    para otro) y se borra a los 7 días (privado.detectar_visitas_repetidas).
-- 2. Las estadísticas cuentan una persona por día: los navegadores que en
--    un mismo día comparten huella (celular, otra pestaña, incógnito desde
--    la misma conexión y el mismo navegador) cuentan como uno. Si en ese
--    grupo hay un navegador del equipo, no cuenta ninguno.
-- 3. Aviso "visita_repetida": una misma huella que entró 3 veces o más en
--    el día (entradas separadas por al menos 30 minutos; refrescar o abrir
--    pestañas no cuenta), sin ser del equipo. Puede ser alguien mirando
--    cómo está hecha la web o un cliente muy interesado: el aviso dice qué
--    páginas miró y cuándo.

alter table public.eventos
  add column huella text check (huella ~ '^[0-9a-f]{32}$');

create index eventos_huella_idx on public.eventos (huella, creado_en) where huella is not null;

-- El tipo nuevo de aviso.
alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos add constraint avisos_tipo_check check (tipo in (
  'registro', 'visita_interesante', 'chat', 'objetivo_en_riesgo', 'objetivo_cumplido', 'alerta_roja', 'oportunidad_estancada', 'visita_repetida'
));

-- ── Visitantes por día: una persona por huella y por día ──────────────
create or replace function public.visitantes_por_dia(desde date, hasta date)
returns table (dia date, visita_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  with equipo as (
    select e.visita_id from public.eventos e
    join public.perfiles p on p.id = e.perfil_id
    where p.rol <> 'usuario' and e.visita_id is not null
    union
    select q.visita_id from public.navegadores_equipo q
  ),
  todas as (
    select (e.creado_en at time zone 'America/Argentina/Buenos_Aires')::date as el_dia,
           e.visita_id as la_visita,
           e.huella,
           exists (select 1 from equipo q where q.visita_id = e.visita_id) as del_equipo
    from public.eventos e
    where e.tipo = 'visita'
      and e.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and e.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  ),
  -- Las huellas del día que tocó alguien del equipo: ese grupo entero no cuenta.
  huellas_equipo as (
    select distinct t.el_dia, t.huella from todas t where t.del_equipo and t.huella is not null
  )
  select distinct
    t.el_dia,
    case when t.huella is null then t.la_visita
         else (min(t.la_visita::text) over (partition by t.el_dia, t.huella))::uuid end
  from todas t
  where not t.del_equipo
    and not exists (select 1 from huellas_equipo h where h.el_dia = t.el_dia and h.huella = t.huella);
$$;

revoke all on function public.visitantes_por_dia(date, date) from public, anon;
grant execute on function public.visitantes_por_dia(date, date) to authenticated, service_role;

-- ── El resumen del panel, con el mismo criterio ───────────────────────
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
        select count(distinct x.visita_id)
        from local l, public.visitantes_por_dia((periodos.desde at time zone 'America/Argentina/Buenos_Aires')::date, l.ahora::date) x
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

-- ── Aviso de visitas repetidas ────────────────────────────────────────
create function privado.detectar_visitas_repetidas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  g record;
  creados integer := 0;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  for g in
    with equipo as (
      select e.visita_id from public.eventos e
      join public.perfiles p on p.id = e.perfil_id
      where p.rol <> 'usuario' and e.visita_id is not null
      union
      select q.visita_id from public.navegadores_equipo q
    ),
    del_dia as (
      select e.huella, e.creado_en, e.pagina,
             exists (select 1 from equipo q where q.visita_id = e.visita_id) as del_equipo,
             lag(e.creado_en) over (partition by e.huella order by e.creado_en) as anterior
      from public.eventos e
      where e.tipo = 'visita' and e.huella is not null
        and e.creado_en >= (hoy::timestamp at time zone 'America/Argentina/Buenos_Aires')
    ),
    por_huella as (
      select huella,
             count(*) filter (where anterior is null or creado_en - anterior >= interval '30 minutes') as entradas,
             bool_or(del_equipo) as del_equipo,
             min(creado_en) as primera,
             max(creado_en) as ultima,
             array_agg(distinct pagina) filter (where pagina is not null) as paginas
      from del_dia
      group by huella
    )
    select * from por_huella where entradas >= 3 and not del_equipo
  loop
    begin
      insert into public.avisos (tipo, titulo, texto, enlace, prioridad, clave)
      values (
        'visita_repetida',
        'Una misma conexión entró ' || g.entradas || ' veces hoy',
        left(
          'Entre las ' || to_char(g.primera at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI')
          || ' y las ' || to_char(g.ultima at time zone 'America/Argentina/Buenos_Aires', 'HH24:MI')
          || '. Miró: ' || coalesce(array_to_string(g.paginas[1:6], ', '), 'la portada')
          || '. Puede ser alguien mirando cómo está hecha la web, o alguien muy interesado.',
          400
        ),
        '/panel/resumen',
        'media',
        'repetida:' || hoy || ':' || left(g.huella, 16)
      );
      creados := creados + 1;
    exception when unique_violation then
      null;
    end;
  end loop;

  -- Privacidad: pasados 7 días, la huella ya no hace falta y se borra.
  update public.eventos set huella = null
  where huella is not null and creado_en < now() - interval '7 days';

  return creados;
end;
$$;
revoke all on function privado.detectar_visitas_repetidas() from public;

-- Para el proceso diario del servidor (con la clave secreta), por si no hay pg_cron.
create function public.revisar_visitas_repetidas()
returns integer
language sql
security definer
set search_path = ''
as $$ select privado.detectar_visitas_repetidas(); $$;
revoke all on function public.revisar_visitas_repetidas() from public, anon, authenticated;
grant execute on function public.revisar_visitas_repetidas() to service_role;

-- Cada 10 minutos, con pg_cron (ya corre en este proyecto para las visitas interesantes).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('avisos-visitas-repetidas', '*/10 * * * *', 'select privado.detectar_visitas_repetidas()');
exception when others then
  raise notice 'pg_cron no está disponible: las visitas repetidas se revisan en el proceso diario (%).', sqlerrm;
end;
$$;
