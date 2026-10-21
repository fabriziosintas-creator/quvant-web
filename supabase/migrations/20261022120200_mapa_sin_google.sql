-- El mapa de prospección sin Google Maps Platform (decisión del 20-oct-2026:
-- sin clave, sin facturación ni prepago de Google Cloud). El mapa pasa a
-- MapLibre + OpenFreeMap y las direcciones se buscan con Nominatim.
--
-- En locales:
--  · link_google_maps: el link que se pega a mano (o viene de una planilla).
--    Solo se usa para abrir Google Maps y para no cargar dos veces el mismo.
--  · osm_id: el lugar de OpenStreetMap si salió del buscador (N123, W45, R6).
--  · ubicacion_pendiente: importado y todavía sin pasar por el buscador (la
--    cola de la importación, de a una consulta por segundo).
--  · place_id (el lugar de Google) se va: solo lo llenaba el buscador de
--    Google, que nunca tuvo clave cargada.
-- Y una tabla para guardar lo que devolvió Nominatim y no repetir consultas
-- (lo pide su política de uso).

-- La vista usa l.*: hay que rehacerla para que tome las columnas nuevas.
drop view public.locales_resumen;

alter table public.locales
  drop column place_id,
  add column link_google_maps text check (char_length(link_google_maps) <= 2000),
  add column osm_id text check (osm_id ~ '^[NWR][0-9]{1,15}$'),
  add column ubicacion_pendiente boolean not null default false;

create unique index locales_osm_id_unico on public.locales (osm_id) where osm_id is not null;
create index locales_link_idx on public.locales (link_google_maps) where link_google_maps is not null;
create index locales_pendientes_idx on public.locales (creado_en) where ubicacion_pendiente;
create index locales_coordenadas_idx on public.locales (latitud, longitud) where latitud is not null;

create view public.locales_resumen
with (security_invoker = true)
as
select
  l.*,
  coalesce(c.cantidad, 0) as cantidad_visitas,
  u.fecha as ultima_visita,
  u.feedback as ultimo_feedback,
  u.visitante_id as ultimo_visitante_id
from public.locales l
left join lateral (
  select count(*)::int as cantidad from public.visitas v where v.local_id = l.id
) c on true
left join lateral (
  select v.fecha, v.feedback, v.visitante_id
  from public.visitas v
  where v.local_id = l.id
  order by v.fecha desc, v.creado_en desc
  limit 1
) u on true;

revoke all on public.locales_resumen from anon, authenticated;
grant select on public.locales_resumen to authenticated;
grant select on public.locales_resumen to service_role;

-- ── Lo que ya se le preguntó a Nominatim ─────────────────────────────
-- clave: "buscar:<consulta en minúsculas>" o "inverso:<lat>,<lng>" (5
-- decimales, ~1 m). resultado: la lista tal como la usa la app (puede
-- estar vacía: "no lo encontró" también se guarda).
create table public.geocodificaciones (
  clave text primary key check (char_length(clave) <= 400),
  resultado jsonb not null,
  creado_en timestamptz not null default now()
);

alter table public.geocodificaciones enable row level security;

create policy "Solo los admin, geocodificaciones" on public.geocodificaciones
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

revoke all on public.geocodificaciones from anon, authenticated;
grant select, insert, update, delete on public.geocodificaciones to authenticated;
grant all on public.geocodificaciones to service_role;
