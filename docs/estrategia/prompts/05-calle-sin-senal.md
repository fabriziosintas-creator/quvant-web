# Prompt 5 · La calle sin señal: el panel que funciona offline

Pedido de fabrizio (21-oct-2026). En la calle, cargar una visita en un local sin datos móviles falla, y se pierde lo que se escribió. Hace falta que el mapa de prospección y la carga de visitas anden sin señal y se sincronicen solas cuando vuelve.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.**

## 1. Qué tiene que andar sin señal

- **Abrir `/panel/mapa`** con lo último que se vio: los locales y sus fichas (datos guardados en el navegador) y los mosaicos del mapa de la zona ya recorrida.
- **Cargar una visita**, cambiar el estado o "volver" de un local, y agregar un local con "Estoy acá". Todo se guarda al instante en el teléfono, con el cartel "Guardado en el teléfono: se manda cuando vuelva la señal".
- **Al volver la señal:** se manda solo, en orden, sin duplicar. Una clave única por operación, generada en el teléfono, que el servidor respeta: si ya llegó, no la vuelve a crear. Después, un aviso: "Se mandaron 3 visitas".
- Las fotos o los audios no van en este prompt.

## 2. Cómo

- **App instalable (PWA):** manifiesto con el ícono y los colores de la marca, para "Agregar a la pantalla de inicio". Revisá en la documentación actual de Next 16 cómo se hace el manifiesto (`app/manifest.ts`) y el service worker sin librerías abandonadas. Si conviene una (Serwist o la que hoy recomiende la documentación), verificá antes que esté mantenida.
- **Service worker** con alcance solo `/panel/`: la web pública queda igual.
  - El "esqueleto" de `/panel/mapa` y sus recursos, en caché.
  - Los mosaicos de OpenFreeMap: caché con límite (por ejemplo, 300 MB o 2.000 mosaicos), los más viejos se van primero. Revisá que sus condiciones de uso permitan guardarlos en el navegador.
  - El worker de MapLibre (`/maplibre/maplibre-gl-worker.mjs`), también en caché.
- **Cola en IndexedDB** (la API nativa o `idb`, que es chica): cada operación pendiente con su clave única, tipo, datos, intentos y fecha. Se procesa al volver `navigator.onLine`, al abrir el panel y con Background Sync donde exista. Si el servidor rechaza una operación (por ejemplo, el local fue borrado), queda marcada para que fabrizio la vea y decida, sin perderla.
- **Las acciones del servidor** del mapa (`src/servidor/panel/locales.ts`) aceptan esa clave para no duplicar. Guardala en una columna nueva con índice único (migración).
- **Indicador de conexión** en el encabezado del panel: "Sin señal · 2 pendientes". Discreto y con su palabra.

## 3. Cuidado

- La sesión de Supabase puede vencer mientras no hay señal: al volver, si hace falta, pedí ingresar de nuevo **sin perder la cola**.
- Nada de datos de otros nichos o socios guardados de más: solo lo que el panel ya mostró. Y al cerrar sesión, se borra todo lo guardado en el teléfono.

## 4. Orden de trabajo

1. Paso 0 e inventario.
2. Manifiesto y service worker con caché del mapa.
3. Cola en IndexedDB y operaciones sin conexión (lógica pura con pruebas: orden, reintentos, duplicados).
4. Clave única en el servidor, con su migración.
5. Indicador, avisos y conflictos.
6. Pruebas en modo avión (Playwright con `context.setOffline(true)`) y en un celular de verdad (fabrizio, en la vista previa de Vercel).
7. Publicación.
