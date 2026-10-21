-- "Hoy" (prompt 2): las tarjetas que un admin pospuso hasta mañana. Una
-- fila por admin y tarjeta; no toca los datos de origen. Cada admin ve y
-- maneja solo las suyas.
create table public.hoy_pospuestas (
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  clave text not null check (clave ~ '^[a-z0-9_:\-]{1,120}$'),
  hasta date not null,
  creado_en timestamptz not null default now(),
  primary key (perfil_id, clave)
);

alter table public.hoy_pospuestas enable row level security;

create policy "Cada admin, sus tarjetas pospuestas" on public.hoy_pospuestas
  for all to authenticated
  using ((select privado.es_admin()) and perfil_id = (select auth.uid()))
  with check ((select privado.es_admin()) and perfil_id = (select auth.uid()));

revoke all on public.hoy_pospuestas from anon, authenticated;
grant select, insert, update, delete on public.hoy_pospuestas to authenticated;
grant all on public.hoy_pospuestas to service_role;
