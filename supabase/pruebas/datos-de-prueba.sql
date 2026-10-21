-- Datos de prueba para ver el panel con algo adentro. Todo queda marcado
-- como prueba y se borra entero con el bloque del final. NUNCA en
-- producción con gente real: son nombres y cifras inventadas para probar.
--
-- Cargar:  npx.cmd supabase db query --linked -f supabase/pruebas/datos-de-prueba.sql
-- Borrar:  npx.cmd supabase db query --linked "select privado.borrar_datos_de_prueba()"

create or replace function privado.borrar_datos_de_prueba()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.promo_lugares where es_prueba;
  delete from public.clientes_plantilla where es_prueba;
  delete from public.visitas where es_prueba;
  delete from public.locales where es_prueba;
  delete from public.eventos where pagina like '/prueba%';
  delete from public.eventos where perfil_id in (select id from auth.users where email like '%@prueba.quvant.test');
  delete from auth.users where email like '%@prueba.quvant.test';
end;
$$;
revoke all on function privado.borrar_datos_de_prueba() from public, anon, authenticated;

-- Por si quedó algo de una corrida anterior.
select privado.borrar_datos_de_prueba();

-- Personas registradas (perfil creado por el trigger), repartidas en 20 días.
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
select
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  format('persona%s@prueba.quvant.test', i),
  case when i % 4 = 0 then null else now() - (i || ' days')::interval end,
  jsonb_build_object(
    'nombre', (array['Ana','Bruno','Carla','Diego','Elena','Facundo','Gabriela','Hernán','Inés','Julián'])[1 + i % 10],
    'apellido', 'De prueba',
    'nicho', (array['industria','gimnasios','gimnasios','holistica','pymes','industria','inmobiliarias','supermercados','gimnasios','otro'])[1 + i % 10],
    'nicho_otro', case when i % 10 = 9 then 'Veterinaria' else '' end,
    'objetivo', (array['mejorar_clientela','hacer_web','curiosidad'])[1 + i % 3],
    'ciudad', (array['CABA','Rosario','Córdoba','La Plata'])[1 + i % 4],
    'empresa', case when i % 2 = 0 then 'Empresa ' || i else '' end,
    'acepta_novedades', (i % 3 <> 0),
    'acepta_privacidad', true,
    'origen', 'plataformas-rubros'
  ),
  '{}'::jsonb,
  now() - (i || ' days')::interval, now()
from generate_series(1, 24) as i;
-- La fecha de alta del perfil también retrocede (el trigger la pone en now()).
update public.perfiles p set creado_en = u.created_at
from auth.users u where u.id = p.id and u.email like '%@prueba.quvant.test';

-- Vistas y clics por rubro en los últimos 30 días (distintas visitas, páginas /prueba).
insert into public.eventos (tipo, nicho_id, pagina, visita_id, creado_en)
select
  (array['vista_nicho','vista_nicho','vista_nicho','clic_demo','clic_contacto','inicio_registro'])[1 + (i % 6)]::public.tipo_evento,
  (array['industria','gimnasios','gimnasios','gimnasios','holistica','pymes','industria','inmobiliarias','supermercados'])[1 + (i % 9)],
  '/prueba/plataformas',
  gen_random_uuid(),
  now() - ((i % 30) || ' days')::interval - ((i % 7) || ' hours')::interval
from generate_series(1, 180) as i;

-- Clientes por plantilla (cifras inventadas).
insert into public.clientes_plantilla (empresa, nicho_id, estado, abono_mensual, fecha, notas, es_prueba) values
  ('Ferretería de prueba', 'industria', 'activo', 120000, current_date - 20, 'Datos de prueba', true),
  ('Metalúrgica de prueba', 'industria', 'en_prueba', null, current_date - 5, 'Datos de prueba', true),
  ('Gimnasio Norte (prueba)', 'gimnasios', 'activo', 60000, current_date - 12, 'Datos de prueba', true),
  ('Box Sur (prueba)', 'gimnasios', 'activo', 45000, current_date - 8, 'Datos de prueba', true),
  ('Estudio Centro (prueba)', 'gimnasios', 'demo_mostrada', null, current_date - 2, 'Datos de prueba', true),
  ('Centro holístico (prueba)', 'holistica', 'baja', null, current_date - 30, 'Datos de prueba', true),
  ('Inmobiliaria de prueba', 'inmobiliarias', 'demo_mostrada', null, current_date - 1, 'Datos de prueba', true);

select
  (select count(*) from auth.users where email like '%@prueba.quvant.test') as personas,
  (select count(*) from public.eventos where pagina like '/prueba%') as eventos,
  (select count(*) from public.clientes_plantilla where es_prueba) as clientes;
