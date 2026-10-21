# Prompt 2 · "Hoy": la portada del panel que dice qué hacer

Pedido de fabrizio (21-oct-2026). El Resumen muestra números, pero no dice qué hacer. Falta lo que se abre a la mañana, desde el celular: qué hay que hacer hoy, en orden.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.** Rinde mucho más con el prompt 1 (Seguimiento comercial) hecho. Si todavía no existe, armá las tarjetas que dependen de él solo si la tabla está, y si no, ocultalas (sin errores).

## 1. Qué es

Una pantalla nueva, **`/panel/hoy`**, que pasa a ser la portada del panel: `/panel` lleva ahí y el Resumen sigue en su pestaña. Es una lista corta de **tarjetas de acción**, ordenadas por urgencia. Cada una dice qué pasa, por qué importa y tiene un botón que lo resuelve ahí mismo o lleva al lugar exacto.

## 2. Las tarjetas (cada una es una regla con datos, nunca inventada)

| Tarjeta | Regla | Acción |
|---|---|---|
| Registros sin contactar | Oportunidades `nuevo` con más de 24 horas hábiles sin actividad | "Llamar" / "WhatsApp" / "Cargar actividad" |
| Próximos pasos vencidos o de hoy | Oportunidades con fecha de próximo paso ≤ hoy | Ir a la ficha |
| Visitas de hoy | Locales con `proxima_visita` = hoy, y prospectos calientes cerca | "Armar recorrido" (reusá `recorridoCercano` y `linkRecorrido` de `src/nichos/estadistica.ts`) |
| Objetivos en riesgo o atrasados | Estado de `src/objetivos/estado.ts` | Ir al objetivo, con lo que falta ("te faltan 12 visitas en 9 días hábiles") |
| Socios en rojo o con alerta nueva | Núcleos (solo si hay clientes reales; con datos de ejemplo, ocultá la tarjeta) | Ir al cliente en Núcleos |
| Mensajes del chat sin responder | Conversaciones de la bandeja esperando respuesta | Ir a la conversación |
| Cobros pendientes del mes | `cobros_quvant` con `cobrado = false` y abonos del mes sin cargar | Ir a Facturación |
| Falta el tipo de cambio | Mes sin `tipo_cambio_mensual` | Cargarlo ahí mismo |

- Arriba de las tarjetas, una línea con el estado del día: "Buen día, fabrizio. 3 cosas urgentes, 2 para hoy, 4 objetivos en camino." El nombre sale de la sesión, porque los dos socios usan el panel.
- Cada tarjeta se puede posponer hasta mañana. Se guarda por admin, en una tabla chica `hoy_pospuestas`, sin tocar los datos de origen.
- Si no hay nada urgente, una tarjeta de festejo sobria: el punto cuadrado de la marca late una vez, nada de confeti.
- Debajo, en chico, los 4 números del día: registros, visitas a la web, visitas a locales y cobrado del mes, con tendencia contra ayer.

## 3. Cómo se arma

- Lógica pura en `src/hoy/` (las reglas, la urgencia y el orden) con pruebas por regla. Los datos los lee el servidor una sola vez, en paralelo, reusando lo que ya existe: `cargarDatos` de Objetivos, `cargarPanorama` de Núcleos y los datos del mapa y la bandeja.
- Cacheá con `"use cache"` y `cacheTag("hoy")` (como `servidor/nichos/datos.ts`), y sumá `updateTag("hoy")` a las acciones que cambian algo de esto.
- **Pensada para el celular primero:** tarjetas grandes y botones de 44 px o más. Al resolver una tarjeta, sale con una animación corta y la lista se reacomoda (layout de Motion).

## 4. Orden de trabajo

1. Paso 0 e inventario.
2. Reglas puras con pruebas.
3. Datos del servidor y caché.
4. Pantalla y redirección de `/panel`.
5. Posponer, con su tabla y su migración.
6. Pulido (375 px primero) y publicación.
