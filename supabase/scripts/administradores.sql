-- Administradores del panel (/panel).
--
-- Cómo funciona: la lista vive en privado.emails_admin (fuera de la API:
-- ningún formulario la puede tocar). Quien esté en la lista pasa a admin
-- solo cuando su email queda confirmado, al registrarse o, si ya estaba
-- registrado y confirmado, con el update de abajo.
--
-- Cómo se corre: reemplazar los TODO por los emails reales y pegarlo en
-- Supabase → SQL Editor → Run. O desde la carpeta quvant-web:
--   npx.cmd supabase db query --linked -f supabase/scripts/administradores.sql
-- No subir este archivo con los emails reales: el repositorio es público.

insert into privado.emails_admin (email) values
  (lower(btrim('TODO: email de fabrizio'))),
  (lower(btrim('TODO: email de Michel'))),
  (lower(btrim('TODO: email de la cuenta de Quvant')))
on conflict do nothing;

-- Los que ya estaban registrados y confirmados pasan a admin ahora.
update public.perfiles p
   set rol = 'admin'
  from privado.emails_admin a
 where lower(p.email) = a.email
   and p.email_confirmado_en is not null
   and p.rol <> 'admin';

-- Quiénes están en la lista y cómo quedaron.
select a.email, p.rol, p.email_confirmado_en
from privado.emails_admin a
left join public.perfiles p on lower(p.email) = a.email
order by a.email;

-- Para sacar a alguien (las dos cosas):
--   delete from privado.emails_admin where email = 'su@email.com';
--   update public.perfiles set rol = 'usuario' where lower(email) = 'su@email.com';
