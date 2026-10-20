# Base de datos (Supabase)

Proyecto `quvant-web` (ref `uwwblklzzrajzdloubgn`). Todo lo de la base está acá:

- `migrations/`: el esquema, en orden. Nunca editar una que ya se aplicó: para cambiar algo, una migración nueva.
- `scripts/administradores.sql`: cómo dar o sacar el rol admin (la lista de emails vive en la base, no en el repo, que es público).
- `pruebas/seguridad.sql`: 33 pruebas de las reglas de seguridad con dos personas de prueba. Se deshacen solas: no dejan nada.

## Antes de usar la herramienta (una vez por computadora)

En `.env.local`, `SUPABASE_ACCESS_TOKEN=` con una clave de supabase.com/dashboard/account/tokens. En PowerShell, desde `quvant-web`, cargarla en la terminal:

```powershell
$env:SUPABASE_ACCESS_TOKEN = ((Select-String -Path .env.local -Pattern '^SUPABASE_ACCESS_TOKEN=(.*)$').Matches[0].Groups[1].Value).Trim()
npx.cmd supabase link --project-ref uwwblklzzrajzdloubgn
```

## Aplicar migraciones

Opción A, con la herramienta (recomendada: lleva la cuenta de cuáles ya se aplicaron):

```powershell
npx.cmd supabase db push --linked --dry-run   # muestra qué aplicaría
npx.cmd supabase db push --linked             # las aplica
npx.cmd supabase gen types typescript --linked --schema public   # tipos para src/supabase/tipos.ts
```

Opción B, a mano: Supabase → SQL Editor → pegar el contenido de cada archivo de `migrations/` en orden → Run. Ojo: así la herramienta no se entera, y después hay que marcarlas con `npx.cmd supabase migration repair --status applied <número>`.

## Probar la seguridad

```powershell
npx.cmd supabase db query --linked -f supabase/pruebas/seguridad.sql
npx.cmd supabase db advisors --linked --type all
```

Cada fila de la prueba tiene que decir OK. El revisor (`advisors`) no tiene que mostrar nada de seguridad; los avisos "Unused Index" son normales mientras la base tenga pocos datos.

## Cómo funciona la seguridad

- Cada tabla tiene RLS. Una persona lee y edita solo su perfil; no puede cambiar su rol, su email ni sus fechas (permisos por columna + el trigger `privado.proteger_perfil`).
- El perfil lo crea el trigger del registro con lo que manda el formulario; si falta el nicho, el objetivo o la aceptación de la privacidad, el registro falla.
- Admin = email en `privado.emails_admin` + email confirmado. Ni la clave secreta del servidor puede dar el rol: solo SQL directo.
- Eventos: solo los inserta el servidor; como mucho 60 por visita cada 10 minutos, y una vista por nicho cada 30 minutos.
- Locales, visitas y clientes por plantilla: solo admin.
