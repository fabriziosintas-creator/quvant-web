-- Objetivos de Quvant (sección /panel/objetivos): las metas propias del
-- equipo (facturación, clientes, web, comercial, calle, núcleos), su
-- historial y la facturación cargada a mano.
--
-- La tabla se llama "metas" porque "objetivos" ya existe: es la lista del
-- registro ("¿Qué te trajo a Quvant?"). En pantalla se llaman Objetivos.
--
-- Todo solo para admin (privado.es_admin()). Nunca se guardan ventas de
-- los clientes de Quvant: la facturación es solo lo que cobra Quvant.

-- ── Metas ────────────────────────────────────────────────────────────
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 160),
  descripcion text check (char_length(descripcion) <= 500),
  -- Clave del catálogo de métricas (src/objetivos/catalogo.ts). La valida la app.
  metrica text not null check (metrica ~ '^[a-z_]{1,60}$'),
  -- Filtros que acepta la métrica (nicho, responsable, tipo de servicio…).
  filtros jsonb not null default '{}'::jsonb check (jsonb_typeof(filtros) = 'object'),
  area text not null check (area in ('facturacion', 'clientes', 'web', 'comercial', 'calle', 'nucleos')),
  etapa text not null default 'libre' check (etapa in ('90_dias', '6_meses', '12_meses', 'libre')),
  tipo_periodo text not null check (tipo_periodo in ('semana', 'mes', 'trimestre', 'etapa', 'rango')),
  desde date not null,
  hasta date not null,
  meta_valor numeric(16, 2) not null,
  -- La meta con la que se creó: si se ajusta, queda a la vista (tachada).
  meta_original numeric(16, 2) not null,
  unidad text not null check (unidad in ('numero', 'ars', 'usd', 'porcentaje', 'horas')),
  direccion text not null default 'mas_es_mejor' check (direccion in ('mas_es_mejor', 'menos_es_mejor')),
  acumulacion text not null check (acumulacion in ('suma_del_periodo', 'valor_al_cierre', 'promedio')),
  responsable text not null default 'los_dos' check (responsable in ('fabrizio', 'michel', 'los_dos')),
  -- Mensual que se recrea solo al cerrar, con la misma meta (editable).
  se_repite boolean not null default false,
  orden smallint not null default 100,
  archivada boolean not null default false,
  -- Si salió del plan inicial: para no cargarlo dos veces.
  clave_plan text unique check (clave_plan ~ '^[a-z0-9_]{1,80}$'),
  -- La meta anterior si esta es la repetición de un período cerrado.
  repite_de uuid references public.metas (id) on delete set null,
  creado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint metas_periodo check (hasta >= desde)
);

create index metas_abiertas_idx on public.metas (hasta) where not archivada;
create index metas_creado_por_idx on public.metas (creado_por);
create index metas_repite_de_idx on public.metas (repite_de) where repite_de is not null;

create trigger metas_actualizada
  before update on public.metas
  for each row execute function privado.marcar_actualizado();

-- Los cambios de la meta, con motivo: que no se "muevan los arcos" sin rastro.
create table public.metas_cambios (
  id bigint generated always as identity primary key,
  meta_id uuid not null references public.metas (id) on delete cascade,
  campo text not null check (char_length(campo) <= 40),
  valor_anterior text check (char_length(valor_anterior) <= 200),
  valor_nuevo text check (char_length(valor_nuevo) <= 200),
  motivo text not null check (char_length(btrim(motivo)) between 3 and 500),
  quien uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index metas_cambios_meta_idx on public.metas_cambios (meta_id, creado_en desc);
create index metas_cambios_quien_idx on public.metas_cambios (quien);

-- La foto del cierre de cada período: inmutable (no se recalcula después).
create table public.metas_cierres (
  id bigint generated always as identity primary key,
  meta_id uuid not null references public.metas (id) on delete cascade,
  desde date not null,
  hasta date not null,
  meta numeric(16, 2) not null,
  valor numeric(16, 2),
  resultado text not null check (resultado in ('cumplido', 'no_cumplido')),
  porcentaje numeric(8, 2),
  cerrado_en timestamptz not null default now(),
  unique (meta_id, desde, hasta)
);

-- La foto diaria del avance (para la curva real contra la ideal).
create table public.metas_fotos (
  meta_id uuid not null references public.metas (id) on delete cascade,
  dia date not null,
  valor numeric(16, 2),
  porcentaje numeric(8, 2),
  estado text not null check (estado in ('cumplido', 'en_camino', 'en_riesgo', 'atrasado', 'sin_datos')),
  primary key (meta_id, dia)
);

-- Avances que se cargan a mano (publicaciones, demos sin fuente todavía…).
create table public.avances_manuales (
  id bigint generated always as identity primary key,
  meta_id uuid not null references public.metas (id) on delete cascade,
  fecha date not null default current_date,
  valor numeric(16, 2) not null,
  nota text check (char_length(nota) <= 500),
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);
create index avances_manuales_meta_idx on public.avances_manuales (meta_id, fecha);
create index avances_manuales_cargado_por_idx on public.avances_manuales (cargado_por);

-- ── Facturación de Quvant (carga manual) ─────────────────────────────
create table public.cobros_quvant (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  cliente text not null check (char_length(btrim(cliente)) between 1 and 160),
  cliente_plantilla_id uuid references public.clientes_plantilla (id) on delete set null,
  nicho_id text references public.nichos (id),
  tipo text not null check (tipo in ('abono_mensual', 'implementacion', 'web', 'app_a_medida', 'otro')),
  monto_ars numeric(16, 2) not null check (monto_ars >= 0),
  iva_incluido boolean not null default false,
  factura text check (char_length(factura) <= 60),
  cobrado boolean not null default true,
  nota text check (char_length(nota) <= 500),
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index cobros_quvant_fecha_idx on public.cobros_quvant (fecha desc);
create index cobros_quvant_cliente_plantilla_idx on public.cobros_quvant (cliente_plantilla_id) where cliente_plantilla_id is not null;
create index cobros_quvant_nicho_idx on public.cobros_quvant (nicho_id);
create index cobros_quvant_cargado_por_idx on public.cobros_quvant (cargado_por);

create trigger cobros_quvant_actualizado
  before update on public.cobros_quvant
  for each row execute function privado.marcar_actualizado();

-- Pesos por dólar de cada mes, cargado a mano (sin APIs de cotización).
create table public.tipo_cambio_mensual (
  mes date primary key check (extract(day from mes) = 1),
  pesos_por_dolar numeric(12, 2) not null check (pesos_por_dolar > 0),
  fuente text check (char_length(fuente) <= 120),
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index tipo_cambio_cargado_por_idx on public.tipo_cambio_mensual (cargado_por);

-- ── Clientes: alta y baja (base del MRR, los clientes ganados y el churn) ──
alter table public.clientes_plantilla
  add column fecha_alta date,
  add column fecha_baja date,
  add constraint clientes_plantilla_alta_baja check (fecha_baja is null or fecha_alta is null or fecha_baja >= fecha_alta);

-- Los que ya están activos o de baja: el alta es la fecha que tenían.
update public.clientes_plantilla set fecha_alta = fecha where estado in ('activo', 'baja') and fecha_alta is null;
update public.clientes_plantilla set fecha_baja = greatest(fecha, (actualizado_en at time zone 'America/Argentina/Buenos_Aires')::date)
  where estado = 'baja' and fecha_baja is null;

-- Al pasar a "activo" se anota el alta; al pasar a "baja", la baja; si
-- vuelve a activo, la baja se borra. Así el panel de Plantillas no cambia.
create function privado.fechas_cliente_plantilla()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'activo' then
    new.fecha_alta := coalesce(new.fecha_alta, current_date);
    new.fecha_baja := null;
  elsif new.estado = 'baja' then
    new.fecha_baja := coalesce(new.fecha_baja, current_date);
  end if;
  return new;
end;
$$;
revoke all on function privado.fechas_cliente_plantilla() from public;

create trigger clientes_plantilla_fechas
  before insert or update of estado on public.clientes_plantilla
  for each row execute function privado.fechas_cliente_plantilla();

alter table public.clientes_sistema add column baja date;

-- ── Seguridad: solo admin ────────────────────────────────────────────
alter table public.metas enable row level security;
alter table public.metas_cambios enable row level security;
alter table public.metas_cierres enable row level security;
alter table public.metas_fotos enable row level security;
alter table public.avances_manuales enable row level security;
alter table public.cobros_quvant enable row level security;
alter table public.tipo_cambio_mensual enable row level security;

create policy "Solo los admin, metas" on public.metas
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, fotos de metas" on public.metas_fotos
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, avances manuales" on public.avances_manuales
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, cobros" on public.cobros_quvant
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, tipo de cambio" on public.tipo_cambio_mensual
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));

-- Cambios y cierres: se leen y se agregan; nunca se editan ni se borran.
create policy "Los admin leen los cambios de metas" on public.metas_cambios
  for select to authenticated using ((select privado.es_admin()));
create policy "Los admin anotan cambios de metas" on public.metas_cambios
  for insert to authenticated with check ((select privado.es_admin()));
create policy "Los admin leen los cierres" on public.metas_cierres
  for select to authenticated using ((select privado.es_admin()));
create policy "Los admin cierran períodos" on public.metas_cierres
  for insert to authenticated with check ((select privado.es_admin()));

revoke all on public.metas, public.metas_cambios, public.metas_cierres, public.metas_fotos,
  public.avances_manuales, public.cobros_quvant, public.tipo_cambio_mensual from anon, authenticated;
grant select, insert, update, delete on public.metas, public.metas_fotos, public.avances_manuales,
  public.cobros_quvant, public.tipo_cambio_mensual to authenticated;
grant select, insert on public.metas_cambios, public.metas_cierres to authenticated;
grant all on public.metas, public.metas_cambios, public.metas_cierres, public.metas_fotos,
  public.avances_manuales, public.cobros_quvant, public.tipo_cambio_mensual to service_role;
grant usage, select on sequence public.metas_cambios_id_seq, public.metas_cierres_id_seq, public.avances_manuales_id_seq to authenticated, service_role;

-- ── Visitantes únicos de la web, para las métricas de Objetivos ──────
-- Pares (día en Buenos Aires, navegador) del evento "visita", sin el
-- equipo. La app cuenta los distintos en cualquier rango.
create function public.visitantes_por_dia(desde date, hasta date)
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
    select visita_id from public.navegadores_equipo
  )
  select distinct (e.creado_en at time zone 'America/Argentina/Buenos_Aires')::date, e.visita_id
  from public.eventos e
  where e.tipo = 'visita'
    and e.creado_en >= (desde::timestamp at time zone 'America/Argentina/Buenos_Aires')
    and e.creado_en < ((hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires')
    and not exists (select 1 from equipo q where q.visita_id = e.visita_id);
$$;

revoke all on function public.visitantes_por_dia(date, date) from public, anon;
grant execute on function public.visitantes_por_dia(date, date) to authenticated, service_role;
