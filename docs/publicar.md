# Publicar la web con registro, panel y mapa

Qué hay que tener listo antes de que `master` reciba el merge de `registro-y-panel` (cada push a `master` se publica solo en Vercel). Todo se puede hacer desde esta carpeta; nada de esto guarda claves en el repo.

## 1. Variables de entorno en Vercel

Las mismas de `.env.local` (ver `.env.example` para qué es cada una). Con la CLI, desde `quvant-web`:

```
npx vercel login            # una vez
npx vercel link --yes       # vincula la carpeta con el proyecto yunque2/quvant-web
echo VALOR | npx vercel env add NOMBRE production
echo VALOR | npx vercel env add NOMBRE preview
```

O a mano: vercel.com → proyecto → Settings → Environment Variables. Las que hacen falta hoy:

| Variable | Para qué | Entornos |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | registro, ingreso, cuenta | Production y Preview |
| `SUPABASE_SECRET_KEY` | medición de la web, bienvenida, chat | Production y Preview |
| `RESEND_API_KEY`, `AVISO_REGISTROS_PARA` | emails de bienvenida y aviso interno | Production |
| `ANTHROPIC_API_KEY` | el chat y el análisis de Núcleos (ya está cargada) | Production |
| `NOMINATIM_CONTACTO` | opcional: un email para presentarnos ante el buscador de direcciones del mapa | Production y Preview |
| `CRON_SECRET`, `NUCLEOS_ALERTAS_PARA`, `POSTHOG_*` | Núcleos (ver DECISIONES-MODO-NOCHE.md); sin ellas la sección queda en modo ejemplo | Production |

`PANEL_CLAVE` ya no se usa (el panel entra con la cuenta de admin): se puede borrar. Tampoco las de Google Maps (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, `GOOGLE_MAPS_SERVER_KEY`): si alguna está cargada en Vercel, se puede borrar.

Hay un script que carga todas las que tengan valor en `.env.local`, sin mostrarlas: pedírselo a Claude (`vercel-env.mjs --aplicar`) o cargarlas a mano.

## 2. El mapa de prospección: sin claves

Desde el 22-oct-2026 el mapa no usa Google Maps Platform (decisión del 20-oct: sin clave, facturación ni prepago de Google Cloud). No hay nada que configurar:

- **Mapa**: MapLibre con los mosaicos vectoriales de OpenFreeMap (gratis, sin registro ni clave, sin límite de vistas) y un estilo propio en la paleta (`src/componentes/panel/mapa/estiloMapa.ts`). La atribución "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" aparece sola en el mapa y es obligatoria.
- **Direcciones**: Nominatim (el buscador de OpenStreetMap). Su política: como mucho 1 consulta por segundo, identificarse, nada de autocompletar y guardar los resultados. El panel lo cumple: busca solo al tocar "Buscar", espacia las consultas, se presenta como Quvant (con `NOMINATIM_CONTACTO`, si está) y guarda todo en la tabla `geocodificaciones`.
- **Google**: "Cómo llegar" y "Ver en Google Maps" son links comunes que abren la app; el link que se pega al agregar un local se lee como texto, sin API.
- Si algún día el uso crece mucho, se cambia de proveedor de mosaicos con el mismo estilo (`FUENTE_MOSAICOS`) sin tocar el resto.

## 3. Supabase

- **URLs de Auth**: hoy `site_url` es `http://localhost:3000` y las plantillas de email usan `{{ .SiteURL }}`, así que los enlaces de confirmación llevan a localhost. Hay que dejar `site_url = https://www.quvant.com.ar` y permitir `http://localhost:3000/**`, `https://www.quvant.com.ar/**`, `https://quvant.com.ar/**` y las vistas previas de Vercel (`https://*-yunque2.vercel.app/**`): `node scripts/supabase-urls.mjs --aplicar` (o en el panel de Supabase: Authentication → URL Configuration).
- **Plantillas de email**: se regeneraron con el tono nuevo (`supabase/plantillas/`), falta subirlas: `npm run emails:supabase -- --subir`.
- **Migraciones nuevas**: `npx supabase db push --linked` aplica `20261021140000_nucleos.sql`, `20261022120000_visitas.sql`, `20261022120100_resumen_visitas.sql` y `20261022120200_mapa_sin_google.sql` (las anteriores ya están). Las de visitas suman "Entraron y se registraron" al Resumen del panel; mientras no estén, ese bloque avisa que faltan y el resto de la medición sigue andando. La del mapa conviene aplicarla **antes de publicar el código nuevo del mapa**: sin ella el mapa y la lista se ven, pero agregar locales e importar planillas fallan (piden columnas que todavía no existen). Sin la CLI, se pueden pegar los archivos en orden en el editor SQL del panel de Supabase. Después, `npx supabase gen types typescript --linked --schema public > src/supabase/tipos.ts`.
- **Datos de prueba**: antes de publicar, `select privado.borrar_datos_de_prueba();` (por `npx supabase db query --linked -f archivo.sql`). Borra las 24 personas, 180 eventos y 7 clientes del script `supabase/pruebas/datos-de-prueba.sql`; se vuelven a cargar con ese archivo si hacen falta.

## 4. Publicar

```
git checkout master
git merge --no-ff registro-y-panel
git push
```

Vercel construye y publica en dos o tres minutos. Después, probar en el celular: registrarse con un email real, confirmar, ver la bienvenida; entrar con una cuenta de admin y recorrer Resumen, Plantillas, Núcleos, Mapa y Bandeja. Si algo falla, en Vercel → Deployments se vuelve a la versión anterior con un clic ("Promote to Production" / "Instant Rollback").
