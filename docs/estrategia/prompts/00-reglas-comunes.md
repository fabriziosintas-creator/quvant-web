# Reglas comunes para los prompts del panel de Quvant

Todo prompt de esta carpeta empieza pidiendo leer este archivo. Lo que está acá vale para todos.

## Quiénes somos

- **Quvant** es la empresa de software de **fabrizio** (comercial: vende, sale a la calle, cierra) y **Michel** (desarrollo). Vende un sistema de gestión con plantillas por nicho (abono mensual), apps a medida y webs (proyectos).
- Hablale a fabrizio en español rioplatense, con voseo. Todos los textos de pantalla van en `src/datos/textos.ts` (sección `PANEL_ADMIN`), nunca sueltos en los componentes.
- Si investigás, usá WebSearch (nunca WebFetch).

## Cómo trabajar

- **De corrido, sin frenar a pedir autorización en cada paso.** Un commit por paso, con mensaje en castellano que diga qué cambió y por qué, y al terminar cada paso una línea de resumen. Frená solo ante algo que no puedas hacer vos o ante una contradicción en los datos.
- **Paso 0, siempre:** `git fetch`, mirá `master..origin/master` (otras sesiones trabajan en paralelo) y leé el código que vas a tocar antes de escribir. **Lo que ya existe se extiende; no se rehace ni se duplica.**
- **No confíes en tu memoria.** Next.js 16 (App Router, Cache Components prendido, `proxy.ts` en vez de middleware), React 19, Supabase, Motion, React Three Fiber y MapLibre 6 cambian seguido. Para Next, leé `node_modules/next/dist/docs/` antes de usar una API.
- En PowerShell: `npx.cmd` y `npm.cmd`.
- En esta computadora git no tiene nombre cargado: los commits van con `git -c user.name="Fabrizio" -c user.email="fabriziosintas@gmail.com" commit …`.
- **Publicar = subir a `master`** (Vercel publica solo). Subilo cuando los tipos, el lint y las pruebas estén limpios y el código tolere que la migración todavía no esté aplicada (que avise en pantalla en vez de romperse).

## La base (Supabase)

- Migraciones en `supabase/migrations/`, una por cambio, con RLS en cada tabla nueva (`privado.es_admin()` para lo del panel) y funciones con `security invoker`. Un valor nuevo de un enum va en su propio archivo: no se puede usar en la misma transacción que lo crea.
- **Claude Code no puede aplicar migraciones en producción** (el sistema de permisos lo bloquea). Dejalas escritas, hacé el `--dry-run` y pasale a fabrizio estas dos líneas, de a una:
  ```powershell
  "CLAUDECODE","AI_AGENT","CLAUDE_CODE_IS_COWORK","CLAUDE_CODE_ENTRYPOINT" | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
  npx.cmd supabase db push --linked
  ```
  La primera hace falta porque la CLI de Supabase detecta a Claude Code y deja de preguntar. Cuando él avise, verificá con `--dry-run` ("Remote database is up to date") y regenerá los tipos: `npx supabase gen types typescript --linked --schema public > src/supabase/tipos.ts` (desde Bash, con `env -u CLAUDECODE -u AI_AGENT`).
- Datos de prueba: siempre `es_prueba = true`, ocultos en el panel y borrables con una función `privado.borrar_*_de_prueba()`. Nunca inventes datos en producción.

## Reglas duras

- El sistema se llama Quvant: nunca otro nombre ni cambios de nombre. ARCA, Mercado Pago, WhatsApp (como integración del sistema) y la sincronización están emulados: nunca se presentan como integraciones reales.
- **Nunca se usan las ventas en plata de los clientes de Quvant.** Lo de Núcleos es uso del sistema (cantidades), nunca montos.
- Todo el panel es solo para admin: RLS en la base y `exigirAdmin` / `adminDelPedido` en cada página, acción y ruta (`src/servidor/panel/acceso.ts`).
- La medición de la web: identificador anónimo propio (`src/componentes/medicion`), sin cookies de terceros, respetando Do Not Track y Global Privacy Control, nunca a los navegadores del equipo (`navegadores_equipo`). Ningún servicio de terceros nuevo (analítica, monitoreo, píxeles) sin que fabrizio lo apruebe.
- Las claves solo en el servidor; nunca en el repo.

## La marca en el panel

- Tokens de `src/app/globals.css` (negro `#0D0D0F`, blanco, acero, profundo), Michroma para títulos y números grandes, IBM Plex para el resto.
- El color entra con sistema (`src/datos/colores.ts`): un acento por nicho (`ACENTO_NICHO`), por sección (`ACENTO_CANAL`), los tres de la portada (`AURORA`) y los de estado (`COLOR_ESTADO`, siempre con ícono y palabra, nunca color solo). Nada de colores nuevos sin preguntar.
- Piezas que ya existen y se reutilizan: `Indicador` y `Barras` (`componentes/panel/Graficos.tsx`, con la tarjeta viva que se inclina), `Bloque`, `TituloPanel`, `Numero` y `Vista` (`panel/nucleos/comunes.tsx`), `ChipEstado`, `Anillo` y `Curvita` (`panel/objetivos/Piezas.tsx`), los campos de `componentes/cuenta/Campos.tsx` y `estilos.ts`, y el mapa (`panel/mapa/estiloMapa.ts` + `cargarMapLibre()` de `panel/mapa/maplibre.ts`, que carga el worker de MapLibre: sin eso el mapa no dibuja).
- Movimiento con Motion y siempre quieto con `prefers-reduced-motion`. Lo 3D, siempre con una vista en lista al lado.

## Calidad, antes de dar algo por terminado

- `npm.cmd test`, `npx.cmd tsc --noEmit` (si falla por tipos de rutas viejos: `npx next typegen`) y `npm.cmd run lint`, sin errores. La lógica pura va en `src/<tema>/` con pruebas `*.test.ts` (`node --import tsx --test`).
- `npm run build` falla en esta PC en las páginas de Núcleos porque falta `.env.local`: en Vercel compila. No lo tomes como error tuyo.
- **Mirá cada pantalla de verdad.** El panel necesita sesión y base, así que hacé una página temporal (`src/app/prueba-*-tmp/`) con datos inventados y sacá capturas con Playwright (`video/node_modules`, Chromium en `%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe`) a 375 px y 1280 px. Revisá que el ancho de la página sea 375 en el celular (`document.documentElement.scrollWidth`). Si el servidor de desarrollo de fabrizio (puerto 3000) sirve módulos viejos, usá una copia en el scratchpad con `node_modules` enlazado y `turbopack.root` amplio en su `next.config.ts`. Borrá la página temporal antes del commit.
- Al final, un resumen corto para fabrizio: qué quedó, qué es automático y qué manual, qué falta (migraciones, claves, decisiones suyas) y cómo probarlo.
