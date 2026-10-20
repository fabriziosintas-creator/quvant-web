-- Cuándo se mandó el email de bienvenida: la web lo marca antes de
-- mandarlo, así sale una sola vez aunque el enlace de confirmación se abra
-- dos veces. Lo escribe solo el servidor (clave secreta): la persona no
-- tiene permiso sobre esta columna (los permisos por columna de perfiles
-- no la incluyen).
alter table public.perfiles add column bienvenida_enviada_en timestamptz;
