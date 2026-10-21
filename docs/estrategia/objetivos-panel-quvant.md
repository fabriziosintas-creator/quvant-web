# Prompt: sección "Objetivos" del panel de Quvant

Creado el 20 de octubre de 2026 a pedido de fabrizio: "ahora prompt para el panel de administración nuestra: poner dentro de la página de administración nuestros propios objetivos para ver cuáles cumplimos y cuáles no, como objetivos de facturación, objetivos de visitas a la página, objetivos de registros y otros que consideres […] armarnos un plan teniendo en cuenta que somos una desarrolladora nueva y que nos permita escalar".

**No es un panel nuevo.** Es una sección más del panel `/panel` que arman `web-quvant-login-y-panel.md` (Resumen, Rendimiento de plantillas, Mapa de prospección), `panel-nucleos-y-clientes-quvant.md` (Núcleos) y `super-admin-quvant-web.md` (acceso de admins, paleta, Pulso, Análisis). El plan con las metas iniciales está en `quvant/estrategia/plan-objetivos-crecimiento.md`.

Se pega en Claude Code, en VS Code, **en el repo de fabrizio donde viven la web y el sistema**. Funciona aunque los prompts anteriores estén a medio aplicar: el paso 0 mira qué hay y construye encima.

---

## Antes de pegar esto (para fabrizio, no para Claude Code)

1. **Copiá el plan al repo**: `quvant/estrategia/plan-objetivos-crecimiento.md` a la carpeta `_marca/` (o `_datos/`) del repo. Claude Code lo lee para cargar las metas iniciales.
2. **Revisá los precios de trabajo** de la sección 2 del plan. Si ya tienen precios reales, cambialos ahí antes de pegar: las metas de MRR salen de esos precios.
3. No hacen falta claves nuevas. Usa Supabase, y PostHog y Claude si ya están conectados.

---

## 1. Tu rol y el contexto

Sos el mismo equipo de los prompts anteriores del panel: desarrollador full-stack senior (Next.js, Supabase), diseñador de dashboards y motion design, e ingeniero de datos. Hablale a fabrizio y escribí todos los textos en español rioplatense, con voseo. Si investigás, usá WebSearch (nunca WebFetch).

**Quvant** es la empresa de software de fabrizio (desarrollo) y Michel (ventas). Vende un sistema de gestión con plantillas por nicho (abono mensual), apps a medida y webs (proyectos). Es una desarrolladora nueva. Quieren cargar **sus propios objetivos** en el panel y ver, de un vistazo, **cuáles cumplen y cuáles no**: facturación, visitas a la web, registros, demos, clientes ganados, visitas a locales, MRR por nicho y otros.

**Reglas que siguen vigentes:** el sistema se llama Quvant (nunca uses otro nombre ni hables de cambios de nombre). ARCA, Mercado Pago, WhatsApp y la sincronización están emulados: no se miden como integraciones reales. **Nunca se usan datos de ventas de los clientes** (lo que venden ellos en el sistema): la facturación de Quvant se carga a mano. Nunca inventes cifras en producción.

**No confíes en tu memoria.** Next.js, Supabase, Motion, PostHog y la API de Claude cambian seguido. Antes de cada paso revisá la documentación actual y usá las versiones estables de hoy. En PowerShell usá `npx.cmd` y `npm.cmd`.

---

## 2. Paso 0 · Mirar el estado real del repo (antes de escribir una línea)

1. `git status`, `git fetch --all`, `git branch -a` y `git log --oneline -15`. Si hay cambios sin guardar, **no los toques**: contale qué hay y preguntale qué hacer.
2. Buscá las ramas de los prompts anteriores (`panel-super-admin`, `panel-nucleos-noche` u otras) y `DECISIONES-MODO-NOCHE.md`. Si existe, leelo: esas decisiones se respetan.
3. Ubicá la app de la web y el panel. **No toques el sistema de gestión.**
4. Inventario corto, y mostráselo a fabrizio:
   - secciones de `/panel` que existen y cómo se navega entre ellas;
   - si existe `es_admin()` / `admins_permitidos` (super admin) o todavía el rol `admin` en `perfiles`;
   - tablas que este prompt va a leer, y cuáles faltan: `perfiles`, `eventos`, `leads_seguimiento`, `clientes_plantilla`, `clientes_sistema`, `locales`, `visitas`, `indicadores_diarios`, `alertas`, `metricas_diarias`, `bitacora`, `analisis_quvant`;
   - **cómo se miden hoy las visitas a la web**: tabla propia `eventos`, PostHog en la web, Vercel Web Analytics, o nada;
   - si ya existe la herramienta **"Metas del mes"** del prompt de super admin (anillo de progreso en Pulso);
   - tokens `--panel-*`, Motion, librería de gráficos y selector de período de Pulso.
5. Decí **desde qué rama vas a partir** (la más avanzada que tenga el panel; si hay dos candidatas, preguntá) y creá `panel-objetivos` desde esa. Un commit por paso, mensajes en castellano. **No hagas push ni deploy** sin que te lo confirme.

Regla para todo el prompt: **si algo ya existe, se extiende; no se rehace ni se duplica.** Si "Metas del mes" ya existe, se convierte en el resumen de esta sección (sección 7.4) y sus datos se migran, no quedan dos lugares para lo mismo. Si falta una sección de la que depende una métrica, la métrica queda como "sin fuente todavía" y se puede cargar a mano; no armes esa sección acá.

---

## 3. Decisiones tomadas (fabrizio las puede cambiar)

- **Objetivos editables por los dos socios**: cualquier admin (`es_admin()`, o el rol `admin` si super admin todavía no está) crea, edita, archiva y cierra objetivos. Nadie más los ve.
- **Valor real automático cuando hay datos, manual cuando no.** La facturación siempre es manual.
- **Cada objetivo mide una métrica de un catálogo cerrado** (sección 5). No hay fórmulas escritas a mano en la interfaz: si quieren una métrica nueva, se agrega al catálogo en código.
- **Las metas no se "mueven" sin dejar rastro**: cada cambio de meta guarda el valor anterior, quién y por qué. La pantalla muestra la meta original tachada al lado de la ajustada.
- **Pesos y dólares**: los montos se cargan en pesos. Un tipo de cambio mensual cargado a mano permite ver todo también en dólares, porque con inflación una meta en pesos se cumple sola. Sin APIs externas de cotización.
- **Plan inicial precargado**: un botón carga las metas de `plan-objetivos-crecimiento.md` (etapas de 90 días, 6 meses y 12 meses). Son metas, no datos inventados, así que van a producción; los valores reales empiezan en cero.

---

## 4. Datos (migraciones en `supabase/migrations/`, RLS: solo admins)

- **`objetivos`**: id, nombre ("Clientes de sistema pagando"), descripción corta, `metrica` (clave del catálogo), filtros (jsonb validado: nicho, responsable, tipo de servicio, según lo que acepte la métrica), `etapa` (`90_dias`, `6_meses`, `12_meses`, `libre`), `tipo_periodo` (`semana`, `mes`, `trimestre`, `etapa`, `rango`), `desde`, `hasta`, `meta_valor`, `meta_original`, `unidad` (`numero`, `ars`, `usd`, `porcentaje`, `horas`), `direccion` (`mas_es_mejor` o `menos_es_mejor`, por ejemplo para churn o tiempo de respuesta), `acumulacion` (`suma_del_periodo` para registros o visitas; `valor_al_cierre` para MRR o clientes activos; `promedio` para tasas), responsable (fabrizio, Michel o los dos), `se_repite` (sí/no: un objetivo mensual que se recrea solo el mes siguiente con la misma meta, editable), orden, archivado, creado por, fechas.
- **`objetivos_cambios`**: objetivo, campo, valor anterior, valor nuevo, motivo (obligatorio), quién, cuándo.
- **`objetivos_cierres`**: al terminar el período, una foto inmutable: objetivo, período, meta, valor real, resultado (`cumplido`, `no_cumplido`), porcentaje, fecha de cierre. Es el historial de qué se cumplió; no se recalcula después.
- **`objetivos_fotos`**: foto diaria del avance de cada objetivo abierto (fecha, valor real, porcentaje, estado), para dibujar la curva real contra la ideal. Si existe `metricas_diarias`, usá esa tabla con `metrica = 'objetivo:<id>'` en lugar de crear otra.
- **`cobros_quvant`** (facturación, carga manual): fecha de cobro, cliente (texto, o enlace opcional a `clientes_plantilla`/`clientes_sistema`), nicho, tipo (`abono_mensual`, `implementacion`, `web`, `app_a_medida`, `otro`), monto en pesos, IVA incluido sí/no, número de factura (opcional), cobrado sí/no, nota, quién lo cargó. Solo lo que **Quvant** cobra, nunca lo que venden sus clientes.
- **`tipo_cambio_mensual`**: mes, pesos por dólar, fuente (texto), quién lo cargó.
- **`avances_manuales`**: para métricas sin fuente automática (por ejemplo, publicaciones en Instagram): objetivo, fecha, valor, nota, quién.
- Si `clientes_plantilla` o `clientes_sistema` no tienen **abono mensual, fecha de alta y fecha de baja**, agregá esas columnas (son la base del MRR, los clientes ganados y el churn).

---

## 5. Catálogo de métricas (un solo archivo, con pruebas)

`src/lib/objetivos/metricas.ts`: cada métrica tiene clave, nombre, unidad, filtros que acepta, fuente, si es automática o manual, y una función de servidor `calcular({ desde, hasta, filtros })` con consultas fijas y parametrizadas. Pruebas unitarias con datos de prueba para cada una, incluidos los bordes (período vacío, cliente que entra y sale en el mismo mes, zona horaria).

| Clave | Qué mide | Fuente |
|---|---|---|
| `facturacion_cobrada` | Suma de cobros del período (filtros: tipo, nicho) | `cobros_quvant` (manual) |
| `facturacion_usd` | Lo mismo en dólares al tipo de cambio del mes | `cobros_quvant` + `tipo_cambio_mensual` |
| `mrr` | Suma de abonos de clientes activos al cierre (filtro: nicho) | `clientes_plantilla` / `clientes_sistema` |
| `peso_recurrente` | % de la facturación que es abono mensual | `cobros_quvant` |
| `clientes_activos` | Clientes de sistema pagando al cierre (filtro: nicho) | clientes |
| `clientes_ganados` | Altas de clientes en el período | clientes |
| `churn_mensual` | Bajas del mes / activos al inicio del mes | clientes |
| `proyectos_vendidos` | Webs o apps a medida cobradas (filtro: tipo) | `cobros_quvant` |
| `visitas_web` | Visitantes únicos de la web pública | ver abajo |
| `registros` | Altas en el período (filtros: nicho, objetivo) | `perfiles` |
| `registros_confirmados` | Altas con email confirmado | `perfiles` |
| `conversion_web` | Registros / visitantes únicos | las dos anteriores |
| `demos` | Leads que pasaron a "demo" en el período | `leads_seguimiento` (o su historial de estados) |
| `propuestas` | Leads que pasaron a "propuesta" | `leads_seguimiento` |
| `tiempo_primer_contacto` | Horas hábiles promedio desde el registro hasta el primer contacto | `leads_seguimiento` |
| `visitas_locales` | Visitas en persona cargadas (filtro: quién fue, nicho) | `visitas` del mapa |
| `locales_nuevos` | Locales cargados en el mapa | `locales` |
| `visitas_con_feedback_bueno` | % de visitas con feedback "bueno" | `visitas` |
| `salud_promedio_nucleos` | Salud promedio de los clientes (filtro: núcleo) | `indicadores_diarios` |
| `clientes_verdes` | % de clientes en verde | `indicadores_diarios` |
| `alertas_resueltas` | % de alertas de Núcleos resueltas en el período | `alertas` |
| `recomendaciones_hechas` | Recomendaciones del Análisis marcadas como hechas | `recomendaciones` |
| `manual` | Cualquier otra cosa (publicaciones en Instagram, casos publicados) | `avances_manuales` |

**Visitas a la web**, en este orden de preferencia (usá la primera que exista y decilo en el inventario):
1. **PostHog**, si la web pública ya lo tiene: consulta HogQL desde el servidor con la clave personal (nunca en el navegador), visitantes únicos por día.
2. La tabla propia **`eventos`** del prompt de login: visitantes únicos por día con el id anónimo. Si no hay un evento de vista de página, agregá `vista_pagina` (uno por visita, no por scroll), con las mismas reglas de privacidad: sin cookies de terceros y respetando Do Not Track y Global Privacy Control.
3. **Vercel Web Analytics**: revisá en la documentación actual si tiene una API para leer los datos. Si no la tiene, no se usa como fuente automática.

No agregues Google Analytics ni otro servicio de terceros sin preguntar.

Ninguna métrica lee montos, productos ni clientes finales del sistema de gestión. Los datos de Núcleos son de **uso**, no de ventas.

---

## 6. Cómo se calcula el estado

Para cada objetivo abierto:

- **Avance** = valor real / meta (con `menos_es_mejor`, invertido: cumplir es quedar por debajo).
- **Ritmo esperado** = parte del período transcurrida (con días hábiles para métricas comerciales, días corridos para la web). Para `suma_del_periodo` se compara el avance contra el ritmo; para `valor_al_cierre` se compara contra una línea recta desde el valor al inicio del período hasta la meta.
- **Estados** (umbrales en un archivo de configuración):
  - **Cumplido**: ya alcanzó la meta (aunque el período siga abierto).
  - **En camino**: avance de 90 % del ritmo o más.
  - **En riesgo**: entre 60 % y 90 % del ritmo.
  - **Atrasado**: menos de 60 % del ritmo.
  - Al cerrar el período: **Cumplido** o **No cumplido**, y se guarda en `objetivos_cierres`.
- **Proyección**: al ritmo actual, en qué valor terminaría el período. Se muestra como línea punteada.
- Zona horaria `America/Argentina/Buenos_Aires`, semanas de lunes a domingo, igual que Pulso.

---

## 7. Pantallas

Todo con la base visual del panel de super admin: tokens `--panel-*`, Michroma para títulos y números grandes, IBM Plex para el resto, Motion. Si la paleta del panel todavía no existe, usá la propuesta de `super-admin-quvant-web.md` (sección 6.1) y frená para que fabrizio la apruebe en `/panel/paleta`.

**Colores de estado** (siempre con ícono y texto además del color, para daltónicos): cumplido verde `#34D399`, en camino cian `#3DD9EB`, en riesgo ámbar `#FFB547`, atrasado y no cumplido rojo `#F8717A`, sin fuente gris acero `#9C9CA3`. Validá contraste contra `#0D0D0F`.

### 7.1 Tablero de objetivos (`/panel/objetivos`)

- Arriba, un **marcador grande**: "Este mes: 7 de 11 objetivos cumplidos o en camino", con el número que cuenta hasta su valor y una barra segmentada por estado.
- Pestañas por **etapa** (90 días · 6 meses · 12 meses · Todos) y el **selector de período de Pulso** reutilizado (mes por defecto).
- Filtros: responsable (fabrizio, Michel, los dos), área (Facturación · Clientes · Web · Comercial · Calle · Núcleos), estado.
- **Una tarjeta por objetivo**: nombre, anillo de progreso que se dibuja al entrar, valor real contra meta ("2 de 3 clientes"), estado, ritmo ("vas 15 % adelantado" o "te faltan 12 visitas en 9 días hábiles"), sparkline de la curva real, responsable, y un ícono que dice si el dato es automático o manual. Si la meta se ajustó, la original aparece tachada.
- Al tocar una tarjeta se abre el detalle (7.2) con la transición de "acercarse" que ya usa el panel.
- **Agrupar por área** o **ver como lista** (tabla ordenable, útil en el celular).

### 7.2 Detalle de un objetivo

- Gráfico grande: **línea ideal** (de cero a la meta), **línea real** que se dibuja al entrar y **proyección** punteada, con tooltip (valor, lo esperado a esa fecha, diferencia).
- Desglose cuando la métrica lo permite: por nicho, por socio, por tipo de servicio.
- Historial de períodos anteriores del mismo objetivo (de `objetivos_cierres`): cumplido o no, porcentaje, y racha ("3 meses seguidos cumplido").
- Historial de cambios de la meta, con motivo.
- Si es manual: botón **"Cargar avance"**. Si es de facturación: **"Cargar cobro"**.
- **"Qué hace falta"** (embudo al revés, sección 7.3) cuando es un objetivo de clientes o de MRR.

### 7.3 Embudo al revés ("¿Qué nos falta para llegar?")

Para los objetivos de clientes, MRR y facturación: a partir de lo que falta, calcula cuántas demos, visitas a locales, registros y visitas web hacen falta, con las **tasas reales** de los últimos 90 días (visita a local → demo, registro → demo, demo → cliente, visita web → registro). Si todavía no hay suficientes datos (menos de 20 casos en un paso), usa las tasas de partida del plan (sección 3 de `plan-objetivos-crecimiento.md`) y lo dice: "tasa del plan, todavía no tenemos datos propios". Se ve como un embudo animado que se ensancha hacia arriba, con un botón para crear objetivos de actividad con esos números.

### 7.4 En Pulso y en el resto del panel

- En **Pulso**, una tarjeta "Objetivos del mes" con el marcador y los tres objetivos más atrasados. Si existía "Metas del mes", esta tarjeta la reemplaza y sus metas pasan a `objetivos`.
- En el **buscador Ctrl+K** (si existe): "Cargar cobro", "Cargar avance", "Nuevo objetivo", "Ver objetivos atrasados".
- Al cerrar un período, un aviso en el panel (sin emails ni mensajes automáticos): "Cerró octubre: 8 de 11 cumplidos". Un toque de festejo sobrio cuando un objetivo se cumple (el punto cuadrado del logo que late una vez), nunca confeti. Con `prefers-reduced-motion`, nada se mueve.

### 7.5 Crear y editar objetivos

- Formulario en un panel lateral: nombre, métrica (del catálogo, con una línea que explica qué mide y de dónde sale el dato), filtros válidos para esa métrica, etapa, período, meta, responsable, si se repite. Validación con el esquema que ya use el proyecto (por ejemplo Zod), en el cliente y en el servidor.
- Al cambiar la meta de un objetivo abierto, pide el motivo y guarda en `objetivos_cambios`.
- **"Cargar plan inicial"**: lee las metas del plan y crea los objetivos de las tres etapas con sus fechas (etapa 1 desde el 1 de noviembre de 2026). Antes de crear, muestra la lista para que fabrizio destilde lo que no quiere. No duplica si ya están cargados.
- Archivar en lugar de borrar.

### 7.6 Facturación (carga manual)

- Pantalla `/panel/objetivos/facturacion`: lista de cobros del mes, totales por tipo y por nicho, MRR del mes, y el tipo de cambio cargado (con aviso si falta el del mes).
- **"Cargar cobro" en menos de 15 segundos desde el celular**: fecha (hoy), cliente (con autocompletado de los clientes cargados), tipo, monto, cobrado sí/no.
- Exportación a CSV para el contador.
- Una línea fija en pantalla: "Solo lo que cobra Quvant. Las ventas de nuestros clientes no se miden."

---

## 8. Procesos

- **Foto diaria** (dentro de la misma tarea nocturna que ya llena `metricas_diarias` o `indicadores_diarios`; si no existe, Vercel Cron o función programada de Supabase, la más simple, y explicá por qué): calcula el avance de cada objetivo abierto y lo guarda.
- **Cierre de período**: el primer día hábil después del fin de cada período, guarda `objetivos_cierres` y, si el objetivo `se_repite`, crea el del período siguiente. Se puede correr a mano con "Cerrar período ahora".
- **Análisis de trayectoria** (si existe la sección Análisis): sumale al resumen que recibe Claude los objetivos del período y sus estados, los cierres anteriores y los cambios de meta, **solo agregados** (sin nombres de clientes, personas ni montos por cliente; la facturación va como total por tipo y nicho). Pedile en la salida una parte "Objetivos": qué se está por no cumplir, por qué según los datos, y una acción por cada uno. No llames a Claude si la sección no existe: dejalo anotado como paso futuro.

---

## 9. Orden de trabajo (un commit por paso; al terminar cada uno, frená, contale a fabrizio qué cambió y cómo probarlo)

0. **Estado del repo e inventario** (sección 2). Frená: rama de partida y fuente de visitas web.
1. **Migraciones** de la sección 4 con RLS de admins. **Escritas pero no aplicadas**: explicale cómo aplicarlas (CLI de Supabase o editor SQL) y **esperá su confirmación** antes de aplicarlas o de probar contra la base.
2. **Catálogo de métricas y cálculo de estado** (secciones 5 y 6), con pruebas unitarias.
3. **Facturación y cargas manuales** (7.6, `avances_manuales`, tipo de cambio).
4. **Tablero y creación de objetivos** (7.1 y 7.5), con "Cargar plan inicial". Frená: fabrizio revisa las metas cargadas.
5. **Detalle y embudo al revés** (7.2 y 7.3).
6. **Procesos e integración** (sección 8 y 7.4): foto diaria, cierre de período, tarjeta en Pulso, Ctrl+K, Análisis.
7. **Pulido**: 375 px y escritorio, teclado, foco y contraste, rendimiento (la sección abre en menos de 2 segundos), textos de error en castellano, `npm.cmd run lint`, `npx.cmd tsc --noEmit`, pruebas y `npm.cmd run build` sin errores. **No hagas el deploy** sin que te lo confirme.

Para probar con datos sin inventar nada en producción: un script de datos de prueba marcado `prueba` (cobros, clientes, visitas), que se borra entero y que el panel oculta por defecto.

---

## 10. Reglas

- Solo los admins ven y editan objetivos y facturación (RLS, no solo la pantalla). Probalo con un usuario común.
- Nunca guardes claves en el código ni en el repo; las secretas solo en el servidor.
- Migraciones escritas en `supabase/migrations/`, aplicadas solo cuando fabrizio lo confirme.
- No rehagas lo que ya existe; extendelo. No toques el sistema de gestión.
- Nunca se miden las ventas de los clientes de Quvant.
- Al final, un resumen corto: qué quedó, qué métricas quedaron automáticas y cuáles manuales (y por qué), qué falta (precios reales, tipo de cambio del mes, fuente de visitas web) y cómo probar cada parte.
