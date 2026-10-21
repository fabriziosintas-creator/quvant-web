-- "Dentro del nicho" (1 de 2): lo que se mide nuevo y el permiso de los socios.
--
-- Va en su propio archivo: los valores nuevos del enum no se pueden usar en
-- la misma transacción que los crea (las funciones de 20261022140100 sí).

-- Seguimiento nuevo de la web pública, con las mismas reglas de siempre
-- (sin cookies de terceros, sin datos personales, respetando DNT/GPC):
--  · tiempo_nicho: cuánto estuvo a la vista la sección de un nicho, en tramos;
--  · profundidad_nicho: hasta dónde bajó dentro de esa sección (25/50/75/100);
--  · origen: de dónde vino la visita (buscador, red, campaña o directo).
alter type public.tipo_evento add value if not exists 'tiempo_nicho';
alter type public.tipo_evento add value if not exists 'profundidad_nicho';
alter type public.tipo_evento add value if not exists 'origen';

-- El valor de esos eventos: un tramo, un porcentaje o un origen. Corto y
-- de una lista cerrada (la valida la API): nunca texto libre ni datos personales.
alter table public.eventos
  add column detalle text check (detalle ~ '^[a-z0-9_\-]{1,40}$');

-- "Los que más venden" se mide por cantidad de operaciones de venta (uso,
-- nunca montos) y solo de los socios que aceptaron compartir métricas.
-- Arranca en falso para todos: se prende a mano cuando el socio acepta.
alter table public.clientes_sistema
  add column comparte_metricas boolean not null default false;
