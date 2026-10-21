-- Seguimiento comercial (prompt 1): del registro al cliente.
--
-- Una oportunidad por negocio en seguimiento, con su etapa, y el historial
-- de lo que se hizo (llamadas, mensajes, demos, propuestas, cambios de
-- etapa), que se agrega y nunca se edita. Las altas son automáticas desde
-- la web (registro), el mapa (local interesado) y el chat (lo hace el
-- servidor, porque el chat guarda en Redis). Todo solo para admin.

create table public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  origen text not null check (origen in ('registro', 'local', 'chat', 'manual')),
  perfil_id uuid references public.perfiles (id) on delete set null,
  local_id uuid references public.locales (id) on delete set null,
  conversacion_id text check (char_length(conversacion_id) <= 80),
  negocio text not null check (char_length(btrim(negocio)) between 1 and 160),
  contacto text check (char_length(contacto) <= 120),
  telefono text check (char_length(telefono) <= 60),
  email text check (char_length(email) <= 200),
  nicho_id text references public.nichos (id),
  ciudad text check (char_length(ciudad) <= 120),
  etapa text not null default 'nuevo'
    check (etapa in ('nuevo', 'contactado', 'demo_agendada', 'demo_hecha', 'propuesta', 'negociacion', 'ganado', 'perdido')),
  -- Valor estimado, en pesos: el abono mensual y/o el proyecto.
  valor_abono numeric(14, 2) check (valor_abono >= 0),
  valor_proyecto numeric(14, 2) check (valor_proyecto >= 0),
  -- 0 a 100. Si es null, la app usa la de la etapa.
  probabilidad smallint check (probabilidad between 0 and 100),
  responsable text not null default 'fabrizio' check (responsable in ('fabrizio', 'michel')),
  proximo_paso text check (char_length(proximo_paso) <= 300),
  proximo_paso_fecha date,
  motivo_perdida text check (motivo_perdida in ('precio', 'ya_tiene_sistema', 'no_es_el_momento', 'no_responde', 'otro')),
  motivo_perdida_texto text check (char_length(motivo_perdida_texto) <= 300),
  cliente_plantilla_id uuid references public.clientes_plantilla (id) on delete set null,
  -- Desde cuándo está en la etapa actual (para "días en la etapa").
  etapa_desde timestamptz not null default now(),
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index oportunidades_etapa_idx on public.oportunidades (etapa, proximo_paso_fecha);
create index oportunidades_perfil_idx on public.oportunidades (perfil_id) where perfil_id is not null;
create index oportunidades_local_idx on public.oportunidades (local_id) where local_id is not null;
create index oportunidades_cliente_idx on public.oportunidades (cliente_plantilla_id) where cliente_plantilla_id is not null;
create index oportunidades_nicho_idx on public.oportunidades (nicho_id);
create index oportunidades_email_idx on public.oportunidades (lower(email)) where email is not null;
create unique index oportunidades_conversacion_unica on public.oportunidades (conversacion_id) where conversacion_id is not null;

create trigger oportunidades_actualizada
  before update on public.oportunidades
  for each row execute function privado.marcar_actualizado();

-- Al cambiar de etapa, se reinicia el reloj de la etapa.
create function privado.reloj_de_etapa()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.etapa is distinct from old.etapa then
    new.etapa_desde := now();
  end if;
  return new;
end;
$$;
revoke all on function privado.reloj_de_etapa() from public;
create trigger oportunidades_reloj
  before update of etapa on public.oportunidades
  for each row execute function privado.reloj_de_etapa();

-- El historial: se agrega, nunca se edita ni se borra.
create table public.oportunidades_actividad (
  id bigint generated always as identity primary key,
  oportunidad_id uuid not null references public.oportunidades (id) on delete cascade,
  tipo text not null check (tipo in ('cambio_etapa', 'llamada', 'mensaje', 'reunion', 'demo', 'propuesta', 'nota')),
  etapa_anterior text,
  etapa_nueva text,
  resultado text check (char_length(resultado) <= 500),
  quien uuid default auth.uid() references public.perfiles (id) on delete set null,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);
create index oportunidades_actividad_op_idx on public.oportunidades_actividad (oportunidad_id, creado_en);
create index oportunidades_actividad_tipo_idx on public.oportunidades_actividad (tipo, creado_en);
create index oportunidades_actividad_quien_idx on public.oportunidades_actividad (quien);

-- ── Altas automáticas ────────────────────────────────────────────────
-- Persona que se registra (no admin) → oportunidad "nuevo", sin duplicar
-- por email o teléfono mientras haya una abierta.
create function privado.oportunidad_por_registro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rol <> 'usuario' then
    return new;
  end if;
  if exists (
    select 1 from public.oportunidades o
    where o.etapa not in ('ganado', 'perdido')
      and (lower(o.email) = lower(new.email) or (new.telefono is not null and o.telefono = new.telefono))
  ) then
    return new;
  end if;
  insert into public.oportunidades (origen, perfil_id, negocio, contacto, telefono, email, nicho_id, ciudad, es_prueba)
  values (
    'registro', new.id,
    coalesce(nullif(btrim(new.empresa), ''), btrim(new.nombre || ' ' || coalesce(new.apellido, ''))),
    btrim(new.nombre || ' ' || coalesce(new.apellido, '')),
    new.telefono, new.email, new.nicho_id, new.ciudad,
    new.email like '%@prueba.quvant.test'
  );
  return new;
end;
$$;
revoke all on function privado.oportunidad_por_registro() from public;
create trigger perfiles_oportunidad
  after insert on public.perfiles
  for each row execute function privado.oportunidad_por_registro();

-- Local del mapa que pasa a "interesado" → oportunidad, si no tiene una.
create function privado.oportunidad_por_local()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado = 'interesado' and old.estado is distinct from 'interesado'
     and not exists (select 1 from public.oportunidades o where o.local_id = new.id) then
    insert into public.oportunidades (origen, local_id, negocio, contacto, telefono, nicho_id, ciudad, responsable, es_prueba)
    values ('local', new.id, new.nombre, new.contacto, new.telefono, new.nicho_id, new.ciudad, 'fabrizio', new.es_prueba);
  end if;
  return new;
end;
$$;
revoke all on function privado.oportunidad_por_local() from public;
create trigger locales_oportunidad
  after update of estado on public.locales
  for each row execute function privado.oportunidad_por_local();

-- ── Seguridad: solo admin ────────────────────────────────────────────
alter table public.oportunidades enable row level security;
alter table public.oportunidades_actividad enable row level security;

create policy "Solo los admin, oportunidades" on public.oportunidades
  for all to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()));
create policy "Los admin leen la actividad" on public.oportunidades_actividad
  for select to authenticated using ((select privado.es_admin()));
create policy "Los admin anotan actividad" on public.oportunidades_actividad
  for insert to authenticated with check ((select privado.es_admin()));

revoke all on public.oportunidades, public.oportunidades_actividad from anon, authenticated;
grant select, insert, update, delete on public.oportunidades to authenticated;
grant select, insert on public.oportunidades_actividad to authenticated;
grant all on public.oportunidades, public.oportunidades_actividad to service_role;
grant usage, select on sequence public.oportunidades_actividad_id_seq to authenticated, service_role;

-- ── Las que ya existen: registros y locales interesados de antes ─────
insert into public.oportunidades (origen, perfil_id, negocio, contacto, telefono, email, nicho_id, ciudad, creado_en, etapa_desde, es_prueba)
select 'registro', p.id,
       coalesce(nullif(btrim(p.empresa), ''), btrim(p.nombre || ' ' || coalesce(p.apellido, ''))),
       btrim(p.nombre || ' ' || coalesce(p.apellido, '')),
       p.telefono, p.email, p.nicho_id, p.ciudad, p.creado_en, p.creado_en,
       p.email like '%@prueba.quvant.test'
from public.perfiles p
where p.rol = 'usuario';

insert into public.oportunidades (origen, local_id, negocio, contacto, telefono, nicho_id, ciudad, es_prueba)
select 'local', l.id, l.nombre, l.contacto, l.telefono, l.nicho_id, l.ciudad, l.es_prueba
from public.locales l
where l.estado = 'interesado';
