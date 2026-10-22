-- Aviso "Copia del sitio" (22-oct-2026): la guardia de dominio
-- (componentes/estructura/guardiaDominio.ts) avisa cuando el sitio se abre
-- desde otro dominio o desde una copia guardada (/api/copia).

alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos add constraint avisos_tipo_check check (tipo in (
  'registro', 'visita_interesante', 'chat', 'objetivo_en_riesgo', 'objetivo_cumplido', 'alerta_roja', 'oportunidad_estancada', 'visita_repetida', 'copia_detectada'
));
