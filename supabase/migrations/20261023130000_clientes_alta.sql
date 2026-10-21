-- Alta de clientes reales, permiso para compartir métricas y bajas con motivo
-- (prompt 4, 21-oct-2026).
--
-- · permisos_metricas: la constancia de cada vez que un socio aceptó (o
--   dejó de aceptar) que sus métricas de uso entren en "los que más venden".
--   Solo se agrega: el historial no se edita ni se borra.
-- · clientes_sistema.comparte_metricas solo se prende si la última
--   constancia de ese cliente dice "prendido" (lo controla la base, no solo
--   el panel).
-- · Baja con fecha y motivo (lista cerrada) en los dos lados del cliente:
--   alimenta el churn de Objetivos y de los nichos.

-- ── Constancias del permiso de métricas ──────────────────────────────
create table public.permisos_metricas (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes_sistema (id) on delete cascade,
  accion text not null check (accion in ('prendido', 'apagado')),
  -- Cuándo aceptó (o pidió apagarlo) el socio.
  fecha date not null default current_date,
  -- Quién aceptó del lado del socio (nombre y cargo, sin otros datos).
  quien text not null check (char_length(btrim(quien)) between 1 and 160),
  medio text not null check (medio in ('contrato', 'email', 'mensaje', 'otro')),
  -- Dónde está la constancia (cláusula, asunto del email, fecha del mensaje).
  detalle text check (char_length(detalle) <= 500),
  cargado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create index permisos_metricas_cliente_idx on public.permisos_metricas (cliente_id, creado_en desc);
create index permisos_metricas_cargado_por_idx on public.permisos_metricas (cargado_por);

-- Sin constancia, no se prende.
create function privado.exigir_constancia_metricas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ultima text;
begin
  if new.comparte_metricas and (tg_op = 'INSERT' or not old.comparte_metricas) then
    select accion into ultima
      from public.permisos_metricas
      where cliente_id = new.id
      order by creado_en desc, id desc
      limit 1;
    if ultima is distinct from 'prendido' then
      raise exception 'Para compartir métricas hace falta una constancia de que el socio aceptó.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function privado.exigir_constancia_metricas() from public;

create trigger clientes_sistema_constancia
  before insert or update of comparte_metricas on public.clientes_sistema
  for each row execute function privado.exigir_constancia_metricas();

-- ── Baja con motivo ──────────────────────────────────────────────────
alter table public.clientes_sistema
  add column motivo_baja text check (motivo_baja in ('precio', 'no_lo_usaba', 'cerro_el_negocio', 'otro_sistema', 'falta_funcion', 'problemas_tecnicos', 'otro')),
  add column nota_baja text check (char_length(nota_baja) <= 500);

alter table public.clientes_plantilla
  add column motivo_baja text check (motivo_baja in ('precio', 'no_lo_usaba', 'cerro_el_negocio', 'otro_sistema', 'falta_funcion', 'problemas_tecnicos', 'otro'));

-- ── Seguridad: solo admin ────────────────────────────────────────────
alter table public.permisos_metricas enable row level security;

create policy "Los admin leen los permisos de métricas" on public.permisos_metricas
  for select to authenticated using ((select privado.es_admin()));
create policy "Los admin anotan permisos de métricas" on public.permisos_metricas
  for insert to authenticated with check ((select privado.es_admin()));

revoke all on public.permisos_metricas from anon, authenticated;
grant select, insert on public.permisos_metricas to authenticated;
grant all on public.permisos_metricas to service_role;
grant usage, select on sequence public.permisos_metricas_id_seq to authenticated, service_role;
