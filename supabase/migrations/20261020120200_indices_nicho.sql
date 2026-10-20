-- Índices sobre el nicho en eventos y locales (los pidió el revisor de
-- Supabase: claves foráneas sin índice propio).
create index eventos_nicho_idx on public.eventos (nicho_id);
create index locales_nicho_idx on public.locales (nicho_id);
