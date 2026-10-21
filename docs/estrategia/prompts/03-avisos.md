# Prompt 3 · Avisos dentro del panel (la campanita)

Pedido de fabrizio (fue lo primero que pidió, el 20-oct-2026: "una barra de notificaciones"). Hoy solo avisa el chat, por WhatsApp. Faltan los avisos del panel: registros nuevos, visitas a la web que se fueron sin escribir después de mirar mucho, objetivos que pasan a "en riesgo" y alertas rojas.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.** Conviene después de los prompts 1 y 2. Si alguna fuente todavía no existe, ese tipo de aviso queda apagado, sin errores.

## 1. Qué avisa (lista cerrada, cada tipo se puede apagar)

| Tipo | Cuándo | Prioridad |
|---|---|---|
| Registro nuevo | Alguien crea su cuenta (con nicho y objetivo) | Alta |
| Visita interesante que se fue | Un navegador (no del equipo) miró 3 o más rubros, o pasó más de 90 s en la sección de un nicho, y no se registró ni escribió en 30 minutos. Sale de `eventos` (`tiempo_nicho`, `vista_nicho`), **sin datos personales**: "alguien miró Industria 2 minutos y se fue" | Media |
| Mensaje en el chat | Conversación nueva esperando respuesta | Alta |
| Objetivo en riesgo | Un objetivo pasa de "en camino" a "en riesgo" o "atrasado" (comparando con la foto del día anterior de `metas_fotos`) | Media |
| Objetivo cumplido | Pasa a "cumplido" | Baja (festejo sobrio) |
| Alerta roja de un socio | Alerta nueva de Núcleos con gravedad roja (solo clientes reales) | Alta |
| Oportunidad estancada | Más días que el umbral en una etapa (prompt 1) | Media |

## 2. Datos

- **`avisos`**: tipo, título y texto cortos, enlace interno, prioridad, a quién (un admin o los dos), creado, leído (por admin), `es_prueba`. Con RLS: cada admin ve los suyos y los de los dos.
- Los avisos se crean **en la base o en el servidor, donde ocurre el hecho**: un trigger al crear un perfil, las acciones del chat, el proceso diario para objetivos y Núcleos. Las visitas interesantes salen de una función que corre cada pocos minutos: revisá en la documentación actual qué conviene, `pg_cron` en Supabase o el cron de Vercel (el plan Hobby solo corre una vez por día), y explicá la elección.
- Sin duplicados: un mismo hecho, un solo aviso (clave única por tipo y referencia).

## 3. En pantalla

- **La campanita en el encabezado del panel** (`componentes/panel/EncabezadoPanel.tsx`), con un contador de no leídos. Al tocarla se abre un panel lateral con los avisos agrupados por "Hoy", "Ayer" y "Antes", cada uno con su ícono, su punto de color (`COLOR_ESTADO`, siempre con ícono y palabra) y su enlace. "Marcar todo como leído".
- **En vivo:** con Supabase Realtime (suscripción a `avisos` del admin; revisá la documentación actual de Realtime con RLS), un aviso nuevo aparece sin recargar. Un toast discreto abajo, que se va solo en 5 s. El contador sube con una animación corta.
- **Preferencias por admin:** qué tipos quiere ver y cuáles también por WhatsApp. Para WhatsApp reusá el canal de avisos que ya existe en `src/servidor/chat/whatsapp.ts` (CallMeBot o la API de Meta, lo que esté configurado). Nada de mensajes masivos, y por defecto solo los de prioridad alta.
- **Notificaciones del navegador** (Web Push, si la documentación actual de Next lo permite sin servicios de terceros): opcional y apagado por defecto. Si suma complejidad o un tercero, dejalo anotado y no lo hagas.

## 4. Orden de trabajo

1. Paso 0 e inventario.
2. Migración (avisos, preferencias, triggers) con datos de prueba.
3. Lógica pura de las reglas (sobre todo "visita interesante" y el cambio de estado de un objetivo), con pruebas.
4. Generadores en el servidor y el proceso periódico.
5. La campanita, el panel lateral y el tiempo real.
6. Preferencias y WhatsApp.
7. Pulido y publicación.
