# Prompt 1 · Seguimiento comercial: del registro al cliente

Pedido de fabrizio (21-oct-2026). Es la pieza central: hoy alguien se registra, llega el mail y ahí se corta. No hay dónde anotar "lo llamé", "le mostré la demo", "le mandé el presupuesto". Los prompts 2 (Hoy) y 3 (Avisos) se apoyan en este: hacelo primero.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md`.**

## 1. Qué hay hoy (leelo en el código antes de empezar)

- **Registros de la web:** `perfiles` (rol usuario), con nicho, objetivo, empresa, ciudad, teléfono, origen y fecha de confirmación del email. El aviso interno por email al confirmar está en `src/emails/` (`AVISO_REGISTROS_PARA`).
- **La calle:** `locales` y `visitas` del mapa de prospección (`/panel/mapa`), con estado (por visitar, visitado, interesado, cliente, descartado).
- **El chat de la web:** las conversaciones de la bandeja (`/panel/mensajes`, `src/servidor/chat/*`). Ahí hay personas que dejaron sus datos sin registrarse.
- **Clientes:** `clientes_plantilla` (demo mostrada, en prueba, activo, baja; abono, alta y baja) y `clientes_sistema` (Núcleos).
- **Objetivos** (`src/objetivos/catalogo.ts`): `demos`, `propuestas` y `tiempo_primer_contacto` están marcadas "sin fuente todavía" y se cargan a mano. Este prompt les da fuente.
- **Dentro del nicho** (`/panel/nichos/[nicho]`): el embudo de la calle termina en "interesados", porque no hay etapas de demo ni de propuesta.

## 2. Qué construir

### 2.1 Datos (migración)

- **`oportunidades`**: una por negocio en seguimiento.
  - Origen: `registro`, `local`, `chat` o `manual`, con su referencia (`perfil_id`, `local_id`, `conversacion_id`).
  - Nombre del negocio, persona de contacto, teléfono, email, nicho y ciudad.
  - Etapa: `nuevo`, `contactado`, `demo_agendada`, `demo_hecha`, `propuesta`, `negociacion`, `ganado` o `perdido`.
  - Valor estimado: abono mensual y/o proyecto, en pesos.
  - Probabilidad: por defecto la de la etapa, editable.
  - Responsable (fabrizio o Michel; por defecto fabrizio, que vende).
  - Próximo paso y su fecha, motivo de pérdida (lista cerrada: precio, ya tiene sistema, no es el momento, no responde, otro + texto), `cliente_plantilla_id` al ganar, fechas, `es_prueba`.
- **`oportunidades_actividad`**: el historial. Cada cambio de etapa, llamada, mensaje, reunión, demo, propuesta enviada o nota, con quién, cuándo y un resultado corto. Se agrega, nunca se edita ni se borra (como `metas_cambios`).
- **Altas automáticas** (triggers o en las acciones que ya existen, lo más simple y confiable; explicá por qué elegiste eso):
  - persona que se registra → oportunidad `nuevo` (origen registro), sin duplicar si ya existe por email o teléfono;
  - local que pasa a "interesado" → oportunidad (origen local), si no tiene;
  - conversación del chat que deja teléfono o email → oportunidad (origen chat).
- **Cliente ganado:** al pasar a `ganado`, se crea (o se enlaza) el `clientes_plantilla` en estado activo, con abono y alta. El local, si lo hay, pasa a cliente.

### 2.2 Pantallas (`/panel/comercial`)

- **Tablero por etapas** (kanban): columnas que se deslizan de costado en el celular. Se arrastra entre columnas con mouse y con dedo (dnd-kit o lo que la documentación actual recomiende para React 19; que sea accesible con teclado). En el celular hay además un botón "Mover a…" en cada tarjeta. Cada tarjeta muestra: negocio, nicho (con su punto de color), valor, días en la etapa (en ámbar si pasa el umbral de la etapa) y próximo paso con su fecha. El cambio de etapa se anima con layout de Motion.
- **Lista** con filtros (etapa, nicho, responsable, origen, "sin próximo paso", "vencidas") y orden. Exporta a CSV con el mismo formato que las otras exportaciones del panel.
- **Ficha de la oportunidad** (panel lateral):
  - datos, historial de actividad y cambio de etapa con motivo;
  - botones "Llamar", "WhatsApp" (link `wa.me` con un mensaje armado desde `src/datos/contacto.ts`: solo un link, sin integración) y "Email";
  - "Cargar actividad" en menos de 10 segundos;
  - enlaces al perfil, al local del mapa o a la conversación de origen.
- **Embudo comercial:** cantidad y valor por etapa, tasa entre etapas con intervalo de Wilson (`src/nichos/estadistica.ts`, ya existe), tiempo promedio en cada etapa, motivos de pérdida y valor ponderado del pipeline (valor × probabilidad).
- Entradas desde el resto del panel: "Crear oportunidad" en la ficha de un local del mapa, en una conversación de la bandeja y en la lista de registrados del Resumen.

### 2.3 Que todo lo demás se alimente solo

- En `src/objetivos/catalogo.ts`, `demos`, `propuestas` y `tiempo_primer_contacto` pasan a automáticas, leídas de `oportunidades_actividad` (horas hábiles desde la creación hasta la primera actividad de contacto). Sumá `oportunidades_ganadas` y `valor_pipeline`. Cada una con sus pruebas, como el resto del catálogo.
- El embudo al revés de Objetivos (`src/objetivos/embudo.ts`) usa las tasas reales de demo → cliente cuando haya 20 casos o más.
- Dentro del nicho: el embudo de la calle suma demo, propuesta y ganado, y se agrega "pipeline del nicho" en el Pulso.
- Las acciones que cambian oportunidades llaman `updateTag("nichos")`, como el resto.

## 3. Orden de trabajo

1. Paso 0 e inventario.
2. Migración con RLS, altas automáticas y los datos de prueba borrables.
3. Lógica pura (`src/comercial/`): etapas, probabilidades, días en etapa, ponderado y tiempos, con pruebas.
4. Tablero, lista y ficha.
5. Embudo comercial.
6. Métricas de Objetivos y conexión con Dentro del nicho.
7. Pulido (375 px y 1280 px, teclado en el kanban) y publicación.
