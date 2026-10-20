# Decisiones del modo noche (20 → 21 de octubre de 2026)

Leé esto primero. Trabajé de corrido la Parte A (medición del sistema con PostHog) y la Parte B (sección **Núcleos** del panel) sin pedir aprobación, siguiendo las reglas del modo noche. Cada decisión que el prompt pedía consultarte está acá: qué había que decidir, qué opciones había, cuál elegí, por qué y cómo deshacerla.

**Rama:** `panel-nucleos-noche`, creada desde `registro-y-panel` (commit `5804b62`). No hice push, deploy, ni toqué `master`, Vercel, Supabase, PostHog o Resend. **Para descartar todo:** `git checkout registro-y-panel` y después `git branch -D panel-nucleos-noche`.

**Lo que había sin guardar antes de empezar** (era mío, de la sesión anterior, no tuyo): un comentario nuevo en `globals.css` sobre la excepción de tipografía y las plantillas de Supabase regeneradas con el dominio nuevo. Quedó en el stash `antes-modo-noche`: `git stash list` lo muestra; `git stash pop` lo recupera cuando vuelvas a `registro-y-panel`.

---

## 0. Antes de empezar: qué hay en el repo

| Qué | Dónde | Framework | Base |
|---|---|---|---|
| Web pública de Quvant | `src/app/(sitio)/*` | Next.js 16 (App Router) | Supabase `uwwblklzzrajzdloubgn` |
| Registro, ingreso y cuenta | `src/app/(sitio)/{registro,ingresar,cuenta,privacidad}`, `src/app/auth` | ídem | ídem |
| Panel interno (`/panel`) | `src/app/panel/*` (Resumen, Plantillas, Bandeja) | ídem | ídem |
| **Sistema de gestión (el producto)** | **No está en este repo ni en esta computadora.** Vive en otro repo (el que está publicado en `yunque-rust.vercel.app`), que no encontré ni clonado localmente ni en tu GitHub público. | — | desconocida |

**Decisión 0.1 · La Parte A sin el repo del sistema.** El prompt supone que el sistema está en este repo. No está. Opciones: (a) no hacer la Parte A; (b) armar la medición como un **paquete listo para copiar al repo del sistema**, independiente del framework, con el catálogo, `medir()`, la cola sin conexión, el hash seudónimo, el proxy y las pruebas, y dejar la instrumentación de los módulos (A.4) marcada como pendiente porque requiere ver el código. Elegí **(b)**: todo lo que no depende del código del sistema queda hecho y probado, y el panel (Parte B) importa el catálogo desde ese mismo lugar. Para deshacerlo: borrar `medicion-sistema/`. **Pendiente para vos:** decirme dónde está el repo del sistema (o darme acceso) para hacer A.4 y A.6 ahí.

**Decisión 0.2 · Separación de rutas.** Sistema: ninguna ruta de este repo. Web pública: `src/app/(sitio)`. Panel: `src/app/panel` y `src/app/api/panel`. La medición de PostHog **no se carga en ninguna página de este repo**: la web pública ya tiene su medición propia sin terceros (`src/componentes/medicion`), y el panel solo *lee* PostHog desde el servidor.

**Decisión 0.3 · "Web más humana" queda en pausa.** Estaba empezando su paso 2 (tipografía y aire) cuando llegó el modo noche. No lo mezclé con esto: el script de transformación quedó escrito y sin aplicar; se retoma en `registro-y-panel` cuando digas.

**Claves disponibles en `.env.local`** (solo nombres): Supabase (URL, publishable, secreta, token de la CLI), Resend, `AVISO_REGISTROS_PARA`. **Faltan:** `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_PERSONAL_API_KEY`, `MEDICION_SAL`, `ANTHROPIC_API_KEY`. No inventé ninguna: todo lo que las necesita funciona en modo ejemplo y lo dice en pantalla.

---

## Parte A · Medición del sistema (en `medicion-sistema/`)

**A.1 · Qué quedó.** Un paquete independiente del framework, listo para copiar al repo del sistema: catálogo, `medir()`, cola sin conexión, seudónimo, adaptadores para `posthog-js` y `posthog-node`, el proxy para Next, el texto legal y las pruebas. `medicion-sistema/LEEME.md` explica cómo se instala. Commit: "Medición del sistema: catálogo, medir() y adaptadores de PostHog".

**Decisión A.2 · Módulos del catálogo sin ver el código.** Opciones: inventar módulos; o relevar la demo pública (`yunque-rust.vercel.app`) y la app de socios HackFit (que sí está en esta computadora). Elegí relevar. De la demo salen los módulos de **industria y comercio**: tablero multinegocio, mostrador (caja, ventas sin conexión, listas minorista/gremio/mayorista), inventario (conteo con cámara), precios al día (aumento masivo con margen), presupuestos, servicio técnico, clientes y cuentas corrientes, lista del proveedor (importación), reparto, reportes, permisos por rol, auditoría y doble factor. Para **gimnasios** no hay demo pública: los eventos (socios, cuotas, accesos con credencial, clases y turnos, rutinas) salen de la app de socios HackFit y de los ejemplos del brief, y están marcados **"a confirmar contra el código del sistema"**. Para deshacerlo: editar `medicion-sistema/catalogo.ts` y correr `npm run catalogo:json`.

**Decisión A.3 · Funciones clave (PARA APROBAR).** Son las que el panel usa para la adopción y las alertas (`FUNCIONES_CLAVE` en el catálogo).

*Industria y comercio* (las 8 del brief, tal cual): caja abierta y cerrada todos los días (diaria) · presupuestos que pasan a venta (semanal) · aumento masivo con vista previa del margen (mensual) · conteo con la cámara (mensual) · órdenes de compra sugeridas (semanal) · servicio técnico (semanal, solo si tiene taller) · cuentas corrientes con límite (mensual) · doble factor para dueño y administración (mensual).

*Gimnasios* (propuesta mía, a confirmar): alta de socios (semanal) · cuotas registradas (semanal) · control de acceso con credencial (diaria) · clases y turnos (semanal, solo si usa turnos) · rutinas asignadas por los profes (semanal, solo si tiene profes en el sistema) · doble factor para el dueño (mensual).

*Holística, pymes, inmobiliarias, supermercados, kioscos:* sin funciones clave hasta que exista el módulo (el panel los muestra como "próximamente", sin números).

**Decisión A.4 · Qué NO está en el catálogo.** ARCA, Mercado Pago, WhatsApp y la sincronización (emulados): ningún evento. Ninguna propiedad de texto libre: solo booleanos, contadores y listas cerradas (una prueba lo verifica: ningún nombre de propiedad contiene monto, precio, nombre, email, teléfono, CUIT, texto, nota, producto).

**Decisión A.5 · Usuarios seudónimos.** El servidor del sistema calcula `sha256(MEDICION_SAL + id)` al iniciar sesión y se lo pasa a la app; el navegador nunca tiene la sal. Sin seudónimo, el evento va como `org_<id>` (la organización, nunca la persona).

**Decisión A.6 · Cola sin conexión.** Propia y chica (`cola.ts`, 500 eventos, en `localStorage`), con un almacén inyectable para enchufarla a la cola que ya use el sistema sin tocar la lógica. Los eventos salen con su hora original y `sin_conexion: true`.

**Decisión A.7 · Grupos de PostHog.** Apagados (plan gratuito): `organizacion_id` viaja en cada evento. `registrarOrganizacionComoGrupo()` queda escrita para prenderla después.

**Pendiente de la Parte A (necesita el repo del sistema):** A.4 instrumentar los módulos (un commit por módulo) y A.6 verificar en PostHog → Activity, "Compartir métricas" apagado y sin conexión. A.5 "Novedades de Quvant" no se hizo esta noche (regla del modo noche: sin cambios visibles para los clientes).

## Parte B · Sección Núcleos del panel (`/panel/nucleos`)

**B.1 · Qué quedó.** Una sección nueva en el panel, al lado de Resumen, Plantillas y Bandeja, con la misma protección (rol admin en el servidor) y la misma marca. Tres vistas: todo Quvant → un núcleo → un cliente, con transiciones de Motion (acercarse al entrar, alejarse al volver), números que cuentan, tarjetas que se reordenan y, con "menos movimiento", todo directo. Commit: "Núcleos: panel de uso del sistema por núcleo y por cliente".

**Decisión B.2 · Modo ejemplo prendido.** No hay clave de PostHog, ni de Claude, ni tablas aplicadas: la sección arranca en **modo ejemplo** con 9 clientes inventados (6 de industria, 3 de gimnasios, con perfiles distintos: sano, estable, dejó de usar, cayó, nuevo, sin sesiones, parcial), calculados al vuelo con los mismos indicadores que los reales, marcados prueba y con el cartel "Datos de ejemplo" arriba de cada vista, que dice por qué. Se apaga solo cuando (1) están las tablas, (2) está PostHog y (3) hay al menos un cliente real en `clientes_sistema`. Con datos de ejemplo no se guarda nada (acompañamientos y alertas lo avisan). Para deshacerlo: borrar `src/nucleos/ejemplo.ts` y la rama `panoramaDeEjemplo` en `src/servidor/nucleos/datos.ts`.

**Decisión B.3 · Dónde van los datos.** Migración `supabase/migrations/20261021140000_nucleos.sql`: `nucleos` (los 7, con industria, gimnasios y holística activos y el resto próximamente), `clientes_sistema` (enlazable a `clientes_plantilla` en vez de duplicar), `indicadores_diarios` (la foto del día, entera en JSON), `alertas`, `acompanamientos` y `analisis_claude` (una respuesta por cliente o núcleo y por día). Todo con RLS solo admin. **No la apliqué** (regla del modo noche): la validé en un Postgres local con todas las migraciones en orden, una ronda de inserciones como admin y la prueba de que un anónimo no lee nada. Aplicarla: `npx.cmd supabase db push --linked` y después `npx.cmd supabase gen types typescript --linked --schema public > src/supabase/tipos.ts` (hoy el código consulta esas tablas sin tipos generados, a mano).

**Decisión B.4 · Proceso diario: Vercel Cron.** Opciones: Vercel Cron o una función programada de Supabase (pg_cron + pg_net). Elegí **Vercel Cron** (`vercel.json`, 10:00 UTC = 07:00 de Buenos Aires, ruta `/api/nucleos/actualizar` protegida con `CRON_SECRET`) porque el cálculo ya vive en Next (indicadores, PostHog, Resend, Claude) y así no hay una segunda copia de la lógica en SQL ni una segunda clave de PostHog en la base. Contra: en el plan Hobby de Vercel los crons corren una vez por día como mucho (alcanza). El botón **"Actualizar ahora"** del panel corre lo mismo con la sesión del admin. Para deshacerlo: borrar `vercel.json` y la ruta.

**Decisión B.5 · Indicadores y salud.** `src/nucleos/indicadores.ts` con `configuracion.ts` para ajustar los pesos (30 % días activos, 35 % adopción, 15 % amplitud, 20 % tendencia; verde ≥ 70, amarillo ≥ 40, rojo abajo; menos de 3 semanas de alta = "en arranque"). Ventanas por frecuencia de la función clave: diaria 7 días, semanal 14, mensual 45. "Dejó de usar" = la había usado en 3 o más semanas distintas. 10 pruebas unitarias (`npm test`). "A quién le va mejor" se mide por crecimiento de uso (operaciones, usuarios y sucursales activas contra hace un mes), nunca por plata, y la pantalla lo dice.

**Decisión B.6 · Semáforo sin colores nuevos.** El manual no tiene rojo/amarillo/verde y el panel anterior tampoco aprobó un color funcional. Uso la forma del cuadradito del logo, siempre con su palabra: **verde = cuadrado lleno blanco ("Bien")**, **amarillo = cuadrado con borde blanco ("Atención")**, **rojo = cuadrado vacío con borde acero ("En riesgo")**, **arranque = punto chico acero ("En arranque")**. En el 3D, lo mismo: lleno, con borde, vacío (solo aristas). Nunca color solo. Si querés un color funcional, va en `Semaforo` de `src/componentes/panel/nucleos/comunes.tsx` y en `Ciudad.tsx`.

**Decisión B.7 · 3D.** Las tres vistas (constelación de núcleos, ciudad de clientes, torre de uso) con React Three Fiber y drei, en blanco y grises sobre negro, un solo Canvas por pantalla, sin sombras, píxeles limitados a 1,5, carga diferida al entrar en pantalla, y **siempre con la vista en lista al lado** (interruptor "Vista 3D / Vista lista"); sin WebGL o con "menos movimiento", solo la lista. El teclado y el lector de pantalla trabajan sobre la lista. Las etiquetas 3D van con `<Text>` de drei (el `<Html>` de drei descarta el primero del grupo en React 19: lección anterior de este repo). Al tocar un núcleo, la cámara viaja hacia él y se abre su vista.

**Decisión B.8 · Claude.** `src/servidor/nucleos/claude.ts`: modelo `claude-haiku-5-5` (rápido y económico; se cambia con `NUCLEOS_CLAUDE_MODELO`), salida JSON validada con `output_config.format` (JSON schema), caché de prompt (`cache_control`) en la parte fija (reglas + catálogo de funciones clave), una respuesta por cliente y por día, tope diario (`NUCLEOS_CLAUDE_TOPE_DIARIO`, 50). Solo recibe agregados (sin notas libres ni datos del negocio). **Sin `ANTHROPIC_API_KEY`** devuelve un análisis armado con los indicadores, marcado "sin Claude", y lo dice en pantalla. El borrador de mensaje se edita y se copia; nunca se manda solo. Está aislado en `src/servidor/nucleos/claude.ts` + `BloqueClaude` para cambiarlo sin tocar lo demás. Hoy la caché por día es en memoria del servidor; con las tablas aplicadas, lo natural es guardarla en `analisis_claude` (está la tabla, falta el cambio de dos líneas).

**Decisión B.9 · Alertas por email.** `src/emails/nucleos.tsx` + `NUCLEOS_ALERTAS_PARA` (vacío = no manda, que es como queda esta noche). Solo alertas rojas, solo clientes que no son de prueba. Se manda desde el proceso diario con Resend.

**Pendiente de la Parte B:** aplicar la migración; cargar los clientes reales en `clientes_sistema` (hay un script de prueba, `supabase/pruebas/datos-nucleos-de-prueba.sql`, que se borra entero con `privado.borrar_nucleos_de_prueba()`); las claves; "Dejar novedad en su sistema" (necesita A.5, el botón está deshabilitado con la nota); mover la caché de Claude a la tabla.

*(las secciones siguientes se completan paso a paso)*
