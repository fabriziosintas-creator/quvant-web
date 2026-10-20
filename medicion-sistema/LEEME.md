# Medición de uso del sistema Quvant (Parte A)

Paquete **listo para copiar al repo del sistema de gestión**. No depende de Next.js ni de ninguna app: es TypeScript puro más dos adaptadores (navegador y servidor) para PostHog. El panel de la web (`src/app/panel/nucleos`) importa el catálogo desde acá, así que las dos apps hablan el mismo idioma.

Por qué está acá y no en el sistema: el sistema de gestión vive en otro repo que no estaba disponible la noche del 20 de octubre (ver `DECISIONES-MODO-NOCHE.md`, decisión 0.1). Todo lo que no necesita ver el código del sistema quedó hecho y probado; lo que sí lo necesita (poner `medir(...)` en cada módulo) está anotado en "Pendiente".

## Qué hay

| Archivo | Qué hace |
|---|---|
| `catalogo.ts` | **La fuente de verdad.** Los eventos permitidos (nombre, propiedades y tipos), las funciones clave por plantilla y la versión del catálogo. Lo que no está acá, no sale. |
| `catalogo.json` | El mismo catálogo, generado con `npm run catalogo:json`. Para el panel y para cualquier otra app. No editar a mano. |
| `medir.ts` | `medir(evento, propiedades)`: valida contra el catálogo (tipo y en tiempo de ejecución), respeta "Compartir métricas", descarta propiedades no permitidas, agrega las comunes y nunca rompe la app. |
| `cola.ts` | La cola sin conexión: guarda los eventos con su hora original y los manda al volver internet. |
| `seudonimo.ts` | El id seudónimo del usuario: hash del id interno con una sal secreta. Nunca el email ni el nombre. |
| `posthog-navegador.ts` | Cómo iniciar `posthog-js` con la privacidad que pide la sección 3 (sin autocapture, sin grabación, sin encuestas, localStorage, sin IP) y conectarlo a `medir()`. |
| `posthog-servidor.ts` | Lo mismo con `posthog-node`, para las acciones que se confirman en el servidor, con la hora original. |
| `proxy-next.md` | El proxy propio (mismo dominio) para que los bloqueadores no corten los eventos, con la guía vigente de PostHog para Next.js. |
| `terminos-medicion.ts` | Texto base para los términos del servicio: qué se mide y para qué (Ley 25.326). `TODO: revisar con un abogado`. |
| `pruebas/medir.test.ts` | Pruebas: validación, consentimiento, propiedades prohibidas, cola sin conexión con hora original, organizaciones de prueba. `npm test`. |

## Cómo se instala en el repo del sistema

1. Copiar la carpeta entera (sin `pruebas/` si el repo tiene su propio runner) a `src/medicion/` del sistema.
2. `npm install posthog-js posthog-node`.
3. Variables (ver `.env.ejemplo`): `NEXT_PUBLIC_POSTHOG_KEY` (la *Project API key*, `phc_…`), `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com` o `eu`), `MEDICION_SAL` (secreta, solo servidor).
4. Proxy: seguir `proxy-next.md`.
5. En el arranque de la app del sistema (el layout de las rutas del sistema, nunca en la web pública): `iniciarMedicionNavegador({...contexto de la organización})`.
6. En cada acción confirmada: `medir("venta_confirmada", { sin_conexion, lista_precios })`.
7. En la configuración del dueño, la opción **"Compartir métricas de uso con Quvant"** (prendida por defecto) que alimenta `contexto.compartirMetricas`.

## Reglas de privacidad (sección 3 del brief)

- Solo eventos del catálogo. Solo propiedades del catálogo. Todo lo demás se descarta antes de salir.
- Nunca montos, precios, márgenes, nombres de productos, datos de clientes finales, CUIT, teléfonos, emails ni textos escritos por el usuario. El catálogo no tiene ninguna propiedad de texto libre: los tipos son booleanos, números (contadores) o listas cerradas.
- Usuario seudónimo (`seudonimo.ts`). El rol sí viaja.
- `autocapture`, grabación de sesiones, encuestas y mapas de calor: apagados en `posthog-navegador.ts`.
- Organización con "Compartir métricas" apagado: `medir()` no manda nada y la cola no guarda nada.
- Organizaciones de demo y prueba: `prueba: true` en cada evento, para filtrarlas.
- ARCA, Mercado Pago, WhatsApp y el servidor de sincronización están emulados: **no hay eventos de esas integraciones** en el catálogo.

## Pendiente (necesita el repo del sistema)

- A.4: poner `medir(...)` en el punto donde cada acción se confirma, módulo por módulo (un commit por módulo).
- A.6: recorrer la demo y verificar en PostHog → Activity que llegan los eventos con sus propiedades; probar con "Compartir métricas" apagado y sin conexión.
- Las funciones clave de **gimnasios** están marcadas "a confirmar": se armaron con lo que muestra la app de socios (HackFit) y los ejemplos del brief, no con el código del sistema de gestión.
