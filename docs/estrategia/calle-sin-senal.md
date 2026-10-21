# La calle sin señal: cómo funciona y cómo probarlo

Prompt 5 (21-oct-2026). Para fabrizio, que sale a la calle, y para Michel.

## Qué anda sin señal

- **Abrir `/panel/mapa`** con lo último que se vio. Se guarda la última copia de la página y sus archivos, y también los mosaicos del mapa que ya se vieron en pantalla.
- **Cargar una visita, cambiar el estado de un local o agregar un local.** "Estoy acá" también anda, pero guarda solo las coordenadas: sin señal no hay dirección. Todo queda en el teléfono, con el aviso "Guardado en el teléfono: se manda cuando vuelva la señal".
- **Al volver la señal, todo se manda solo y en orden.** Pasa al volver la conexión, al abrir el panel, cada minuto y con Background Sync en Android. Después aparece un aviso como "Se mandaron 3 visitas".
  - Cada carga lleva una clave única generada en el teléfono. Si ya llegó al servidor, no se crea dos veces.
- **En el encabezado:** "Sin señal · 2 pendientes". En el celular se ve solo el punto y el número; tocándolo, se ve el detalle.
- **Lo que el servidor no acepta** (por ejemplo, un local que borraron mientras no había señal) queda en esa lista con su motivo, para reintentar o descartar. No se pierde.
- **Si la sesión venció,** pide ingresar de nuevo sin borrar lo pendiente.
- **Al cerrar sesión se borra todo lo guardado en el teléfono.** Si quedaban cargas sin mandar, avisa antes.

## Instalarlo en el celular

1. Con señal, abrí `quvant.com.ar/panel/mapa` en Chrome (Android) o Safari (iPhone).
2. Recargá la página una vez. Así quedan guardados el mapa y sus archivos.
3. Instalalo:
   - En Android: menú ⋮ → **Agregar a la pantalla de inicio** (o "Instalar app").
   - En iPhone: botón Compartir → **Agregar a inicio**.
4. Abre directo en el mapa. Antes de salir, recorré con señal la zona donde vas a caminar: quedan guardados los mosaicos que se vieron.

## Cómo probarlo

1. Con el mapa abierto, poné el modo avión.
2. Cargá una visita y fijate que diga "Guardado en el teléfono" y que el encabezado muestre 1 pendiente.
3. Sacá el modo avión. En unos segundos tiene que aparecer "Se mandaron 1 visita", y la visita queda en el historial del local.

La prueba automática (Playwright, en modo avión) ya pasa en la copia de prueba:

- abre la copia guardada;
- muestra "Sin señal";
- guarda la visita en el teléfono con su clave;
- cuenta 1 pendiente;
- sin sesión, avisa y no la pierde.

Falta la prueba en un celular de verdad, contra Supabase, después de aplicar la migración.

## Para tener en cuenta

- **Falta aplicar la migración** `supabase/migrations/20261023140000_clave_cliente.sql`. Hasta entonces todo funciona, pero sin la protección contra duplicados en la base.
- **El service worker vive solo en `/panel/`:** la web pública queda igual y no enlaza el manifiesto.
- **Los mosaicos de OpenFreeMap:**
  - Se guardan solo los que ya se vieron en pantalla. Nunca se descargan zonas por adelantado.
  - Hay un tope de 2.000; los más viejos se van primero.
  - No encontré las condiciones de uso de OpenFreeMap sobre guardar mosaicos en el navegador. Las de OpenStreetMap prohíben la descarga masiva para usar sin conexión, y por eso no hay descarga por adelantado.
  - Si OpenFreeMap llegara a pedirlo, se apaga cambiando una línea de `public/sw-panel.js`.
- **No van en este prompt:** fotos, audios, "Ubicarlo donde estoy" y borrar un local. Esos siguen necesitando señal.
