-- Prueba de las reglas de seguridad de la base con dos personas de prueba
-- (Ana y Beto). Todo corre dentro de un bloque que se deshace al final:
-- no queda ni una fila en la base, ni en la lista de administradores.
--
-- Uso, desde la carpeta quvant-web:
--   npx.cmd supabase db query --linked -f supabase/pruebas/seguridad.sql
-- Cada fila dice qué se probó y si dio OK.

create function pg_temp.probar_seguridad()
returns table (prueba text, resultado text)
language plpgsql
as $$
declare
  ana uuid := gen_random_uuid();
  beto uuid := gen_random_uuid();
  local_beto uuid;
  filas int;
  texto text;
  res text[] := '{}';
  sin_instancia constant uuid := '00000000-0000-0000-0000-000000000000';
begin
  begin
    -- ── Registro ───────────────────────────────────────────────────
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    values
      (ana, sin_instancia, 'authenticated', 'authenticated', 'ana@prueba.invalid',
       '{"nombre":"Ana","nicho":"gimnasios","objetivo":"hacer_web","acepta_privacidad":true,"origen":"gimnasios"}', '{}', now(), now()),
      (beto, sin_instancia, 'authenticated', 'authenticated', 'beto@prueba.invalid',
       '{"nombre":"Beto","nicho":"industria","objetivo":"curiosidad","acepta_privacidad":true,"visita_id":"no-es-un-uuid"}', '{}', now(), now());

    select count(*) into filas from public.perfiles where id in (ana, beto) and rol = 'usuario';
    res := res || format(E'Registrarse crea el perfil, con rol usuario\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    select count(*) into filas from public.eventos where perfil_id in (ana, beto) and tipo = 'registro_completo';
    res := res || format(E'Registrarse anota el evento registro_completo\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    begin
      insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values (gen_random_uuid(), sin_instancia, 'authenticated', 'authenticated', 'sin-privacidad@prueba.invalid',
              '{"nombre":"Ceci","nicho":"pymes","objetivo":"hacer_web"}', now(), now());
      res := res || E'Sin aceptar la privacidad no se registra\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Sin aceptar la privacidad no se registra\tOK (%s)', sqlerrm);
    end;

    begin
      insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values (gen_random_uuid(), sin_instancia, 'authenticated', 'authenticated', 'sin-nicho@prueba.invalid',
              '{"nombre":"Dani","objetivo":"hacer_web","acepta_privacidad":true}', now(), now());
      res := res || E'Sin nicho no se registra\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Sin nicho no se registra\tOK (%s)', sqlerrm);
    end;

    begin
      insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values (gen_random_uuid(), sin_instancia, 'authenticated', 'authenticated', 'otro@prueba.invalid',
              '{"nombre":"Eli","nicho":"otro","objetivo":"curiosidad","acepta_privacidad":true}', now(), now());
      res := res || E'"Otro rubro" sin decir cuál no se registra\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'"Otro rubro" sin decir cuál no se registra\tOK (%s)', sqlerrm);
    end;

    -- ── Ana, persona común ─────────────────────────────────────────
    perform set_config('request.jwt.claims', json_build_object('sub', ana, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    select count(*) into filas from public.perfiles;
    res := res || format(E'Ana ve un solo perfil: el suyo\t%s', case when filas = 1 then 'OK' else 'FALLA: ve ' || filas end);

    select count(*) into filas from public.perfiles where id = beto;
    res := res || format(E'Ana no ve el perfil de Beto\t%s', case when filas = 0 then 'OK' else 'FALLA' end);

    update public.perfiles set ciudad = 'Rosario', acepta_novedades = true where id = ana;
    get diagnostics filas = row_count;
    res := res || format(E'Ana edita su ciudad y las novedades\t%s', case when filas = 1 then 'OK' else 'FALLA' end);

    update public.perfiles set ciudad = 'Hackeado' where id = beto;
    get diagnostics filas = row_count;
    res := res || format(E'Ana no puede editar el perfil de Beto\t%s', case when filas = 0 then 'OK' else 'FALLA: lo editó' end);

    begin
      update public.perfiles set rol = 'admin' where id = ana;
      res := res || E'Ana no puede hacerse admin\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ana no puede hacerse admin\tOK (%s)', sqlerrm);
    end;

    begin
      update public.perfiles set email = 'otra@prueba.invalid' where id = ana;
      res := res || E'Ana no puede cambiar el email de su perfil\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ana no puede cambiar el email de su perfil\tOK (%s)', sqlerrm);
    end;

    begin
      delete from public.perfiles where id = ana;
      res := res || E'Ana no puede borrar perfiles por la API\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ana no puede borrar perfiles por la API\tOK (%s)', sqlerrm);
    end;

    begin
      insert into public.eventos (tipo, nicho_id) values ('clic_demo', 'industria');
      res := res || E'Ana no puede cargar eventos\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ana no puede cargar eventos\tOK (%s)', sqlerrm);
    end;

    select count(*) into filas from public.eventos;
    res := res || format(E'Ana no ve los eventos\t%s', case when filas = 0 then 'OK' else 'FALLA: ve ' || filas end);

    begin
      insert into public.locales (nombre) values ('Local de Ana');
      res := res || E'Ana no puede cargar locales\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ana no puede cargar locales\tOK (%s)', sqlerrm);
    end;

    begin
      select count(*) into filas from privado.emails_admin;
      res := res || E'Ana no puede leer la lista de admins\tFALLA: la leyó';
    exception when others then
      res := res || format(E'Ana no puede leer la lista de admins\tOK (%s)', sqlerrm);
    end;

    -- ── Visita anónima ─────────────────────────────────────────────
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);

    select count(*) into filas from public.nichos where en_registro;
    res := res || format(E'Un anónimo lee los nichos del registro\t%s', case when filas = 7 then 'OK' else 'FALLA: ' || filas end);

    begin
      select count(*) into filas from public.perfiles;
      res := res || format(E'Un anónimo no lee perfiles\t%s', case when filas = 0 then 'OK (0 filas)' else 'FALLA: ve ' || filas end);
    exception when others then
      res := res || format(E'Un anónimo no lee perfiles\tOK (%s)', sqlerrm);
    end;

    -- ── El servidor (clave secreta) ────────────────────────────────
    perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
    perform set_config('role', 'service_role', true);

    begin
      update public.perfiles set rol = 'admin' where id = ana;
      res := res || E'Ni el servidor puede dar el rol admin\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Ni el servidor puede dar el rol admin\tOK (%s)', sqlerrm);
    end;

    for i in 1..70 loop
      insert into public.eventos (tipo, nicho_id, visita_id)
      values ('clic_demo', 'industria', '11111111-1111-1111-1111-111111111111');
    end loop;
    select count(*) into filas from public.eventos where visita_id = '11111111-1111-1111-1111-111111111111';
    res := res || format(E'Límite: 70 eventos de una visita quedan en 60\t%s', case when filas = 60 then 'OK' else 'FALLA: ' || filas end);

    insert into public.eventos (tipo, nicho_id, visita_id) values
      ('vista_nicho', 'gimnasios', '22222222-2222-2222-2222-222222222222'),
      ('vista_nicho', 'gimnasios', '22222222-2222-2222-2222-222222222222'),
      ('vista_nicho', 'holistica', '22222222-2222-2222-2222-222222222222');
    select count(*) into filas from public.eventos where visita_id = '22222222-2222-2222-2222-222222222222';
    res := res || format(E'Ver dos veces el mismo nicho cuenta una\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    -- ── Lista de administradores ───────────────────────────────────
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', '', true);

    insert into privado.emails_admin (email) values ('beto@prueba.invalid');
    select rol::text into texto from public.perfiles where id = beto;
    res := res || format(E'En la lista pero sin confirmar el email: no es admin\t%s', case when texto = 'usuario' then 'OK' else 'FALLA: ' || texto end);

    update auth.users set email_confirmed_at = now() where id in (ana, beto);
    select rol::text into texto from public.perfiles where id = beto;
    res := res || format(E'En la lista y con el email confirmado: es admin\t%s', case when texto = 'admin' then 'OK' else 'FALLA: ' || texto end);

    select rol::text into texto from public.perfiles where id = ana;
    res := res || format(E'Confirmar el email sin estar en la lista: sigue usuario\t%s', case when texto = 'usuario' then 'OK' else 'FALLA: ' || texto end);

    select count(*) into filas from public.perfiles where id in (ana, beto) and email_confirmado_en is not null;
    res := res || format(E'La confirmación pasa al perfil\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    select count(*) into filas from public.eventos where perfil_id in (ana, beto) and tipo = 'email_confirmado';
    res := res || format(E'Confirmar anota el evento email_confirmado\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    -- ── Beto, admin ────────────────────────────────────────────────
    perform set_config('request.jwt.claims', json_build_object('sub', beto, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    select count(*) into filas from public.perfiles where id in (ana, beto);
    res := res || format(E'Beto (admin) ve los perfiles de todos\t%s', case when filas = 2 then 'OK' else 'FALLA: ' || filas end);

    select count(*) into filas from public.eventos where perfil_id in (ana, beto);
    res := res || format(E'Beto (admin) ve los eventos\t%s', case when filas = 4 then 'OK' else 'FALLA: ' || filas end);

    insert into public.locales (nombre, nicho_id, direccion, latitud, longitud, es_prueba)
    values ('Gimnasio de prueba', 'gimnasios', 'Av. Siempreviva 742', -34.6, -58.4, true)
    returning id into local_beto;

    insert into public.visitas (local_id, feedback, volver, nota, es_prueba)
    values (local_beto, 'bueno', 'si', 'Le interesó la plantilla', true);

    select estado::text || '/' || coalesce(volver::text, '-') into texto from public.locales where id = local_beto;
    res := res || format(E'Cargar una visita actualiza el local (visitado/si)\t%s', case when texto = 'visitado/si' then 'OK' else 'FALLA: ' || texto end);

    select cantidad_visitas || '/' || ultimo_feedback into texto from public.locales_resumen where id = local_beto;
    res := res || format(E'La vista cuenta las visitas y el último feedback\t%s', case when texto = '1/bueno' then 'OK' else 'FALLA: ' || coalesce(texto, 'nada') end);

    begin
      insert into public.visitas (local_id, feedback, visitante_id) values (local_beto, 'malo', ana);
      res := res || E'No se puede anotar una visita a nombre de alguien que no es admin\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'No se puede anotar una visita a nombre de alguien que no es admin\tOK (%s)', sqlerrm);
    end;

    -- ── Ana otra vez ───────────────────────────────────────────────
    perform set_config('request.jwt.claims', json_build_object('sub', ana, 'role', 'authenticated')::text, true);

    select count(*) into filas from public.locales_resumen;
    res := res || format(E'Ana no ve los locales del mapa\t%s', case when filas = 0 then 'OK' else 'FALLA: ve ' || filas end);

    select count(*) into filas from public.visitas;
    res := res || format(E'Ana no ve las visitas\t%s', case when filas = 0 then 'OK' else 'FALLA: ve ' || filas end);

    -- ── Primeros 100 (Ana, ya confirmada, reserva desde su cuenta) ───
    texto := public.reservar_lugar_promo('sistema_1_mes')::text;
    res := res || format(E'Ana (gimnasios) reserva el mes gratis del sistema\t%s',
      case when texto like '%reservado%' or texto like '%espera%' then 'OK (' || texto || ')' else 'FALLA: ' || texto end);

    select count(*) into filas from public.promo_lugares;
    res := res || format(E'Ana ve solo su lugar de la promo\t%s', case when filas = 1 then 'OK' else 'FALLA: ve ' || filas end);

    update public.promo_lugares set estado = 'usado';
    get diagnostics filas = row_count;
    res := res || format(E'Ana no puede cambiar el estado de su lugar\t%s', case when filas = 0 then 'OK' else 'FALLA: cambió ' || filas end);

    begin
      insert into public.promo_lugares (perfil_id, beneficio) values (ana, 'web_app_50');
      res := res || E'Nadie inserta lugares de la promo por la API\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Nadie inserta lugares de la promo por la API\tOK (%s)', sqlerrm);
    end;

    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
    texto := public.estado_promo()::text;
    res := res || format(E'La web (anónima) lee solo los números de la promo\t%s',
      case when texto like '%quedan%' and texto not like '%perfil%' then 'OK' else 'FALLA: ' || texto end);
    begin
      select count(*) into filas from public.promo_lugares;
      res := res || E'Un anónimo no lee los lugares de la promo\tFALLA: lo dejó';
    exception when others then
      res := res || format(E'Un anónimo no lee los lugares de la promo\tOK (%s)', sqlerrm);
    end;

    raise exception 'deshacer_pruebas';
  exception when others then
    if sqlerrm <> 'deshacer_pruebas' then
      res := res || format(E'ERROR INESPERADO (la prueba se cortó)\t%s', sqlerrm);
    end if;
  end;

  return query
    select split_part(linea, E'\t', 1), split_part(linea, E'\t', 2)
    from unnest(res) as linea;
end;
$$;

select * from pg_temp.probar_seguridad();
