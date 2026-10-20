-- Las cuentas del panel, hechas en la base (no traer miles de filas al
-- servidor para contarlas). security invoker: corren con los permisos de
-- quien las llama, así que RLS manda: un admin ve todo; cualquier otra
-- persona, solo lo suyo (o nada).

-- ── Resumen de registros (sin contar a los admin) ────────────────────
-- Hoy, semana y mes en hora de Buenos Aires (la semana arranca el lunes).
create function public.resumen_registros()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with p as (
    select * from public.perfiles where rol = 'usuario'
  ),
  local as (
    select now() at time zone 'America/Argentina/Buenos_Aires' as ahora
  )
  select jsonb_build_object(
    'total', (select count(*) from p),
    'confirmados', (select count(*) from p where email_confirmado_en is not null),
    'hoy', (select count(*) from p, local
            where p.creado_en >= date_trunc('day', local.ahora) at time zone 'America/Argentina/Buenos_Aires'),
    'semana', (select count(*) from p, local
               where p.creado_en >= date_trunc('week', local.ahora) at time zone 'America/Argentina/Buenos_Aires'),
    'mes', (select count(*) from p, local
            where p.creado_en >= date_trunc('month', local.ahora) at time zone 'America/Argentina/Buenos_Aires'),
    'por_nicho', (select coalesce(jsonb_object_agg(nicho_id, n), '{}'::jsonb)
                  from (select nicho_id, count(*) as n from p group by nicho_id) x),
    'por_objetivo', (select coalesce(jsonb_object_agg(objetivo_id, n), '{}'::jsonb)
                     from (select objetivo_id, count(*) as n from p group by objetivo_id) x),
    'cruce', (select coalesce(jsonb_agg(jsonb_build_object('nicho', nicho_id, 'objetivo', objetivo_id, 'n', n)), '[]'::jsonb)
              from (select nicho_id, objetivo_id, count(*) as n from p group by nicho_id, objetivo_id) x)
  );
$$;

-- ── Métricas por rubro desde una fecha ───────────────────────────────
-- Una fila por rubro de la tabla nichos, y una más (nicho_id null) para
-- los eventos sin rubro (por ejemplo, "Hablemos" del encabezado).
create function public.metricas_nichos(desde timestamptz)
returns table (
  nicho_id text,
  vistas bigint,
  clics_demo bigint,
  clics_contacto bigint,
  inicios_registro bigint,
  registros bigint,
  confirmados bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    n.id,
    count(e.id) filter (where e.tipo = 'vista_nicho'),
    count(e.id) filter (where e.tipo = 'clic_demo'),
    count(e.id) filter (where e.tipo = 'clic_contacto'),
    count(e.id) filter (where e.tipo = 'inicio_registro'),
    count(e.id) filter (where e.tipo = 'registro_completo'),
    count(e.id) filter (where e.tipo = 'email_confirmado')
  from public.nichos n
  left join public.eventos e on e.nicho_id = n.id and e.creado_en >= desde
  group by n.id
  union all
  select
    null,
    count(*) filter (where e.tipo = 'vista_nicho'),
    count(*) filter (where e.tipo = 'clic_demo'),
    count(*) filter (where e.tipo = 'clic_contacto'),
    count(*) filter (where e.tipo = 'inicio_registro'),
    count(*) filter (where e.tipo = 'registro_completo'),
    count(*) filter (where e.tipo = 'email_confirmado')
  from public.eventos e
  where e.nicho_id is null and e.creado_en >= desde;
$$;

revoke all on function public.resumen_registros() from public, anon;
revoke all on function public.metricas_nichos(timestamptz) from public, anon;
grant execute on function public.resumen_registros() to authenticated, service_role;
grant execute on function public.metricas_nichos(timestamptz) to authenticated, service_role;
