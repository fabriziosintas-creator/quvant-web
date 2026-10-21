-- Rendimiento de plantillas sin el equipo y con los registros de verdad.
--
-- Antes, metricas_nichos() contaba los registros desde los eventos
-- registro_completo y email_confirmado: entraban las cuentas de admin y las
-- de prueba ya borradas (su evento queda con perfil_id null), y salían
-- conversiones imposibles (5 registros con 1 visita = 500 %). Ahora:
--  · registros y confirmados salen de perfiles (rol usuario), igual que el
--    Resumen;
--  · vistas y clics no cuentan los navegadores del equipo
--    (navegadores_equipo) ni los eventos con sesión de admin.

create or replace function public.metricas_nichos(desde timestamptz)
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
  with equipo as (
    select e.visita_id
    from public.eventos e
    join public.perfiles p on p.id = e.perfil_id
    where p.rol <> 'usuario' and e.visita_id is not null
    union
    select visita_id from public.navegadores_equipo
  ),
  ev as (
    select e.*
    from public.eventos e
    where e.creado_en >= desde
      and (e.visita_id is null or not exists (select 1 from equipo q where q.visita_id = e.visita_id))
      and not exists (select 1 from public.perfiles p where p.id = e.perfil_id and p.rol <> 'usuario')
  ),
  personas as (
    select * from public.perfiles where rol = 'usuario'
  )
  select
    n.id,
    (select count(*) from ev where ev.nicho_id = n.id and ev.tipo = 'vista_nicho'),
    (select count(*) from ev where ev.nicho_id = n.id and ev.tipo = 'clic_demo'),
    (select count(*) from ev where ev.nicho_id = n.id and ev.tipo = 'clic_contacto'),
    (select count(*) from ev where ev.nicho_id = n.id and ev.tipo = 'inicio_registro'),
    (select count(*) from personas p where p.nicho_id = n.id and p.creado_en >= desde),
    (select count(*) from personas p where p.nicho_id = n.id and p.email_confirmado_en >= desde)
  from public.nichos n
  union all
  select
    null,
    count(*) filter (where ev.tipo = 'vista_nicho'),
    count(*) filter (where ev.tipo = 'clic_demo'),
    count(*) filter (where ev.tipo = 'clic_contacto'),
    count(*) filter (where ev.tipo = 'inicio_registro'),
    0::bigint,
    0::bigint
  from ev
  where ev.nicho_id is null;
$$;
