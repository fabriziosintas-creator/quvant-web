-- Visitas a la web: un evento nuevo para contar cuántas personas entran
-- (y así saber qué parte se registra). Va solo en su archivo: un valor
-- nuevo de un enum no se puede usar en la misma transacción que lo crea,
-- y el resumen (20261022120100) lo usa.
alter type public.tipo_evento add value if not exists 'visita';
