-- Registro de personas: catálogos (nichos y objetivos), perfiles, eventos
-- para medir las plantillas y la lista de emails administradores.
--
-- Reglas duras (no solo en la interfaz):
--   · cada persona lee y edita solo su perfil, y nunca su rol;
--   · los eventos se cargan solo desde el servidor (clave secreta);
--   · admin = email en privado.emails_admin + email confirmado.

-- ── Esquema privado ──────────────────────────────────────────────────
-- La API de Supabase expone solo "public": lo que está acá no se puede
-- llamar ni leer por la red. Las reglas (RLS) sí pueden usar sus funciones.
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated, service_role;

create function privado.marcar_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ── Catálogos ────────────────────────────────────────────────────────
-- Tablas y no enums para que sumar un rubro sea un insert. en_registro:
-- si aparece en /registro. tiene_plantilla: si lleva tarjeta en el panel.
create table public.nichos (
  id text primary key check (id ~ '^[a-z_]+$'),
  nombre text not null,
  orden smallint not null,
  en_registro boolean not null default true,
  tiene_plantilla boolean not null default false
);

insert into public.nichos (id, nombre, orden, en_registro, tiene_plantilla) values
  ('industria',     'Industria',           1,  true,  true),
  ('gimnasios',     'Gimnasios y fitness', 2,  true,  true),
  ('holistica',     'Holística',           3,  true,  true),
  ('pymes',         'Pymes',               4,  true,  false),
  ('inmobiliarias', 'Inmobiliarias',       5,  true,  false),
  ('supermercados', 'Supermercados',       6,  true,  false),
  -- Rubros que la web ya muestra como "próximamente": se miden, no se eligen.
  ('kioscos',       'Kioscos',             7,  false, false),
  ('farmacias',     'Farmacias',           8,  false, false),
  ('abogacia',      'Abogacía',            9,  false, false),
  ('otro',          'Otro rubro',          99, true,  false);

create table public.objetivos (
  id text primary key check (id ~ '^[a-z_]+$'),
  texto text not null,
  orden smallint not null
);

insert into public.objetivos (id, texto, orden) values
  ('mejorar_clientela', 'Quiero mejorar mi clientela',                 1),
  ('hacer_web',         'Quiero hacer mi página web',                  2),
  ('curiosidad',        'Curiosidad, pero me interesa lo que ofrecen', 3);

alter table public.nichos enable row level security;
alter table public.objetivos enable row level security;

create policy "Cualquiera lee los nichos" on public.nichos
  for select to anon, authenticated using (true);
create policy "Cualquiera lee los objetivos" on public.objetivos
  for select to anon, authenticated using (true);

-- Permisos explícitos (no dependen de la configuración del proyecto):
-- se leen por la API y solo cambian con migraciones.
revoke all on public.nichos, public.objetivos from anon, authenticated;
grant select on public.nichos, public.objetivos to anon, authenticated;
grant all on public.nichos, public.objetivos to service_role;

-- ── Perfiles ─────────────────────────────────────────────────────────
create type public.rol as enum ('usuario', 'admin');

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Copia del email de auth.users (la mantiene un trigger) para que el
  -- panel liste y exporte sin tocar el esquema auth.
  email text not null,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  apellido text check (char_length(apellido) <= 80),
  nicho_id text not null references public.nichos (id),
  nicho_otro text check (char_length(nicho_otro) <= 80),
  objetivo_id text not null references public.objetivos (id),
  empresa text check (char_length(empresa) <= 120),
  ciudad text check (char_length(ciudad) <= 80),
  telefono text check (char_length(telefono) <= 40),
  acepta_novedades boolean not null default false,
  -- Constancia del consentimiento (Ley 25.326): cuándo aceptó la política.
  acepto_privacidad_en timestamptz not null default now(),
  rol public.rol not null default 'usuario',
  -- De dónde vino: utm_source o la sección donde tocó "Registrarme".
  origen text check (char_length(origen) <= 200),
  creado_en timestamptz not null default now(),
  email_confirmado_en timestamptz,
  actualizado_en timestamptz not null default now(),
  constraint nicho_otro_si_elige_otro
    check (nicho_id <> 'otro' or nullif(btrim(nicho_otro), '') is not null)
);

create index perfiles_nicho_idx on public.perfiles (nicho_id);
create index perfiles_objetivo_idx on public.perfiles (objetivo_id);
create index perfiles_creado_idx on public.perfiles (creado_en desc);
create index perfiles_email_idx on public.perfiles (lower(email));

create trigger perfiles_actualizado
  before update on public.perfiles
  for each row execute function privado.marcar_actualizado();

-- Los emails que pueden ser admin. Se cargan a mano por SQL
-- (supabase/scripts/administradores.sql); ningún formulario los toca.
create table privado.emails_admin (
  email text primary key check (email = lower(btrim(email)))
);
revoke all on privado.emails_admin from public, anon, authenticated;

-- ¿Quien hace el pedido es admin? security definer para leer perfiles sin
-- caer en la regla de perfiles (que a su vez pregunta esto).
create function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin'
  );
$$;

-- ¿Esta persona (por id) es admin? Para validar "quién fue" en las visitas.
create function privado.es_admin(persona uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles where id = persona and rol = 'admin'
  );
$$;

revoke all on function privado.es_admin() from public;
revoke all on function privado.es_admin(uuid) from public;
grant execute on function privado.es_admin() to anon, authenticated, service_role;
grant execute on function privado.es_admin(uuid) to authenticated, service_role;

-- El rol que corresponde: admin solo si el email está en la lista Y ya
-- está confirmado (así nadie se registra con un email ajeno y entra).
-- Nunca baja a nadie de admin: eso se hace a mano.
create function privado.rol_que_corresponde(actual public.rol, email text, confirmado_en timestamptz)
returns public.rol
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when confirmado_en is not null
     and exists (select 1 from privado.emails_admin a where a.email = lower(btrim($2)))
      then 'admin'::public.rol
    else actual
  end;
$$;
revoke all on function privado.rol_que_corresponde(public.rol, text, timestamptz) from public;

-- Lo que una persona no puede cambiar de su perfil aunque arme el pedido a
-- mano: rol, email, fechas, consentimiento y origen. Solo pasa lo que viene
-- de SQL directo (migraciones, editor SQL) o de los triggers de abajo, que
-- corren como dueños (postgres). Ni la clave secreta del servidor puede.
create function privado.proteger_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.rol <> 'usuario' then
      raise exception 'El rol no se puede elegir desde la web.' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.rol is distinct from old.rol then
    raise exception 'El rol no se puede cambiar desde la web.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.creado_en is distinct from old.creado_en
     or new.email_confirmado_en is distinct from old.email_confirmado_en
     or new.acepto_privacidad_en is distinct from old.acepto_privacidad_en
     or new.origen is distinct from old.origen then
    raise exception 'Ese dato no se puede cambiar desde la web.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger
  before insert or update on public.perfiles
  for each row execute function privado.proteger_perfil();

alter table public.perfiles enable row level security;

create policy "Cada persona ve su perfil; los admin, todos" on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select privado.es_admin()));

create policy "Cada persona edita solo su perfil" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Segunda capa: por la API solo se pueden tocar estas columnas. Nadie crea
-- ni borra perfiles por la API (los crea el trigger del registro y se
-- borran con la cuenta).
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, apellido, nicho_id, nicho_otro, objetivo_id, empresa, ciudad, telefono, acepta_novedades)
  on public.perfiles to authenticated;
grant all on public.perfiles to service_role;

-- ── Eventos (para medir las plantillas) ──────────────────────────────
create type public.tipo_evento as enum (
  'vista_nicho', 'clic_demo', 'clic_contacto',
  'inicio_registro', 'registro_completo', 'email_confirmado'
);

-- Sin datos personales: ni IP, ni navegador, ni email. visita_id es un id
-- anónimo propio de la web; perfil_id, solo si la persona está registrada.
create table public.eventos (
  id bigint generated always as identity primary key,
  tipo public.tipo_evento not null,
  nicho_id text references public.nichos (id),
  pagina text check (char_length(pagina) <= 200),
  visita_id uuid,
  perfil_id uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now()
);

create index eventos_tipo_nicho_fecha_idx on public.eventos (tipo, nicho_id, creado_en desc);
create index eventos_visita_fecha_idx on public.eventos (visita_id, creado_en desc) where visita_id is not null;
create index eventos_perfil_idx on public.eventos (perfil_id) where perfil_id is not null;

-- Límite simple: una visita carga como mucho 60 eventos cada 10 minutos, y
-- una vista del mismo nicho cuenta una vez cada 30 minutos. Lo que sobra se
-- descarta en silencio (return null), sin error.
create function privado.limitar_eventos()
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
  if new.tipo = 'vista_nicho' and exists (
    select 1 from public.eventos
    where visita_id = new.visita_id
      and tipo = 'vista_nicho'
      and nicho_id is not distinct from new.nicho_id
      and creado_en > now() - interval '30 minutes'
  ) then
    return null;
  end if;
  return new;
end;
$$;

create trigger eventos_limitar
  before insert on public.eventos
  for each row execute function privado.limitar_eventos();

alter table public.eventos enable row level security;

create policy "Solo los admin leen los eventos" on public.eventos
  for select to authenticated
  using ((select privado.es_admin()));

-- Se insertan solo desde el servidor (service_role); por la API, nadie.
revoke all on public.eventos from anon, authenticated;
grant select on public.eventos to authenticated;
grant all on public.eventos to service_role;
grant usage, select on sequence public.eventos_id_seq to service_role;

-- ── Alta y cambios de cuenta (triggers sobre auth.users) ─────────────
-- Al registrarse: crea el perfil con lo que mandó el formulario
-- (options.data de signUp) y anota el evento. Si falta algo obligatorio,
-- el registro entero falla: la base es la última barrera.
create function privado.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  visita uuid;
begin
  if coalesce(datos ->> 'acepta_privacidad', '') <> 'true' then
    raise exception 'Hay que aceptar la política de privacidad.' using errcode = '23514';
  end if;

  insert into public.perfiles (
    id, email, nombre, apellido, nicho_id, nicho_otro, objetivo_id,
    empresa, ciudad, telefono, acepta_novedades, origen, email_confirmado_en, rol
  ) values (
    new.id,
    new.email,
    btrim(datos ->> 'nombre'),
    nullif(btrim(datos ->> 'apellido'), ''),
    datos ->> 'nicho',
    nullif(btrim(datos ->> 'nicho_otro'), ''),
    datos ->> 'objetivo',
    nullif(btrim(datos ->> 'empresa'), ''),
    nullif(btrim(datos ->> 'ciudad'), ''),
    nullif(btrim(datos ->> 'telefono'), ''),
    coalesce(datos ->> 'acepta_novedades', '') = 'true',
    left(nullif(btrim(datos ->> 'origen'), ''), 200),
    new.email_confirmed_at,
    privado.rol_que_corresponde('usuario', new.email, new.email_confirmed_at)
  );

  begin
    visita := (datos ->> 'visita_id')::uuid;
  exception when others then
    visita := null;
  end;

  insert into public.eventos (tipo, nicho_id, pagina, visita_id, perfil_id)
  values ('registro_completo', datos ->> 'nicho', '/registro', visita, new.id);

  if new.email_confirmed_at is not null then
    insert into public.eventos (tipo, nicho_id, pagina, perfil_id)
    values ('email_confirmado', datos ->> 'nicho', '/registro', new.id);
  end if;

  return new;
end;
$$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function privado.crear_perfil();

-- Cuando confirma el email o lo cambia: copia el dato al perfil, revisa si
-- le corresponde ser admin y anota el evento de confirmación.
create function privado.sincronizar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfiles p
     set email = new.email,
         email_confirmado_en = new.email_confirmed_at,
         rol = privado.rol_que_corresponde(p.rol, new.email, new.email_confirmed_at)
   where p.id = new.id;

  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    insert into public.eventos (tipo, nicho_id, pagina, perfil_id)
    select 'email_confirmado', p.nicho_id, '/registro', p.id
    from public.perfiles p
    where p.id = new.id;
  end if;

  return new;
end;
$$;

create trigger al_cambiar_cuenta
  after update of email, email_confirmed_at on auth.users
  for each row
  when (old.email is distinct from new.email
        or old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function privado.sincronizar_perfil();

-- Las funciones de trigger no se llaman por la API.
revoke all on function privado.crear_perfil() from public;
revoke all on function privado.sincronizar_perfil() from public;
revoke all on function privado.proteger_perfil() from public;
revoke all on function privado.limitar_eventos() from public;
revoke all on function privado.marcar_actualizado() from public;
