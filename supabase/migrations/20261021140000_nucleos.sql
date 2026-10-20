-- Sección Núcleos del panel (Parte B): los núcleos (nichos), los clientes
-- del sistema, la foto diaria de sus indicadores, las alertas, los
-- acompañamientos y lo que respondió Claude. Todo solo para admin.
--
-- Escrita en el modo noche del 20-oct-2026 y NO aplicada a la base remota
-- (validada en un Postgres local). Aplicar con: npx.cmd supabase db push --linked

-- ── Núcleos ──────────────────────────────────────────────────────────
create table public.nucleos (
  id text primary key check (id ~ '^[a-z_]+$'),
  nombre text not null,
  -- La plantilla del sistema a la que corresponde (medicion-sistema/catalogo.ts). Puede no tener todavía.
  plantilla text check (plantilla ~ '^[a-z_]+$'),
  estado text not null default 'proximamente' check (estado in ('activo', 'proximamente')),
  orden smallint not null
);

insert into public.nucleos (id, nombre, plantilla, estado, orden) values
  ('industria',     'Industria y comercio',  'industria',     'activo',       1),
  ('gimnasios',     'Gimnasios y fitness',   'gimnasios',     'activo',       2),
  ('holistica',     'Holística',             'holistica',     'activo',       3),
  ('kioscos',       'Kioscos',               'kioscos',       'proximamente', 4),
  ('pymes',         'Pymes',                 'pymes',         'proximamente', 5),
  ('inmobiliarias', 'Inmobiliarias',         'inmobiliarias', 'proximamente', 6),
  ('supermercados', 'Supermercados',         'supermercados', 'proximamente', 7);

-- ── Clientes del sistema ─────────────────────────────────────────────
-- Una fila por organización cliente. organizacion_id es el mismo que viaja
-- en los eventos de PostHog. Si el cliente salió de la prospección
-- (clientes_plantilla), se enlaza en vez de duplicar datos.
create table public.clientes_sistema (
  id uuid primary key default gen_random_uuid(),
  organizacion_id text not null unique check (char_length(organizacion_id) between 1 and 120),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 160),
  nucleo_id text not null references public.nucleos (id),
  alta date not null default current_date,
  plan text check (plan in ('negocio', 'multinegocio')),
  sucursales_contratadas smallint not null default 1 check (sucursales_contratadas >= 1),
  usuarios_contratados smallint not null default 1 check (usuarios_contratados >= 1),
  -- Quién lo acompaña en Quvant.
  responsable text not null default 'fabrizio' check (responsable in ('fabrizio', 'michel')),
  -- Qué módulos tiene activos (para las funciones clave condicionales, por ejemplo el taller).
  modulos_activos text[] not null default '{}',
  cliente_plantilla_id uuid references public.clientes_plantilla (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index clientes_sistema_nucleo_idx on public.clientes_sistema (nucleo_id);
create index clientes_sistema_responsable_idx on public.clientes_sistema (responsable);
create index clientes_sistema_cliente_plantilla_idx on public.clientes_sistema (cliente_plantilla_id) where cliente_plantilla_id is not null;

create trigger clientes_sistema_actualizado
  before update on public.clientes_sistema
  for each row execute function privado.marcar_actualizado();

-- ── Foto diaria de los indicadores ───────────────────────────────────
-- Lo que calcula el proceso diario (src/nucleos/indicadores.ts), guardado
-- entero en datos para que el panel cargue rápido y se vean tendencias
-- largas sin consultar PostHog cada vez.
create table public.indicadores_diarios (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes_sistema (id) on delete cascade,
  dia date not null,
  salud smallint check (salud between 0 and 100),
  semaforo text check (semaforo in ('verde', 'amarillo', 'rojo', 'arranque')),
  datos jsonb not null,
  creado_en timestamptz not null default now(),
  unique (cliente_id, dia)
);

create index indicadores_diarios_dia_idx on public.indicadores_diarios (dia desc);

-- ── Alertas ──────────────────────────────────────────────────────────
create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes_sistema (id) on delete cascade,
  tipo text not null check (tipo in (
    'dejo_de_usar', 'nunca_uso', 'cayo_actividad', 'sucursal_sin_actividad', 'bajo_semaforo', 'sin_sesiones'
  )),
  funcion_clave text,
  gravedad text not null default 'amarilla' check (gravedad in ('roja', 'amarilla')),
  fecha timestamptz not null default now(),
  estado text not null default 'nueva' check (estado in ('nueva', 'vista', 'resuelta', 'descartada')),
  detalle jsonb not null default '{}'::jsonb,
  resuelta_por uuid references public.perfiles (id) on delete set null,
  resuelta_en timestamptz,
  resolucion text check (char_length(resolucion) <= 1000),
  es_prueba boolean not null default false
);

create index alertas_cliente_estado_idx on public.alertas (cliente_id, estado);
create index alertas_abiertas_idx on public.alertas (fecha desc) where estado in ('nueva', 'vista');
create index alertas_resuelta_por_idx on public.alertas (resuelta_por) where resuelta_por is not null;

-- ── Acompañamientos ──────────────────────────────────────────────────
-- Lo que hicimos por cada cliente: así se ve si después de actuar mejoró.
create table public.acompanamientos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes_sistema (id) on delete cascade,
  fecha date not null default current_date,
  quien uuid default auth.uid() references public.perfiles (id) on delete set null,
  tipo text not null check (tipo in ('llamada', 'visita', 'capacitacion', 'mensaje', 'correccion', 'novedad')),
  nota text check (char_length(nota) <= 2000),
  alerta_id uuid references public.alertas (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);

create index acompanamientos_cliente_fecha_idx on public.acompanamientos (cliente_id, fecha desc);
create index acompanamientos_quien_idx on public.acompanamientos (quien) where quien is not null;
create index acompanamientos_alerta_idx on public.acompanamientos (alerta_id) where alerta_id is not null;

-- ── Lo que respondió Claude (una por cliente o núcleo y por día) ─────
create table public.analisis_claude (
  id bigint generated always as identity primary key,
  alcance text not null check (alcance in ('cliente', 'nucleo')),
  cliente_id uuid references public.clientes_sistema (id) on delete cascade,
  nucleo_id text references public.nucleos (id) on delete cascade,
  dia date not null default current_date,
  modelo text not null,
  respuesta jsonb not null,
  creado_en timestamptz not null default now(),
  constraint analisis_claude_objetivo check ((alcance = 'cliente') = (cliente_id is not null) and (alcance = 'nucleo') = (nucleo_id is not null))
);

create unique index analisis_claude_cliente_dia on public.analisis_claude (cliente_id, dia) where cliente_id is not null;
create unique index analisis_claude_nucleo_dia on public.analisis_claude (nucleo_id, dia) where nucleo_id is not null;

-- ── Seguridad: solo admin ────────────────────────────────────────────
alter table public.nucleos enable row level security;
alter table public.clientes_sistema enable row level security;
alter table public.indicadores_diarios enable row level security;
alter table public.alertas enable row level security;
alter table public.acompanamientos enable row level security;
alter table public.analisis_claude enable row level security;

create policy "Solo los admin, núcleos" on public.nucleos for select to authenticated using ((select privado.es_admin()));
create policy "Solo los admin, clientes del sistema" on public.clientes_sistema for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, indicadores" on public.indicadores_diarios for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, alertas" on public.alertas for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Solo los admin, acompañamientos" on public.acompanamientos for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()) and (quien is null or privado.es_admin(quien)));
create policy "Solo los admin, análisis" on public.analisis_claude for all to authenticated
  using ((select privado.es_admin())) with check ((select privado.es_admin()));

revoke all on public.nucleos, public.clientes_sistema, public.indicadores_diarios, public.alertas, public.acompanamientos, public.analisis_claude
  from anon, authenticated;
grant select on public.nucleos to authenticated;
grant select, insert, update, delete on public.clientes_sistema, public.indicadores_diarios, public.alertas, public.acompanamientos, public.analisis_claude
  to authenticated;
grant all on public.nucleos, public.clientes_sistema, public.indicadores_diarios, public.alertas, public.acompanamientos, public.analisis_claude
  to service_role;
grant usage, select on sequence public.indicadores_diarios_id_seq, public.analisis_claude_id_seq to authenticated, service_role;
