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

*(las secciones siguientes se completan paso a paso)*
