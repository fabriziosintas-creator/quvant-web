-- La calle sin señal (prompt 5, 21-oct-2026): cada operación que se carga
-- en el teléfono sin conexión lleva una clave única generada ahí. Al volver
-- la señal, si una visita o un local con esa clave ya llegó, no se vuelve a
-- crear (el envío se puede repetir sin duplicar).

alter table public.visitas
  add column clave_cliente text check (clave_cliente ~ '^[0-9a-f-]{36}$');
alter table public.locales
  add column clave_cliente text check (clave_cliente ~ '^[0-9a-f-]{36}$');

create unique index visitas_clave_cliente_idx on public.visitas (clave_cliente) where clave_cliente is not null;
create unique index locales_clave_cliente_idx on public.locales (clave_cliente) where clave_cliente is not null;
