-- Clientes del sistema DE PRUEBA para la sección Núcleos (todos es_prueba).
-- Solo tiene sentido después de aplicar 20261021140000_nucleos.sql y con
-- PostHog conectado (si no, el panel usa sus datos de ejemplo). Los
-- organizacion_id tienen que coincidir con organizaciones de demo del
-- sistema marcadas prueba: true en sus eventos.
--
-- Cargar: npx.cmd supabase db query --linked -f supabase/pruebas/datos-nucleos-de-prueba.sql
-- Borrar: npx.cmd supabase db query --linked "select privado.borrar_nucleos_de_prueba()"

create or replace function privado.borrar_nucleos_de_prueba()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.acompanamientos where es_prueba;
  delete from public.alertas where es_prueba;
  delete from public.indicadores_diarios where cliente_id in (select id from public.clientes_sistema where es_prueba);
  delete from public.analisis_claude where cliente_id in (select id from public.clientes_sistema where es_prueba);
  delete from public.clientes_sistema where es_prueba;
end;
$$;
revoke all on function privado.borrar_nucleos_de_prueba() from public, anon, authenticated;

select privado.borrar_nucleos_de_prueba();

insert into public.clientes_sistema (organizacion_id, nombre, nucleo_id, alta, plan, sucursales_contratadas, usuarios_contratados, responsable, modulos_activos, es_prueba) values
  ('demo-ferremix',   'Ferremix (demo)',        'industria', current_date - 150, 'negocio',      1, 4, 'fabrizio', '{}', true),
  ('demo-corralon',   'Corralón demo',          'industria', current_date - 90,  'multinegocio', 3, 8, 'michel',   '{}', true),
  ('demo-gimnasio',   'Gimnasio demo',          'gimnasios', current_date - 60,  'negocio',      1, 3, 'fabrizio', '{}', true),
  ('demo-nuevo',      'Cliente nuevo (demo)',   'industria', current_date - 10,  'negocio',      1, 2, 'michel',   '{}', true);

select organizacion_id, nombre, nucleo_id, es_prueba from public.clientes_sistema where es_prueba order by nombre;
