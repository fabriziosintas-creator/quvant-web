-- "Dentro del nicho" (2 de 2): los agregados por nicho, hechos en la base
-- (no traer miles de eventos al servidor para contarlos). security invoker:
-- corren con los permisos de quien llama, así que RLS manda (solo admin).
-- Nunca cuentan a los navegadores del equipo.

-- El embudo web de un nicho en un período: navegadores distintos en cada
-- paso, y personas registradas y confirmadas con ese nicho.
create function public.embudo_nicho(nicho text, desde date, hasta date)
returns jsonb
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
    select visita_id from public.navegadores_equipo
  ),
  ev as (
    select e.tipo, e.visita_id
    from public.eventos e
    where e.nicho_id = nicho
      and e.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and e.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and (e.visita_id is null or not exists (select 1 from equipo q where q.visita_id = e.visita_id))
  ),
  personas as (
    select * from public.perfiles p
    where p.rol = 'usuario' and p.nicho_id = nicho
  )
  select jsonb_build_object(
    'vistas', (select count(distinct visita_id) from ev where tipo = 'vista_nicho'),
    'demos', (select count(distinct visita_id) from ev where tipo = 'clic_demo'),
    'contacto', (select count(distinct visita_id) from ev where tipo = 'clic_contacto'),
    'inicios', (select count(distinct visita_id) from ev where tipo = 'inicio_registro'),
    'registros', (select count(*) from personas p
                  where p.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
                    and p.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')),
    'confirmados', (select count(*) from personas p
                    where p.email_confirmado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
                      and p.email_confirmado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires'))
  );
$$;

-- La atención que recibe la sección de un nicho: tiempo a la vista,
-- profundidad y de dónde vinieron. Navegadores distintos por valor.
create function public.atencion_nicho(nicho text, desde date, hasta date)
returns table (tipo text, detalle text, visitas bigint)
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
    select visita_id from public.navegadores_equipo
  ),
  delNicho as (
    select distinct e.visita_id from public.eventos e
    where e.nicho_id = nicho and e.tipo = 'vista_nicho'
      and e.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
      and e.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
  )
  select e.tipo::text, e.detalle, count(distinct e.visita_id)
  from public.eventos e
  where e.detalle is not null
    and e.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
    and e.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
    and not exists (select 1 from equipo q where q.visita_id = e.visita_id)
    and (
      (e.tipo in ('tiempo_nicho', 'profundidad_nicho') and e.nicho_id = nicho)
      -- El origen es de la visita entera: cuenta para los que miraron este nicho.
      or (e.tipo = 'origen' and e.visita_id in (select visita_id from delNicho))
    )
  group by e.tipo, e.detalle;
$$;

revoke all on function public.embudo_nicho(text, date, date) from public, anon;
revoke all on function public.atencion_nicho(text, date, date) from public, anon;
grant execute on function public.embudo_nicho(text, date, date) to authenticated, service_role;
grant execute on function public.atencion_nicho(text, date, date) to authenticated, service_role;

-- El límite de eventos: tiempo, profundidad y origen cuentan como mucho uno
-- por visita y valor cada 30 minutos (como las vistas de nicho).
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
  if new.tipo in ('vista_nicho', 'visita', 'tiempo_nicho', 'profundidad_nicho', 'origen') and exists (
    select 1 from public.eventos
    where visita_id = new.visita_id
      and tipo = new.tipo
      and nicho_id is not distinct from new.nicho_id
      and detalle is not distinct from new.detalle
      and creado_en > now() - interval '30 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;
