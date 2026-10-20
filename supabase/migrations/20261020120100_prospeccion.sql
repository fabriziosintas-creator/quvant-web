-- Panel interno: clientes por plantilla (lo que vende de verdad), locales
-- del mapa de prospección y las visitas a cada uno. Todo solo para admin.

create type public.estado_cliente as enum ('demo_mostrada', 'en_prueba', 'activo', 'baja');
create type public.estado_local as enum ('por_visitar', 'visitado', 'interesado', 'cliente', 'descartado');
create type public.volver as enum ('si', 'mas_adelante', 'no');
create type public.feedback as enum ('bueno', 'regular', 'malo');
create type public.origen_local as enum ('manual', 'importado');

-- ── Locales (el mapa) ────────────────────────────────────────────────
create table public.locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 160),
  nicho_id text references public.nichos (id),
  -- El rubro como venga (las planillas importadas lo traen en texto libre).
  rubro text check (char_length(rubro) <= 120),
  direccion text check (char_length(direccion) <= 300),
  -- Para buscar duplicados por dirección sin importar mayúsculas ni espacios.
  direccion_normalizada text generated always as (
    lower(regexp_replace(btrim(direccion), '\s+', ' ', 'g'))
  ) stored,
  ciudad text check (char_length(ciudad) <= 120),
  provincia text check (char_length(provincia) <= 120),
  latitud double precision check (latitud between -90 and 90),
  longitud double precision check (longitud between -180 and 180),
  place_id text check (char_length(place_id) <= 300),
  telefono text check (char_length(telefono) <= 60),
  contacto text check (char_length(contacto) <= 120),
  web text check (char_length(web) <= 300),
  estado public.estado_local not null default 'por_visitar',
  volver public.volver,
  proxima_visita date,
  origen public.origen_local not null default 'manual',
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  -- Datos del script de prueba: se borran todos juntos.
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint coordenadas_completas check ((latitud is null) = (longitud is null))
);

-- Un mismo lugar de Google, una sola vez. La dirección repetida la revisa
-- la app (abre el que ya existe): dos locales de una galería pueden
-- compartirla.
create unique index locales_place_id_unico on public.locales (place_id) where place_id is not null;
create index locales_direccion_idx on public.locales (direccion_normalizada) where direccion is not null;
create index locales_estado_idx on public.locales (estado);
create index locales_proxima_visita_idx on public.locales (proxima_visita) where proxima_visita is not null;
create index locales_cargado_por_idx on public.locales (cargado_por);

create trigger locales_actualizado
  before update on public.locales
  for each row execute function privado.marcar_actualizado();

-- ── Visitas (varias por local) ───────────────────────────────────────
create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete cascade,
  fecha date not null default current_date,
  -- Quién fue: por defecto, quien la carga. Tiene que ser admin.
  visitante_id uuid not null default auth.uid() references public.perfiles (id),
  feedback public.feedback not null,
  volver public.volver,
  nota text check (char_length(nota) <= 2000),
  -- Qué se mostró: la plantilla o el servicio.
  que_se_mostro text check (char_length(que_se_mostro) <= 200),
  siguiente_paso text check (char_length(siguiente_paso) <= 500),
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);

create index visitas_local_fecha_idx on public.visitas (local_id, fecha desc, creado_en desc);
create index visitas_visitante_fecha_idx on public.visitas (visitante_id, fecha desc);

-- Al cargar la visita más reciente de un local: "volver" pasa al local y,
-- si estaba por visitar, queda visitado. Una visita vieja cargada tarde no
-- pisa lo que dijo la última.
create function privado.al_cargar_visita()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.locales l
     set volver = coalesce(new.volver, l.volver),
         estado = case when l.estado = 'por_visitar' then 'visitado'::public.estado_local else l.estado end
   where l.id = new.local_id
     and not exists (
       select 1 from public.visitas v
       where v.local_id = new.local_id and v.id <> new.id and v.fecha > new.fecha
     );
  return new;
end;
$$;
revoke all on function privado.al_cargar_visita() from public;

create trigger visitas_actualizan_local
  after insert on public.visitas
  for each row execute function privado.al_cargar_visita();

-- ── Clientes por plantilla (carga manual) ────────────────────────────
create table public.clientes_plantilla (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (char_length(btrim(empresa)) between 1 and 160),
  nicho_id text not null references public.nichos (id),
  estado public.estado_cliente not null default 'demo_mostrada',
  -- En pesos, por mes. Opcional.
  abono_mensual numeric(12, 2) check (abono_mensual >= 0),
  fecha date not null default current_date,
  notas text check (char_length(notas) <= 2000),
  -- Si salió de un local del mapa.
  local_id uuid references public.locales (id) on delete set null,
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index clientes_plantilla_nicho_estado_idx on public.clientes_plantilla (nicho_id, estado);
create index clientes_plantilla_local_idx on public.clientes_plantilla (local_id) where local_id is not null;
create index clientes_plantilla_cargado_por_idx on public.clientes_plantilla (cargado_por);

create trigger clientes_plantilla_actualizado
  before update on public.clientes_plantilla
  for each row execute function privado.marcar_actualizado();

-- ── Seguridad: solo admin ────────────────────────────────────────────
alter table public.locales enable row level security;
alter table public.visitas enable row level security;
alter table public.clientes_plantilla enable row level security;

create policy "Solo los admin, locales" on public.locales
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

create policy "Solo los admin, visitas" on public.visitas
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()) and privado.es_admin(visitante_id));

create policy "Solo los admin, clientes por plantilla" on public.clientes_plantilla
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

revoke all on public.locales, public.visitas, public.clientes_plantilla from anon, authenticated;
grant select, insert, update, delete on public.locales, public.visitas, public.clientes_plantilla to authenticated;
grant all on public.locales, public.visitas, public.clientes_plantilla to service_role;

-- ── Vista: cada local con sus visitas contadas ───────────────────────
-- La cantidad de visitas y el último feedback salen de la tabla visitas,
-- no se cargan a mano. security_invoker: la vista respeta las reglas de
-- quien la lee (sin eso, Postgres la correría como su dueño y salteaba RLS).
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
