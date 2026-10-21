-- Buscador rápido del panel (Ctrl+K, prompt 7, 21-oct-2026).
--
-- buscar_panel(texto, limite): una sola llamada por tecla, con RLS
-- (security invoker: solo los admin ven algo). Tolera errores de tipeo
-- (pg_trgm, "ferreteria nrte") y tildes (unaccent). Busca en locales,
-- clientes, personas registradas, oportunidades, objetivos y nichos. Las
-- páginas del panel y las charlas del chat se buscan en el servidor.
--
-- De las personas registradas devuelve nombre y empresa; el email, solo
-- si se buscó por email.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Minúsculas y sin tildes. "immutable" para poder indexarla (el
-- diccionario de unaccent no cambia).
create function privado.normalizar(valor text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(valor, ''))); $$;
revoke all on function privado.normalizar(text) from public;
grant execute on function privado.normalizar(text) to authenticated, service_role;

create index locales_busqueda_idx on public.locales using gin (privado.normalizar(nombre || ' ' || coalesce(direccion, '') || ' ' || coalesce(ciudad, '') || ' ' || coalesce(rubro, '')) extensions.gin_trgm_ops);
create index clientes_sistema_busqueda_idx on public.clientes_sistema using gin (privado.normalizar(nombre) extensions.gin_trgm_ops);
create index clientes_plantilla_busqueda_idx on public.clientes_plantilla using gin (privado.normalizar(empresa) extensions.gin_trgm_ops);
create index perfiles_busqueda_idx on public.perfiles using gin (privado.normalizar(nombre || ' ' || coalesce(apellido, '') || ' ' || coalesce(empresa, '') || ' ' || email) extensions.gin_trgm_ops);
create index oportunidades_busqueda_idx on public.oportunidades using gin (privado.normalizar(negocio || ' ' || coalesce(contacto, '')) extensions.gin_trgm_ops);
create index metas_busqueda_idx on public.metas using gin (privado.normalizar(nombre) extensions.gin_trgm_ops);

create function public.buscar_panel(texto text, limite integer default 30)
returns table (tipo text, id text, titulo text, contexto text, enlace text, nicho text, puntaje real)
language plpgsql
stable
security invoker
set search_path = ''
set pg_trgm.word_similarity_threshold = '0.45'
as $$
declare
  q text := left(privado.normalizar(btrim(texto)), 80);
  por_email boolean := position('@' in coalesce(texto, '')) > 0;
begin
  if char_length(q) < 2 then
    return;
  end if;
  return query
  with candidatos as (
    -- Locales del mapa.
    select 'local'::text as tipo, l.id::text as id, l.nombre as titulo,
      concat_ws(' · ', n.nombre, replace(l.estado::text, '_', ' '), l.ciudad) as contexto,
      '/panel/mapa?local=' || l.id as enlace, l.nicho_id as nicho,
      extensions.word_similarity(q, privado.normalizar(l.nombre || ' ' || coalesce(l.direccion, '') || ' ' || coalesce(l.ciudad, '') || ' ' || coalesce(l.rubro, ''))) as puntaje
    from public.locales l
    left join public.nichos n on n.id = l.nicho_id
    where q operator(extensions.<%) privado.normalizar(l.nombre || ' ' || coalesce(l.direccion, '') || ' ' || coalesce(l.ciudad, '') || ' ' || coalesce(l.rubro, ''))
    union all
    -- Clientes del sistema.
    select 'cliente', c.id::text, c.nombre,
      concat_ws(' · ', nu.nombre, c.plan, case when c.baja is not null then 'de baja' end),
      '/panel/clientes/' || c.id, c.nucleo_id,
      extensions.word_similarity(q, privado.normalizar(c.nombre))
    from public.clientes_sistema c
    left join public.nucleos nu on nu.id = c.nucleo_id
    where q operator(extensions.<%) privado.normalizar(c.nombre)
    union all
    -- Clientes por plantilla (los que no tienen cuenta del sistema; los otros ya salen arriba).
    select 'socio', p.id::text, p.empresa,
      concat_ws(' · ', n.nombre, replace(p.estado::text, '_', ' ')),
      '/panel/plantillas', p.nicho_id,
      extensions.word_similarity(q, privado.normalizar(p.empresa))
    from public.clientes_plantilla p
    left join public.nichos n on n.id = p.nicho_id
    where q operator(extensions.<%) privado.normalizar(p.empresa)
      and not exists (select 1 from public.clientes_sistema c where c.cliente_plantilla_id = p.id)
    union all
    -- Personas registradas: nombre y empresa; el email solo si se buscó por email.
    select 'registro', pe.id::text, concat_ws(' ', pe.nombre, pe.apellido),
      concat_ws(' · ', n.nombre, pe.empresa, pe.ciudad, case when por_email then pe.email end),
      coalesce('/panel/comercial/' || (select o.id::text from public.oportunidades o where o.perfil_id = pe.id order by o.creado_en desc limit 1), '/panel/comercial/nueva?perfil=' || pe.id),
      pe.nicho_id,
      extensions.word_similarity(q, privado.normalizar(pe.nombre || ' ' || coalesce(pe.apellido, '') || ' ' || coalesce(pe.empresa, '') || ' ' || pe.email))
    from public.perfiles pe
    left join public.nichos n on n.id = pe.nicho_id
    where pe.rol <> 'admin'
      and q operator(extensions.<%) privado.normalizar(pe.nombre || ' ' || coalesce(pe.apellido, '') || ' ' || coalesce(pe.empresa, '') || ' ' || pe.email)
    union all
    -- Oportunidades.
    select 'oportunidad', o.id::text, o.negocio,
      concat_ws(' · ', replace(o.etapa, '_', ' '), n.nombre, o.contacto),
      '/panel/comercial/' || o.id, o.nicho_id,
      extensions.word_similarity(q, privado.normalizar(o.negocio || ' ' || coalesce(o.contacto, '')))
    from public.oportunidades o
    left join public.nichos n on n.id = o.nicho_id
    where q operator(extensions.<%) privado.normalizar(o.negocio || ' ' || coalesce(o.contacto, ''))
    union all
    -- Objetivos.
    select 'objetivo', m.id::text, m.nombre, concat_ws(' · ', m.area, to_char(m.desde, 'DD/MM') || '–' || to_char(m.hasta, 'DD/MM/YY')),
      '/panel/objetivos/' || m.id, null::text,
      extensions.word_similarity(q, privado.normalizar(m.nombre))
    from public.metas m
    where q operator(extensions.<%) privado.normalizar(m.nombre)
    union all
    -- Nichos.
    select 'nicho', ni.id, ni.nombre, 'Nicho', '/panel/nichos/' || ni.id, ni.id,
      extensions.word_similarity(q, privado.normalizar(ni.nombre))
    from public.nichos ni
    where ni.id <> 'otro' and q operator(extensions.<%) privado.normalizar(ni.nombre)
  )
  select c.tipo, c.id, c.titulo, c.contexto, c.enlace, c.nicho,
    -- Un título que empieza con lo buscado va primero.
    (c.puntaje + case when privado.normalizar(c.titulo) like q || '%' then 0.3 else 0 end)::real
  from candidatos c
  order by 7 desc, c.titulo
  limit least(greatest(coalesce(limite, 30), 1), 60);
end;
$$;
revoke all on function public.buscar_panel(text, integer) from public, anon;
grant execute on function public.buscar_panel(text, integer) to authenticated;

-- Prueba rápida (con datos de prueba, en la consola de Supabase, como admin):
--   insert into public.locales (nombre, ciudad, es_prueba) values ('Ferretería Norte (prueba)', 'CABA', true);
--   select * from public.buscar_panel('ferreteria nrte');   -- la encuentra pese al error de tipeo
--   select * from public.buscar_panel('FERRETERÍA');        -- sin importar tildes ni mayúsculas
--   delete from public.locales where nombre = 'Ferretería Norte (prueba)';
