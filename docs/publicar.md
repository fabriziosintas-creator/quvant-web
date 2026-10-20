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
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | el mapa de prospección (solo en /panel) | Production y Preview |
| `GOOGLE_MAPS_SERVER_KEY` | opcional: ubicar locales al importar planillas | Production |
| `CRON_SECRET`, `NUCLEOS_ALERTAS_PARA`, `POSTHOG_*` | Núcleos (ver DECISIONES-MODO-NOCHE.md); sin ellas la sección queda en modo ejemplo | Production |

`PANEL_CLAVE` ya no se usa (el panel entra con la cuenta de admin): se puede borrar.

Hay un script que carga todas las que tengan valor en `.env.local`, sin mostrarlas: pedírselo a Claude (`vercel-env.mjs --aplicar`) o cargarlas a mano.

## 2. Clave de Google Maps

console.cloud.google.com → APIs & Services → Credentials → Create credentials → API key.

- **Restricción de aplicación**: "Websites", con `localhost:3000/*`, `https://www.quvant.com.ar/*`, `https://quvant.com.ar/*` y `https://*.vercel.app/*`.
- **Restricción de API**: Maps JavaScript API, Places API (New) y Geocoding API (las tres hay que habilitarlas en "Enabled APIs").
- **Map ID** (para el estilo oscuro): Google Maps Platform → Map management → Create map ID (JavaScript, Vector) → asociarle un estilo oscuro. Sin Map ID, el mapa igual sale en oscuro (`colorScheme`) con un ID de demo.
- Para importar planillas, una **segunda clave** sin restricción de sitio (es del servidor), restringida solo a Geocoding API → `GOOGLE_MAPS_SERVER_KEY`.
- Costo: cada producto incluye un uso gratis por mes (unas 10.000 cargas de mapa, 10.000 geocodificaciones, 10.000 autocompletados). El mapa solo se carga en `/panel`, así que el uso va a ser bajo. Conviene poner una alerta de presupuesto en Google Cloud igual.

## 3. Supabase

- **URLs de Auth**: hoy `site_url` es `http://localhost:3000` y las plantillas de email usan `{{ .SiteURL }}`, así que los enlaces de confirmación llevan a localhost. Hay que dejar `site_url = https://www.quvant.com.ar` y permitir `http://localhost:3000/**`, `https://www.quvant.com.ar/**`, `https://quvant.com.ar/**` y las vistas previas de Vercel (`https://*-yunque2.vercel.app/**`): `node scripts/supabase-urls.mjs --aplicar` (o en el panel de Supabase: Authentication → URL Configuration).
- **Plantillas de email**: se regeneraron con el tono nuevo (`supabase/plantillas/`), falta subirlas: `npm run emails:supabase -- --subir`.
- **Migración de Núcleos**: `npx supabase db push --linked` aplica `20261021140000_nucleos.sql` (las anteriores ya están). Después, `npx supabase gen types typescript --linked --schema public > src/supabase/tipos.ts`.
- **Datos de prueba**: antes de publicar, `select privado.borrar_datos_de_prueba();` (por `npx supabase db query --linked -f archivo.sql`). Borra las 24 personas, 180 eventos y 7 clientes del script `supabase/pruebas/datos-de-prueba.sql`; se vuelven a cargar con ese archivo si hacen falta.

## 4. Publicar

```
git checkout master
git merge --no-ff registro-y-panel
git push
```

Vercel construye y publica en dos o tres minutos. Después, probar en el celular: registrarse con un email real, confirmar, ver la bienvenida; entrar con una cuenta de admin y recorrer Resumen, Plantillas, Núcleos, Mapa y Bandeja. Si algo falla, en Vercel → Deployments se vuelve a la versión anterior con un clic ("Promote to Production" / "Instant Rollback").
