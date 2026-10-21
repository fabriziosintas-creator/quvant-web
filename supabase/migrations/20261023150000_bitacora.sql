-- Bitácora: quién cambió qué (prompt 6, 21-oct-2026).
--
-- Un solo trigger genérico (privado.anotar_bitacora) en cada tabla del
-- panel anota toda alta, cambio y baja, venga de una acción del panel, de
-- la consola o de un script. En los cambios guarda solo los campos que
-- cambiaron, con el antes y el después. Email y teléfono van enmascarados;
-- nada de auth, contraseñas ni tokens.
--
-- El "quién" sale de auth.uid(). Sin usuario (la clave secreta del proceso
-- diario o la consola) se anota como "sistema".
--
-- La bitácora solo se agrega y se lee: nadie la edita ni la borra, ni
-- siquiera los admins (solo service_role, para la retención).
--
-- Retención: 2 años. Alcanza para revisar cualquier ejercicio fiscal
-- cerrado y el anterior, y evita guardar para siempre datos de personas.
-- Para cambiarla, editá el intervalo en privado.limpiar_bitacora() con
-- una migración nueva (create or replace function …).
--
-- metas_cambios sigue como está: el motivo de un cambio de meta es parte
-- del producto; la bitácora lo complementa.

create table public.bitacora (
  id bigint generated always as identity primary key,
  creado_en timestamptz not null default now(),
  -- Sin referencia a perfiles a propósito: si se borra un perfil, su historia queda.
  quien uuid,
  sistema boolean not null default false,
  tabla text not null check (tabla ~ '^[a-z_]{1,60}$'),
  registro_id text check (char_length(registro_id) <= 80),
  accion text not null check (accion in ('alta', 'cambio', 'baja', 'deshacer', 'ingreso', 'exportacion')),
  -- alta: {campo: valor}; cambio/deshacer: {campo: [antes, después]}; baja: {campo: valor} (cómo estaba).
  cambios jsonb,
  -- Exportaciones (qué y con qué filtro, nunca el contenido) y deshacer (qué fila deshace).
  detalle jsonb,
  -- Cómo se llamaba el registro, para leer la línea de tiempo sin buscarlo.
  resumen text check (char_length(resumen) <= 160)
);

create index bitacora_creado_idx on public.bitacora (creado_en desc);
create index bitacora_registro_idx on public.bitacora (tabla, registro_id, creado_en desc);
create index bitacora_quien_idx on public.bitacora (quien, creado_en desc);
create index bitacora_accion_idx on public.bitacora (accion, creado_en desc);

-- ── Enmascarar ────────────────────────────────────────────────────────
-- Email: la primera letra y el dominio (f•••@gmail.com). Teléfono: los
-- últimos 3 dígitos (•••123).
create function privado.enmascarar_campo(campo text, valor jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when valor is null or jsonb_typeof(valor) <> 'string' then valor
    when campo in ('email', 'contacto_email') then to_jsonb(left(valor #>> '{}', 1) || '•••' || coalesce(substring(valor #>> '{}' from '@.*$'), ''))
    when campo in ('telefono', 'whatsapp') then to_jsonb('•••' || right(regexp_replace(valor #>> '{}', '\D', '', 'g'), 3))
    else valor
  end;
$$;
revoke all on function privado.enmascarar_campo(text, jsonb) from public;

-- ── El trigger genérico ───────────────────────────────────────────────
create function privado.anotar_bitacora()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  antes jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  despues jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  fila jsonb := coalesce(despues, antes);
  -- Campos que cambian solos y no dicen nada.
  ignorar text[] := array['actualizado_en', 'creado_en', 'etapa_desde'];
  cambios jsonb := '{}'::jsonb;
  campo text;
  nombre text;
  deshace text := nullif(current_setting('quvant.deshace', true), '');
begin
  if tg_op = 'UPDATE' then
    for campo in select jsonb_object_keys(despues) loop
      if campo <> all (ignorar) and (antes -> campo) is distinct from (despues -> campo) then
        cambios := cambios || jsonb_build_object(campo, jsonb_build_array(privado.enmascarar_campo(campo, antes -> campo), privado.enmascarar_campo(campo, despues -> campo)));
      end if;
    end loop;
    if cambios = '{}'::jsonb then
      return null;
    end if;
  else
    select coalesce(jsonb_object_agg(e.key, privado.enmascarar_campo(e.key, e.value)), '{}'::jsonb) into cambios
      from jsonb_each(fila) e
      where e.key <> all (ignorar) and e.value <> 'null'::jsonb;
  end if;

  nombre := coalesce(fila ->> 'nombre', fila ->> 'negocio', fila ->> 'empresa', fila ->> 'titulo', fila ->> 'concepto');
  if nombre is null and tg_table_name = 'visitas' then
    select l.nombre into nombre from public.locales l where l.id = (fila ->> 'local_id')::uuid;
  elsif nombre is null and fila ? 'meta_id' then
    select m.nombre into nombre from public.metas m where m.id::text = fila ->> 'meta_id';
  elsif nombre is null and fila ? 'cliente_id' and tg_table_name in ('permisos_metricas', 'acompanamientos') then
    select c.nombre into nombre from public.clientes_sistema c where c.id::text = fila ->> 'cliente_id';
  elsif nombre is null and tg_table_name = 'perfiles' then
    nombre := privado.enmascarar_campo('email', fila -> 'email') #>> '{}';
  end if;

  insert into public.bitacora (quien, sistema, tabla, registro_id, accion, cambios, detalle, resumen)
  values (
    auth.uid(),
    auth.uid() is null,
    tg_table_name,
    left(coalesce(fila ->> 'id', fila ->> 'mes'), 80),
    case when deshace is not null and tg_op = 'UPDATE' then 'deshacer' when tg_op = 'INSERT' then 'alta' when tg_op = 'UPDATE' then 'cambio' else 'baja' end,
    cambios,
    case when deshace is not null and tg_op = 'UPDATE' then jsonb_build_object('deshace', deshace::bigint) end,
    left(coalesce(nombre, fila ->> 'mes'), 160)
  );
  return null;
end;
$$;
revoke all on function privado.anotar_bitacora() from public;

-- Las tablas del panel (las que no existan todavía se saltean).
do $$
declare
  t text;
begin
  foreach t in array array['locales', 'visitas', 'clientes_plantilla', 'clientes_sistema', 'cobros_quvant', 'tipo_cambio_mensual', 'metas', 'avances_manuales', 'oportunidades', 'permisos_metricas', 'acompanamientos']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('create trigger %I after insert or update or delete on public.%I for each row execute function privado.anotar_bitacora()', t || '_bitacora', t);
    end if;
  end loop;
end;
$$;

-- En perfiles, solo los cambios de rol (el resto son datos de las personas registradas).
create trigger perfiles_bitacora_rol
  after update of rol on public.perfiles
  for each row when (old.rol is distinct from new.rol)
  execute function privado.anotar_bitacora();

-- ── Deshacer un cambio ────────────────────────────────────────────────
-- Vuelve los campos de un cambio simple a como estaban, solo si siguen
-- como los dejó ese cambio (si alguien los tocó después, no pisa nada).
-- Queda anotado como un cambio nuevo ("deshacer"): nunca se borra historia.
create function public.deshacer_cambio(p_id bigint)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  b public.bitacora;
  actual jsonb;
  valores jsonb := '{}'::jsonb;
  campo text;
  columna_id text;
  asignaciones text;
begin
  if not privado.es_admin() then
    raise exception 'Solo los admin.' using errcode = '42501';
  end if;
  select * into b from public.bitacora where id = p_id;
  if b.id is null then return 'no_existe'; end if;
  if b.accion not in ('cambio', 'deshacer') then return 'no_es_cambio'; end if;
  if b.tabla not in ('locales', 'visitas', 'clientes_plantilla', 'clientes_sistema', 'cobros_quvant', 'tipo_cambio_mensual', 'metas', 'avances_manuales', 'oportunidades', 'acompanamientos') then
    return 'tabla_no_permitida';
  end if;
  columna_id := case when b.tabla = 'tipo_cambio_mensual' then 'mes' else 'id' end;

  execute format('select to_jsonb(t) from public.%I t where t.%I::text = $1', b.tabla, columna_id) into actual using b.registro_id;
  if actual is null then return 'registro_borrado'; end if;

  for campo in select jsonb_object_keys(b.cambios) loop
    if campo in ('email', 'telefono', 'whatsapp', 'contacto_email') then return 'dato_enmascarado'; end if;
    if (actual -> campo) is distinct from (b.cambios -> campo -> 1) then return 'cambio_despues'; end if;
    valores := valores || jsonb_build_object(campo, b.cambios -> campo -> 0);
  end loop;

  select string_agg(format('%I = r.%I', k, k), ', ') into asignaciones from jsonb_object_keys(valores) k;
  perform set_config('quvant.deshace', p_id::text, true);
  execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I, $1) r where t.%I::text = $2', b.tabla, asignaciones, b.tabla, columna_id)
    using valores, b.registro_id;
  perform set_config('quvant.deshace', '', true);
  return 'ok';
end;
$$;
revoke all on function public.deshacer_cambio(bigint) from public, anon;
grant execute on function public.deshacer_cambio(bigint) to authenticated;

-- ── Lo que anota la app: ingresos al panel y exportaciones ────────────
-- Un ingreso por persona cada 8 horas (no una fila por página vista).
create function public.anotar_en_bitacora(p_accion text, p_tabla text, p_detalle jsonb default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not privado.es_admin() then return; end if;
  if p_accion not in ('ingreso', 'exportacion') or p_tabla !~ '^[a-z_]{1,60}$' then return; end if;
  if p_accion = 'ingreso' and exists (select 1 from public.bitacora where quien = auth.uid() and accion = 'ingreso' and creado_en > now() - interval '8 hours') then
    return;
  end if;
  insert into public.bitacora (quien, tabla, accion, detalle)
  values (auth.uid(), p_tabla, p_accion, case when p_detalle is not null and jsonb_typeof(p_detalle) = 'object' and length(p_detalle::text) <= 2000 then p_detalle end);
end;
$$;
revoke all on function public.anotar_en_bitacora(text, text, jsonb) from public, anon;
grant execute on function public.anotar_en_bitacora(text, text, jsonb) to authenticated;

-- ── Retención: 2 años ─────────────────────────────────────────────────
create function privado.limpiar_bitacora()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  borradas integer;
begin
  delete from public.bitacora where creado_en < now() - interval '2 years';
  get diagnostics borradas = row_count;
  return borradas;
end;
$$;
revoke all on function privado.limpiar_bitacora() from public;

-- Para el proceso diario del servidor, por si no hay pg_cron.
create function public.limpiar_bitacora()
returns integer
language sql
security definer
set search_path = ''
as $$ select privado.limpiar_bitacora(); $$;
revoke all on function public.limpiar_bitacora() from public, anon, authenticated;
grant execute on function public.limpiar_bitacora() to service_role;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('bitacora-retencion', '30 4 * * 0', 'select privado.limpiar_bitacora()');
exception when others then
  raise notice 'pg_cron no está disponible: la retención la corre el proceso diario (%).', sqlerrm;
end;
$$;

-- ── Seguridad ─────────────────────────────────────────────────────────
alter table public.bitacora enable row level security;

create policy "Los admin leen la bitácora" on public.bitacora
  for select to authenticated using ((select privado.es_admin()));

revoke all on public.bitacora from anon, authenticated;
grant select on public.bitacora to authenticated;
grant all on public.bitacora to service_role;
