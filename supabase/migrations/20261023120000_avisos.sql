-- Avisos dentro del panel (prompt 3): la campanita.
--
-- Un aviso por hecho (clave única: sin duplicados), para un admin o para
-- los dos; lo leído se guarda por admin. Se crean donde ocurre el hecho:
-- triggers (registro nuevo, alerta roja), una función periódica (visitas
-- interesantes que se fueron) y el servidor (chat, objetivos, oportunidades
-- estancadas). Llegan en vivo con Supabase Realtime (con RLS).

create table public.avisos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('registro', 'visita_interesante', 'chat', 'objetivo_en_riesgo', 'objetivo_cumplido', 'alerta_roja', 'oportunidad_estancada')),
  titulo text not null check (char_length(titulo) between 1 and 160),
  texto text check (char_length(texto) <= 400),
  enlace text check (enlace ~ '^/panel(/|$|\?)'),
  prioridad text not null default 'media' check (prioridad in ('alta', 'media', 'baja')),
  -- null: para los dos socios.
  para_perfil uuid references public.perfiles (id) on delete cascade,
  clave text not null unique check (char_length(clave) <= 200),
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);
create index avisos_creado_idx on public.avisos (creado_en desc);
create index avisos_para_idx on public.avisos (para_perfil) where para_perfil is not null;

create table public.avisos_leidos (
  aviso_id bigint not null references public.avisos (id) on delete cascade,
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  leido_en timestamptz not null default now(),
  primary key (aviso_id, perfil_id)
);
create index avisos_leidos_perfil_idx on public.avisos_leidos (perfil_id);

-- Qué quiere ver cada admin y cuáles también por WhatsApp (por defecto, solo los de prioridad alta).
create table public.avisos_preferencias (
  perfil_id uuid primary key references public.perfiles (id) on delete cascade,
  apagados text[] not null default '{}',
  por_whatsapp text[] not null default '{registro,chat,alerta_roja}',
  actualizado_en timestamptz not null default now()
);

alter table public.avisos enable row level security;
alter table public.avisos_leidos enable row level security;
alter table public.avisos_preferencias enable row level security;

create policy "Los admin ven sus avisos y los de los dos" on public.avisos
  for select to authenticated using ((select privado.es_admin()) and (para_perfil is null or para_perfil = (select auth.uid())));
create policy "Los admin crean avisos" on public.avisos
  for insert to authenticated with check ((select privado.es_admin()));
create policy "Cada admin, lo que leyó" on public.avisos_leidos
  for all to authenticated using ((select privado.es_admin()) and perfil_id = (select auth.uid())) with check ((select privado.es_admin()) and perfil_id = (select auth.uid()));
create policy "Cada admin, sus preferencias" on public.avisos_preferencias
  for all to authenticated using ((select privado.es_admin()) and perfil_id = (select auth.uid())) with check ((select privado.es_admin()) and perfil_id = (select auth.uid()));

revoke all on public.avisos, public.avisos_leidos, public.avisos_preferencias from anon, authenticated;
grant select, insert on public.avisos to authenticated;
grant select, insert, update, delete on public.avisos_leidos, public.avisos_preferencias to authenticated;
grant all on public.avisos, public.avisos_leidos, public.avisos_preferencias to service_role;
grant usage, select on sequence public.avisos_id_seq to authenticated, service_role;

-- En vivo: los cambios de la tabla viajan por Supabase Realtime (respetando RLS).
do $$
begin
  alter publication supabase_realtime add table public.avisos;
exception when others then
  raise notice 'No se pudo sumar avisos a Realtime: %', sqlerrm;
end;
$$;

-- ── Avisos que crea la base ──────────────────────────────────────────
create function privado.avisar(tipo text, titulo text, texto text, enlace text, prioridad text, clave text, es_prueba boolean default false)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.avisos (tipo, titulo, texto, enlace, prioridad, clave, es_prueba)
  values (tipo, left(titulo, 160), left(texto, 400), enlace, prioridad, clave, es_prueba)
  on conflict (clave) do nothing;
$$;
revoke all on function privado.avisar(text, text, text, text, text, text, boolean) from public;

-- Registro nuevo (no admin).
create function privado.aviso_registro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rol = 'usuario' then
    perform privado.avisar(
      'registro',
      'Se registró ' || new.nombre || coalesce(' (' || nullif(new.empresa, '') || ')', ''),
      coalesce((select n.nombre from public.nichos n where n.id = new.nicho_id), new.nicho_id) || ' · ' || coalesce((select o.texto from public.objetivos o where o.id = new.objetivo_id), new.objetivo_id),
      '/panel/comercial',
      'alta',
      'registro:' || new.id,
      new.email like '%@prueba.quvant.test'
    );
  end if;
  return new;
end;
$$;
revoke all on function privado.aviso_registro() from public;
create trigger perfiles_aviso
  after insert on public.perfiles
  for each row execute function privado.aviso_registro();

-- Alerta roja de Núcleos (solo clientes reales).
create function privado.aviso_alerta_roja()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente record;
begin
  if new.gravedad <> 'roja' or new.es_prueba then
    return new;
  end if;
  select c.nombre, c.nucleo_id, c.es_prueba into cliente from public.clientes_sistema c where c.id = new.cliente_id;
  if cliente is null or cliente.es_prueba then
    return new;
  end if;
  perform privado.avisar('alerta_roja', 'Alerta roja: ' || cliente.nombre, replace(new.tipo, '_', ' '), '/panel/nucleos/' || cliente.nucleo_id || '/' || new.cliente_id, 'alta', 'alerta:' || new.id);
  return new;
end;
$$;
revoke all on function privado.aviso_alerta_roja() from public;
create trigger alertas_aviso
  after insert on public.alertas
  for each row execute function privado.aviso_alerta_roja();

-- Visitas interesantes que se fueron: un navegador (no del equipo) que en
-- las últimas 6 horas miró 3 rubros o más, o pasó más de 90 s en uno, sin
-- registrarse ni tocar "Hablemos", y sin actividad hace 30 minutos. Sin
-- datos personales: solo qué miró.
create function privado.detectar_visitas_interesantes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  creados integer := 0;
begin
  for v in
    with recientes as (
      select e.* from public.eventos e
      where e.creado_en > now() - interval '6 hours' and e.visita_id is not null
        and not exists (select 1 from public.navegadores_equipo q where q.visita_id = e.visita_id)
    ),
    por_visita as (
      select visita_id,
             max(creado_en) as ultima,
             count(distinct nicho_id) filter (where tipo = 'vista_nicho') as rubros,
             bool_or(tipo = 'tiempo_nicho' and detalle = 'mas_90') as largo,
             bool_or(tipo in ('clic_contacto', 'inicio_registro', 'registro_completo')) as convirtio,
             (array_agg(nicho_id order by creado_en desc) filter (where nicho_id is not null))[1] as ultimo_nicho
      from recientes
      group by visita_id
    )
    select * from por_visita
    where (rubros >= 3 or largo) and not convirtio and ultima < now() - interval '30 minutes'
  loop
    begin
      insert into public.avisos (tipo, titulo, texto, enlace, prioridad, clave)
      values (
        'visita_interesante',
        case when v.largo then 'Alguien miró ' || coalesce((select n.nombre from public.nichos n where n.id = v.ultimo_nicho), 'un rubro') || ' más de 90 segundos y se fue'
             else 'Alguien miró ' || v.rubros || ' rubros y se fue sin escribir' end,
        'No se registró ni tocó «Hablemos». Puede valer un llamado a la acción más claro en ese rubro.',
        coalesce('/panel/nichos/' || v.ultimo_nicho, '/panel/resumen'),
        'media',
        'visita:' || v.visita_id || ':' || to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD')
      );
      creados := creados + 1;
    exception when unique_violation then
      null;
    end;
  end loop;
  return creados;
end;
$$;
revoke all on function privado.detectar_visitas_interesantes() from public;

-- Cada 10 minutos, con pg_cron si está disponible (si no, lo corre el
-- proceso diario y queda dicho en el panel).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('avisos-visitas-interesantes', '*/10 * * * *', 'select privado.detectar_visitas_interesantes()');
exception when others then
  raise notice 'pg_cron no está disponible: las visitas interesantes se revisan en el proceso diario (%).', sqlerrm;
end;
$$;

-- Para el proceso diario del servidor (con la clave secreta), por si no hay pg_cron.
create function public.revisar_visitas_interesantes()
returns integer
language sql
security definer
set search_path = ''
as $$
  select privado.detectar_visitas_interesantes();
$$;
revoke all on function public.revisar_visitas_interesantes() from public, anon, authenticated;
grant execute on function public.revisar_visitas_interesantes() to service_role;
