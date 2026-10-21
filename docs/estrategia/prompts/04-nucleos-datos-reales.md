# Prompt 4 · Núcleos con datos reales y alta de clientes

Pedido de fabrizio (21-oct-2026). Hoy socios, salud, "los que más venden" y la ciudad 3D funcionan en **modo ejemplo**: el sistema de gestión no está conectado. Falta PostHog y falta medir el sistema en su propio repo. Además, no hay una pantalla para dar de alta un cliente real ni para prender su permiso de compartir métricas.

**Antes que nada, leé `docs/estrategia/prompts/00-reglas-comunes.md` y `DECISIONES-MODO-NOCHE.md`** (ahí está todo lo de la medición del sistema y de Núcleos, con sus decisiones).

## 1. Parte A · En este repo (quvant-web): alta de clientes y permisos

- **`/panel/clientes`**: la lista de los clientes reales del sistema (`clientes_sistema` + `clientes_plantilla`), con alta, plan, sucursales, módulos, responsable, abono, estado, salud (si hay datos) y si comparte métricas.
- **"Nuevo cliente"** en un solo formulario, pensado para el día que se cierra la venta:
  - crea o enlaza el `clientes_plantilla` (activo, abono, alta) y el `clientes_sistema` (`organizacion_id` del sistema, nicho, plan, sucursales, usuarios, módulos, responsable);
  - si viene de una oportunidad (prompt 1) o de un local del mapa, los enlaza.

  Al guardar, Núcleos deja el modo ejemplo para ese nicho apenas haya datos.
- **"Compartir métricas"** (`clientes_sistema.comparte_metricas`): un interruptor que solo se prende con una constancia (fecha, quién y cómo aceptó: contrato, email o mensaje), guardada en una tabla `permisos_metricas`. Se puede apagar y queda el historial. Sin constancia, no se prende. Aclarale a fabrizio que conviene que esté en el contrato.
- **"Dar de baja"** con fecha y motivo (lista cerrada), que alimenta el churn de Objetivos y de los nichos.

## 2. Parte B · Conectar PostHog (lectura desde el panel)

- Variables (`.env.example` ya las nombra): `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_PERSONAL_API_KEY`. La clave personal es `phx_…`, solo de lectura y solo de este proyecto. Explicale a fabrizio dónde se crea, paso a paso, en la interfaz actual de PostHog (revisalo con WebSearch).
- Probá `src/servidor/nucleos/posthog.ts` contra el proyecto real y que el proceso diario (`/api/nucleos/actualizar`) guarde fotos reales en `indicadores_diarios`.
- `CRON_SECRET` en Vercel para el proceso diario, y `ANTHROPIC_API_KEY` si quieren el análisis de Claude de verdad (ya existe, con tope diario).

## 3. Parte C · En el repo del sistema de gestión (otro repo)

- **El sistema no está en este repo ni en esta computadora** (lo dice `DECISIONES-MODO-NOCHE.md`, decisión 0.1). Pedile a fabrizio la ruta o el acceso. Sin eso, hacé solo las partes A y B y dejá C anotada.
- Con acceso: instalá el paquete `medicion-sistema/` (está listo, con su `LEEME.md`) y seguí las tareas pendientes A.4 y A.6 del modo noche:
  - instrumentar los módulos, un commit por módulo, con los eventos del catálogo (`medicion-sistema/catalogo.ts`) y la acción principal de cada plantilla (por ejemplo, ventas confirmadas en industria, como **cantidad**);
  - verificar en PostHog → Activity;
  - el interruptor "Compartir métricas" adentro del sistema, apagado por defecto, para que cada cliente lo acepte desde su cuenta, sincronizado con `permisos_metricas`.
- Nunca propiedades con montos, precios, nombres, emails, CUIT ni texto libre: la prueba del catálogo ya lo verifica, y no se toca.

## 4. Orden de trabajo

1. Paso 0 e inventario: qué hay de Núcleos y en qué modo está cada nicho.
2. Migración (`permisos_metricas` y baja con motivo).
3. `/panel/clientes`, "Nuevo cliente", permisos y bajas.
4. PostHog y el proceso diario con datos reales.
5. El repo del sistema, si hay acceso.
6. Pulido y publicación. En el resumen final, qué nichos ya muestran datos reales y cuáles siguen de ejemplo.
