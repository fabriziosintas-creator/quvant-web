-- Datos de prueba para la sección Objetivos: cobros, clientes por plantilla
-- con alta y baja, un objetivo manual y sus avances. Todo con es_prueba =
-- true: el panel los oculta y privado.borrar_objetivos_de_prueba() los borra
-- enteros. Nunca son datos reales.
--
-- Cargar:  npx.cmd supabase db query --linked -f supabase/pruebas/datos-objetivos-de-prueba.sql
-- Borrar:  npx.cmd supabase db query --linked "select privado.borrar_objetivos_de_prueba();"

create or replace function privado.borrar_objetivos_de_prueba()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.avances_manuales where es_prueba;
  delete from public.metas where es_prueba;
  delete from public.cobros_quvant where es_prueba;
  delete from public.clientes_plantilla where es_prueba and empresa like '% (prueba)';
end;
$$;
revoke all on function privado.borrar_objetivos_de_prueba() from public, anon, authenticated;

select privado.borrar_objetivos_de_prueba();

-- Clientes: dos activos, uno que entró y salió en el mes, uno en demo.
insert into public.clientes_plantilla (empresa, nicho_id, estado, abono_mensual, fecha, fecha_alta, fecha_baja, es_prueba) values
  ('Ferretería Norte (prueba)', 'industria', 'activo', 150000, current_date - 40, current_date - 40, null, true),
  ('Distribuidora Sur (prueba)', 'industria', 'activo', 230000, current_date - 10, current_date - 10, null, true),
  ('Gimnasio Atlas (prueba)', 'gimnasios', 'baja', 80000, current_date - 20, current_date - 20, current_date - 5, true),
  ('Corralón Oeste (prueba)', 'industria', 'demo_mostrada', null, current_date - 3, null, null, true);

-- Cobros del mes.
insert into public.cobros_quvant (fecha, cliente, nicho_id, tipo, monto_ars, cobrado, es_prueba) values
  (current_date - 12, 'Ferretería Norte (prueba)', 'industria', 'abono_mensual', 150000, true, true),
  (current_date - 9, 'Distribuidora Sur (prueba)', 'industria', 'implementacion', 300000, true, true),
  (current_date - 6, 'Estudio Pérez (prueba)', null, 'web', 1200000, true, true),
  (current_date - 2, 'Distribuidora Sur (prueba)', 'industria', 'abono_mensual', 230000, false, true);

-- Un objetivo manual del mes con dos avances.
with nueva as (
  insert into public.metas (nombre, metrica, area, etapa, tipo_periodo, desde, hasta, meta_valor, meta_original, unidad, acumulacion, responsable, es_prueba)
  values ('Publicaciones en Instagram (prueba)', 'manual', 'comercial', 'libre', 'mes',
          date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
          12, 12, 'numero', 'suma_del_periodo', 'fabrizio', true)
  returning id
)
insert into public.avances_manuales (meta_id, fecha, valor, es_prueba)
select id, current_date - 5, 3, true from nueva
union all
select id, current_date - 1, 2, true from nueva;
