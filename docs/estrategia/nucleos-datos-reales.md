# Núcleos con datos reales: qué quedó hecho y qué falta

Prompt 4 (21-oct-2026). Para fabrizio, que vende y carga los clientes, y para Michel, que conecta el sistema.

## Parte A: alta de clientes (hecho, en este repo)

- **`/panel/clientes`** (nueva pestaña "Clientes", después de Comercial): todos los clientes del sistema con nicho, plan, sucursales, responsable, abono, alta, estado, salud y si comparten métricas. Abajo aparecen los clientes activos en Plantillas que todavía no tienen cuenta del sistema, cada uno con "Cargar en el sistema". También se puede exportar en CSV.
- **"Nuevo cliente"**: un solo formulario para el día que se cierra la venta.
  - Crea o enlaza el registro de Plantillas (activo, abono y alta) y la cuenta del sistema (identificador de organización, núcleo, plan, sucursales, usuarios, módulos y responsable).
  - Si lo abrís desde una oportunidad (botón "Cargar en el sistema" en su ficha, cuando está en negociación o ganada), la oportunidad queda ganada y enlazada. Si lo abrís desde un local del mapa, el local pasa a cliente.
- **Compartir métricas**: en la ficha del cliente. Solo se prende con una constancia: la fecha, quién aceptó y cómo (contrato, email, mensaje u otro). La base no lo deja prender sin esa constancia. Se puede apagar, y cada cambio queda en el historial, que no se edita.
  - **Conviene que el permiso esté en el contrato**: así la constancia queda desde el primer día.
- **Dar de baja**: con fecha y motivo (lista cerrada). Marca la baja en la cuenta del sistema y en Plantillas, y eso alimenta el churn de Objetivos y de los nichos.

**Falta aplicar la migración** `supabase/migrations/20261023130000_clientes_alta.sql`. Hasta entonces, la lista y el alta funcionan, pero el permiso y la baja muestran un aviso.

**Cuándo Núcleos deja el modo ejemplo:** cuando hay al menos un cliente real cargado y PostHog está conectado. Mientras falte cualquiera de las dos cosas, sigue en modo ejemplo y el cartel dice por qué.

## Parte B: conectar PostHog (lo hace fabrizio, unos 10 minutos)

En este momento no hay claves de PostHog cargadas ni en esta computadora ni en el repo, así que todavía no se pudo probar contra el proyecto real.

1. Entrá a PostHog con la cuenta de Quvant y abrí el proyecto donde va a medir el sistema.
2. Andá a **Settings → Account → Personal API keys** (el engranaje abajo a la izquierda, después tu cuenta) y tocá **Create personal API key**.
3. Ponele un nombre claro, por ejemplo "Panel Quvant: solo lectura".
4. En **Scopes**, marcá solo **Query → Read**. Ningún permiso de escritura.
5. Si te deja elegir organización o proyecto, limitala a **este proyecto**.
6. Copiá la clave (empieza con `phx_`). **PostHog la muestra una sola vez.**
7. El número del proyecto está en **Settings → Project → General** (Project ID), y también en la dirección del navegador: `/project/<número>/`.
8. En **Vercel → quvant-web → Settings → Environment Variables**, cargá estas variables para Production:
   - `POSTHOG_HOST`: `https://us.posthog.com`, o `https://eu.posthog.com` si el proyecto está en Europa.
   - `POSTHOG_PROJECT_ID`: el número del paso 7.
   - `POSTHOG_PERSONAL_API_KEY`: la clave `phx_…`.
   - `CRON_SECRET`: una frase larga al azar. Vercel la usa para llamar al proceso diario `/api/nucleos/actualizar`, que ahora también corre Objetivos y Avisos.
   - `ANTHROPIC_API_KEY`: solo si quieren el análisis de Claude de verdad. Ya tiene un tope diario.
9. Volvé a publicar (Redeploy) para que tome las variables.

Las claves van solo en Vercel. Nunca se pegan en el repo ni en un chat.

**Cómo verificar:** en `/panel/nucleos`, tocá "Actualizar ahora". Si PostHog responde, el cartel de modo ejemplo desaparece apenas hay un cliente real cargado, y al día siguiente aparecen fotos en `indicadores_diarios`.

## Parte C: el sistema de gestión (pendiente: necesita el otro repo)

El sistema no está en este repo ni en esta computadora (decisión 0.1 del modo noche). Para hacer esta parte, fabrizio tiene que pasar la ruta o el acceso al repo del sistema. Con eso:

1. **Instalar el paquete.** Instalar `medicion-sistema/` en el sistema siguiendo su `LEEME.md`.
2. **Instrumentar los módulos** (tareas A.4 y A.6), con un commit por módulo:
   - usar los eventos de `medicion-sistema/catalogo.ts`;
   - medir la acción principal de cada plantilla, por ejemplo las ventas confirmadas en industria, siempre como **cantidad**.
3. **Verificar** en PostHog → Activity que lleguen los eventos.
4. **El permiso del lado del cliente.** Agregar el interruptor "Compartir métricas" dentro del sistema:
   - apagado por defecto;
   - cada cliente lo acepta desde su cuenta;
   - sincronizado con `permisos_metricas`: medio "otro", con el detalle "aceptado en el sistema".
5. **Lo que nunca va en los eventos:** montos, precios, nombres, emails, CUIT ni texto libre. La prueba del catálogo ya lo controla.

## Qué nichos muestran datos reales hoy

Ninguno todavía: los siete siguen en modo ejemplo.

- Hoy no hay clientes del sistema cargados.
- PostHog no está conectado.
- El sistema todavía no manda eventos.

Apenas se cargue el primer cliente con "Nuevo cliente" y estén las claves de PostHog, su nicho pasa a datos reales. El resto se va sumando con cada alta.
