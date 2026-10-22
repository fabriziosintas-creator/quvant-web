-- "Primeros 100": el beneficio del sistema pasa de 2 meses a 1 mes sin cargo
-- (decisión de fabrizio, 22-oct-2026). La promo todavía no se abrió y no
-- hay lugares dados, así que se renombra el valor del enum y la única
-- función que lo nombra con su texto (el pedido al registrarse).

alter type public.beneficio_promo rename value 'sistema_2_meses' to 'sistema_1_mes';

create or replace function privado.pedir_lugar_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  datos jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  pedido text := datos ->> 'promo_beneficio';
  beneficio public.beneficio_promo;
begin
  if pedido is null or pedido not in ('web_app_50', 'sistema_1_mes') then
    return new;
  end if;
  beneficio := pedido::public.beneficio_promo;
  if not privado.beneficio_permitido(beneficio, datos ->> 'nicho') then
    raise exception 'Ese beneficio no está disponible para tu rubro.' using errcode = '23514';
  end if;

  insert into public.promo_lugares (perfil_id, beneficio, es_prueba)
  values (new.id, beneficio, new.email like '%@prueba.quvant.test')
  on conflict (perfil_id) do nothing;

  if new.email_confirmed_at is not null then
    perform privado.asignar_lugar_promo(new.id);
  end if;
  return new;
end;
$$;
revoke all on function privado.pedir_lugar_al_registrarse() from public;

comment on type public.beneficio_promo is 'Primeros 100: web_app_50 = 50 % en una web o una app; sistema_1_mes = 1 mes sin cargo del sistema (solo rubros con sistema).';
