-- Promo de lanzamiento "Primeros 100" (docs/promo-primeros-100.md).
--
-- Las primeras 100 personas que confirman su email con la promo pedida se
-- quedan con un lugar numerado y un beneficio: 50 % en el desarrollo de
-- su web o app, o 2 meses sin cargo del sistema (solo rubros con sistema).
-- El número lo da la base, en el orden en que se confirman los emails,
-- con un candado para que dos confirmaciones al mismo tiempo no se lleven
-- el mismo lugar ni pasen de 100. La web solo ve un número: cuántos quedan.

-- ── Tipos ────────────────────────────────────────────────────────────
create type public.beneficio_promo as enum ('web_app_50', 'sistema_2_meses');

-- pedido: lo pidió y todavía no confirmó el email (no ocupa lugar).
-- espera: confirmó, pero no quedaban lugares o la promo ya había cerrado.
-- reservado → coordinando → en_uso → usado; o vencido / cancelado.
create type public.estado_lugar as enum ('pedido', 'espera', 'reservado', 'coordinando', 'en_uso', 'usado', 'vencido', 'cancelado');

-- Los eventos de la medición propia que suma la promo.
alter type public.tipo_evento add value if not exists 'vista_cinta_promo';
alter type public.tipo_evento add value if not exists 'cierre_cinta_promo';
alter type public.tipo_evento add value if not exists 'clic_cinta_promo';
alter type public.tipo_evento add value if not exists 'vista_promo';
alter type public.tipo_evento add value if not exists 'uso_demo_promo';
alter type public.tipo_evento add value if not exists 'play_video_promo';
alter type public.tipo_evento add value if not exists 'inicio_registro_promo';
alter type public.tipo_evento add value if not exists 'lugar_asignado';

-- En el mapa de prospección: si en la visita se dejó la tarjeta con el QR
-- de la promo (para cruzar con los lugares que vienen de utm_source=visita).
alter table public.visitas add column tarjeta_promo boolean not null default false;

-- ── Configuración (una sola fila) ────────────────────────────────────
create table public.promo_config (
  id boolean primary key default true check (id),
  activa boolean not null default true,
  tope integer not null default 100 check (tope between 1 and 10000),
  hasta date not null default '2027-01-31',
  -- Los rubros que pueden elegir los 2 meses del sistema.
  rubros_sistema text[] not null default array['industria', 'gimnasios'],
  actualizado_en timestamptz not null default now()
);
insert into public.promo_config default values;

create trigger promo_config_actualizado
  before update on public.promo_config
  for each row execute function privado.marcar_actualizado();

-- ── Los lugares ──────────────────────────────────────────────────────
create table public.promo_lugares (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfiles (id) on delete cascade,
  numero integer unique check (numero >= 1),
  beneficio public.beneficio_promo not null,
  estado public.estado_lugar not null default 'pedido',
  pedido_en timestamptz not null default now(),
  asignado_en timestamptz,
  notas text check (char_length(notas) <= 2000),
  es_prueba boolean not null default false,
  actualizado_en timestamptz not null default now(),
  -- Sin número mientras pide o espera; con número en todo lo demás.
  constraint numero_segun_estado check ((numero is null) = (estado in ('pedido', 'espera')))
);

create index promo_lugares_estado_idx on public.promo_lugares (estado);
create index promo_lugares_numero_idx on public.promo_lugares (numero) where numero is not null;

create trigger promo_lugares_actualizado
  before update on public.promo_lugares
  for each row execute function privado.marcar_actualizado();

-- Lo que nadie cambia por la API, ni un admin: de quién es, el número y
-- cuándo lo pidió. Solo las funciones de abajo (corren como dueño).
create function privado.proteger_lugar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if new.perfil_id is distinct from old.perfil_id
     or new.numero is distinct from old.numero
     or new.pedido_en is distinct from old.pedido_en
     or new.asignado_en is distinct from old.asignado_en then
    raise exception 'Ese dato del lugar no se puede cambiar.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger promo_lugares_proteger
  before update on public.promo_lugares
  for each row execute function privado.proteger_lugar();

-- ── ¿Puede elegir este beneficio? (los 2 meses, solo rubros con sistema) ─
create function privado.beneficio_permitido(beneficio public.beneficio_promo, nicho text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select beneficio = 'web_app_50'
      or nicho = any (coalesce((select c.rubros_sistema from public.promo_config c where c.id), '{}'::text[]));
$$;
revoke all on function privado.beneficio_permitido(public.beneficio_promo, text) from public;

-- ── Dar el lugar ─────────────────────────────────────────────────────
-- A una persona que pidió la promo y ya confirmó el email: el número que
-- sigue, o la lista de espera si no quedan o la promo cerró. El candado
-- (pg_advisory_xact_lock) pone en fila a las confirmaciones simultáneas.
create function privado.asignar_lugar_promo(persona uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  config public.promo_config;
  dados integer;
begin
  perform pg_advisory_xact_lock(hashtext('quvant.promo_primeros_100'));

  if not exists (
    select 1 from public.promo_lugares l
    where l.perfil_id = persona and l.estado = 'pedido'
  ) then
    return;
  end if;
  if not exists (
    select 1 from public.perfiles p
    where p.id = persona and p.email_confirmado_en is not null
  ) then
    return;
  end if;

  select * into config from public.promo_config where id;
  select count(*) into dados from public.promo_lugares where numero is not null;

  if config.activa and current_date <= config.hasta and dados < config.tope then
    update public.promo_lugares
       set numero = dados + 1, estado = 'reservado', asignado_en = now()
     where perfil_id = persona;
    insert into public.eventos (tipo, nicho_id, pagina, perfil_id)
    select 'lugar_asignado', p.nicho_id, '/primeros-100', p.id
    from public.perfiles p where p.id = persona;
  else
    update public.promo_lugares set estado = 'espera' where perfil_id = persona;
  end if;
end;
$$;
revoke all on function privado.asignar_lugar_promo(uuid) from public;

-- Al registrarse con la promo (options.data.promo_beneficio): anota el
-- pedido. Corre después de crear_perfil (los triggers van por orden
-- alfabético: al_registrarse < al_registrarse_promo).
create function privado.pedir_lugar_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pedido text := datos ->> 'promo_beneficio';
  beneficio public.beneficio_promo;
begin
  if pedido is null or pedido not in ('web_app_50', 'sistema_2_meses') then
    return new;
  end if;
  beneficio := pedido::public.beneficio_promo;
  if not privado.beneficio_permitido(beneficio, datos ->> 'nicho') then
    raise exception 'Ese beneficio no está disponible para tu rubro.' using errcode = '23514';
  end if;

  insert into public.promo_lugares (perfil_id, beneficio, es_prueba)
  values (new.id, beneficio, new.email like '%@prueba.quvant.test')
  on conflict (perfil_id) do nothing;

  if new.email_confirmed_at is not null then
    perform privado.asignar_lugar_promo(new.id);
  end if;
  return new;
end;
$$;
revoke all on function privado.pedir_lugar_al_registrarse() from public;

create trigger al_registrarse_promo
  after insert on auth.users
  for each row execute function privado.pedir_lugar_al_registrarse();

-- Al confirmar el email: si había pedido la promo, se le da el lugar.
create function privado.lugar_al_confirmar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.asignar_lugar_promo(new.id);
  return new;
end;
$$;
revoke all on function privado.lugar_al_confirmar() from public;

create trigger perfiles_lugar_al_confirmar
  after update of email_confirmado_en on public.perfiles
  for each row
  when (old.email_confirmado_en is null and new.email_confirmado_en is not null)
  execute function privado.lugar_al_confirmar();

-- ── Lo que la web puede pedir ────────────────────────────────────────
-- Solo números: si está activa, el tope, cuántos se dieron y cuántos quedan.
create function public.estado_promo()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'activa', c.activa and current_date <= c.hasta,
    'tope', c.tope,
    'dados', d.dados,
    'quedan', greatest(c.tope - d.dados, 0),
    'hasta', c.hasta,
    'rubros_sistema', to_jsonb(c.rubros_sistema)
  )
  from public.promo_config c
  cross join lateral (select count(*)::int as dados from public.promo_lugares where numero is not null) d
  where c.id;
$$;
revoke all on function public.estado_promo() from public;
grant execute on function public.estado_promo() to anon, authenticated, service_role;

-- Una persona ya confirmada reserva su lugar desde /cuenta. Si ya tenía
-- uno, no cambia nada. Devuelve su fila (número y estado).
create function public.reservar_lugar_promo(beneficio public.beneficio_promo)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  persona uuid := (select auth.uid());
  perfil public.perfiles;
  fila public.promo_lugares;
begin
  if persona is null then
    raise exception 'Hay que ingresar para reservar.' using errcode = '42501';
  end if;
  select * into perfil from public.perfiles where id = persona;
  if perfil.email_confirmado_en is null then
    raise exception 'Primero confirmá tu email.' using errcode = '42501';
  end if;
  if perfil.rol = 'admin' then
    raise exception 'Las cuentas de admin no reservan lugar.' using errcode = '42501';
  end if;
  if not privado.beneficio_permitido(reservar_lugar_promo.beneficio, perfil.nicho_id) then
    raise exception 'Ese beneficio no está disponible para tu rubro.' using errcode = '23514';
  end if;

  insert into public.promo_lugares (perfil_id, beneficio, es_prueba)
  values (persona, reservar_lugar_promo.beneficio, perfil.email like '%@prueba.quvant.test')
  on conflict (perfil_id) do nothing;
  -- Si todavía estaba en "pedido" (sin lugar), vale el beneficio que elige ahora.
  update public.promo_lugares l set beneficio = reservar_lugar_promo.beneficio
   where l.perfil_id = persona and l.estado = 'pedido';

  perform privado.asignar_lugar_promo(persona);

  select * into fila from public.promo_lugares where perfil_id = persona;
  return jsonb_build_object('numero', fila.numero, 'estado', fila.estado, 'beneficio', fila.beneficio);
end;
$$;
revoke all on function public.reservar_lugar_promo(public.beneficio_promo) from public;
grant execute on function public.reservar_lugar_promo(public.beneficio_promo) to authenticated;

-- El lugar de quien pregunta: número, estado, beneficio y, si está en
-- espera, en qué posición (sin ver a nadie más). Null si no pidió.
create function public.mi_lugar_promo()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'numero', l.numero,
    'estado', l.estado,
    'beneficio', l.beneficio,
    'asignado_en', l.asignado_en,
    'posicion_espera', case when l.estado = 'espera' then (
      select count(*) + 1 from public.promo_lugares o
      where o.estado = 'espera' and o.pedido_en < l.pedido_en
    ) end
  )
  from public.promo_lugares l
  where l.perfil_id = (select auth.uid());
$$;
revoke all on function public.mi_lugar_promo() from public;
grant execute on function public.mi_lugar_promo() to authenticated;

-- El embudo de la promo para el panel: visitas distintas y eventos por tipo.
-- security invoker: lo calcula con los permisos de quien pregunta (RLS de
-- eventos: solo admin). Sin los navegadores del equipo (20261022120300).
create function public.embudo_promo(desde timestamptz)
returns table (tipo public.tipo_evento, visitas bigint, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.tipo, count(distinct coalesce(e.visita_id::text, e.perfil_id::text)), count(*)
  from public.eventos e
  where e.creado_en >= desde
    and (e.tipo::text like '%_promo' or e.tipo::text = 'lugar_asignado')
    and not exists (select 1 from public.navegadores_equipo n where n.visita_id = e.visita_id)
  group by e.tipo;
$$;
revoke all on function public.embudo_promo(timestamptz) from public;
grant execute on function public.embudo_promo(timestamptz) to authenticated;

-- La bitácora del panel (20261023150000) también anota la promo: quién
-- pausó o reabrió la promo y quién cambió el estado de un lugar.
create trigger promo_lugares_bitacora
  after insert or update or delete on public.promo_lugares
  for each row execute function privado.anotar_bitacora();
create trigger promo_config_bitacora
  after update on public.promo_config
  for each row execute function privado.anotar_bitacora();

-- ── Seguridad ────────────────────────────────────────────────────────
alter table public.promo_config enable row level security;
alter table public.promo_lugares enable row level security;

create policy "Solo los admin, configuración de la promo" on public.promo_config
  for all to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

create policy "Cada persona ve su lugar; los admin, todos" on public.promo_lugares
  for select to authenticated
  using (perfil_id = (select auth.uid()) or (select privado.es_admin()));

create policy "Solo los admin cambian los lugares" on public.promo_lugares
  for update to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

-- Por la API: leer (con la regla de arriba) y, los admin, cambiar estado,
-- beneficio y notas. Nadie inserta ni borra: eso lo hacen las funciones.
revoke all on public.promo_config, public.promo_lugares from anon, authenticated;
grant select, update (activa, tope, hasta, rubros_sistema) on public.promo_config to authenticated;
grant select, update (estado, beneficio, notas) on public.promo_lugares to authenticated;
grant all on public.promo_config, public.promo_lugares to service_role;
