# Agregado para el prompt de la web de Quvant

Sale del estudio de 5 webs de desarrolladoras premiadas (13 de octubre de 2026). Se pega en Claude Code **junto con** el prompt `web-quvant.md` (al final, como sección 9) o, si la web ya está empezada, como un mensaje nuevo. No reemplaza nada del prompt original: lo completa. Si algo choca con el manual de marca, gana el manual.

Copiá desde la línea de abajo.

---

## 9. Ajustes por el estudio de webs de referencia

Estudiamos cinco webs de desarrolladoras premiadas: Lusion, Active Theory, basement.studio, Locomotive y Netguru. Usá estas decisiones. Si investigás algo, usá WebSearch (nunca WebFetch).

### 9.1 Estructura: página única + páginas para Google

- La portada sigue siendo la página única con secciones ancladas y el recorrido 3D.
- Además creá estas páginas, con el mismo diseño y la Q chica (o en SVG) para que carguen rápido:
  - `/sistemas/ferreterias-y-corralones`: Quvant para industria y ferreterías, con Forja by Quvant.
  - `/sistemas/gimnasios`: Quvant para gimnasios + HackFit.
  - `/desarrollo-a-medida`
  - `/diseno-web`
  - `/casos/ferremix` (propuesta de rediseño, con el deslizador antes/después)
  - `/preguntas-frecuentes`
- Cada sección de la portada termina con un link "Ver más" a su página. El menú sigue apuntando a las anclas de la portada.
- Títulos (y el H1 de cada página diciendo lo mismo con otras palabras):
  - Portada: "Quvant | Desarrollo de software y sistemas de gestión en Argentina"
  - "Sistema de gestión para ferreterías y corralones | Quvant"
  - "Sistema de gestión para gimnasios | Quvant"
  - "Desarrollo de software a medida para empresas | Quvant"
  - "Diseño y renovación de páginas web para empresas | Quvant"
  - "Propuesta de rediseño para Ferremix | Quvant"
  - "Preguntas frecuentes | Quvant"
- Cada página con su descripción propia (150–160 caracteres), Open Graph propio y `canonical`.

### 9.2 SEO técnico

- Todo el texto tiene que estar en el HTML que manda el servidor (componentes de servidor de Next.js). El 3D se carga después y nunca contiene texto importante.
- `<html lang="es-AR">`.
- `sitemap.ts` con todas las páginas y `robots.ts` que permita todo menos rutas privadas, y que mencione explícitamente a GPTBot, OAI-SearchBot, ClaudeBot, Claude-User y PerplexityBot como permitidos.
- JSON-LD:
  - `Organization` (nombre Quvant, logo, frase oficial como `slogan`, `areaServed: Argentina`, redes de `src/datos/contacto.ts`)
  - `WebSite` en la portada
  - `SoftwareApplication` para Quvant y para HackFit, sin precio
  - `FAQPage` en preguntas frecuentes
  - `BreadcrumbList` en las subpáginas
  - `CreativeWork` en el caso Ferremix, aclarando que es una propuesta
- `public/llms.txt`: un resumen en Markdown de quién es Quvant, sus 3 servicios, rubros, productos (Quvant, Forja by Quvant, HackFit) y la frase oficial, con un link a cada página. Mismas reglas que el resto del sitio: no nombrar Yunque, no prometer ARCA, Mercado Pago ni WhatsApp como funciones.
- Nada de `user-scalable=no` ni `maximum-scale=1` en el viewport.

### 9.3 Interacción y diseño

- **Interruptor "VISTA 3D / VISTA TEXTO"**, chico, fijo abajo al centro, en IBM Plex Mono, estilo píldora con fondo `#26262B`. "VISTA TEXTO" apaga el lienzo 3D, el scroll suave y las animaciones grandes, y muestra la Q en SVG. Arranca en VISTA TEXTO si hay `prefers-reduced-motion`, si no hay WebGL o si el `PerformanceMonitor` detecta FPS bajos. Guardá la elección en `localStorage` (con try/catch).
- **Cargador con contador**: mientras la Q se arma (aro, cola y el punto que encaja), un contador 000 → 100 en Michroma abajo a la izquierda, ligado a la carga real del 3D. Máximo 2 segundos: si el 3D tarda más, el contenido se muestra igual y la Q aparece cuando esté lista.
- **Un solo lienzo 3D fijo** detrás de toda la portada (no un `<Canvas>` por sección). La Q y el punto viven en esa escena; con el scroll la cámara cambia de encuadre en cada sección y el punto viaja de una a otra.
- **Rubros como titulares gigantes** en la sección Plataformas: QUVANT INDUSTRIA · FORJA BY QUVANT · QUVANT GIMNASIOS · HACKFIT · HOLÍSTICA (PRÓXIMAMENTE), en Michroma, separados por líneas de 1 px `#26262B`. En escritorio, al pasar el mouse aparece la captura simulada del sistema de ese rubro dentro del titular. En el celular son tarjetas que se tocan. Usalo en lugar del carrusel 3D si el carrusel baja el rendimiento.
- **Mini-depósito de Forja en wireframe**: estanterías en líneas finas `#9C9CA3` sobre negro, el producto resaltado en cromo, la etiqueta "Ilustración de ejemplo". Sin texturas.
- **Demos dentro de una ventana**: las capturas simuladas del sistema van dentro de un recuadro con borde `#26262B` y esquinas de 8 px, como una pantalla.
- **Grilla de rubros** con celdas de borde fino (Industria, Gimnasios, Holística, Pymes, Inmobiliarias, Supermercados), con "Próximamente" en las que corresponda. Dejala lista para convertirse en "Confían en nosotros" cuando haya logos autorizados (vacía con `TODO`, nunca logos inventados).
- **Menú tipo píldora flotante** con fondo `#26262B` semitransparente y, al lado de cada ítem, un contador chico en Plex Mono tomado de los datos (por ejemplo, Webs (1)).
- **La Q vuelve como trofeo**: reaparece en 3D (o en SVG en VISTA TEXTO) al cierre de la sección Nosotros.

### 9.4 Contenido

- Página de preguntas frecuentes con estas preguntas y respuestas cortas, escritas en `src/datos/textos.ts`:
  - ¿Cuánto tarda un sistema a medida?
  - ¿El sistema funciona sin internet?
  - ¿Puedo pasar mis datos desde Excel?
  - ¿Qué pasa con los datos sensibles cuando renuevan mi web?
  - ¿Trabajan con empresas chicas?
  - ¿Cómo se paga el sistema?
  - Si no tenés la respuesta exacta (plazos, precios), dejá un `TODO` en vez de inventar.
- En el caso Ferremix, el título dice qué cambió: "Propuesta de rediseño para Ferremix: catálogo con precio y stock desde el celular".
- Dejá preparada una carpeta `src/contenido/notas/` (vacía, con un ejemplo marcado como borrador que no se publica) para sumar notas del rubro más adelante.

### 9.5 Presupuesto de rendimiento

- Primera carga por debajo de 1,5 MB sin el 3D; el 3D en diferido.
- Modelos comprimidos (Draco o Meshopt) o geometría generada por código; mapa de entorno de 1k como máximo.
- Reservá el alto de cada bloque para que nada salte al cargar (CLS menor a 0,1).
- Sin scripts de marketing en la carga inicial.
- Mantené las metas de la sección 6 y sumá una prueba de Lighthouse en celular para cada subpágina antes de dar por terminado el paso 8.

### 9.6 Lo que no hay que hacer

- Nunca una pantalla de "navegador no soportado": sin 3D se ve la web completa.
- Sin colores de acento, iridiscentes ni degradados: el único efecto es el cromo de la Q.
- Sin música de fondo, sin emojis en títulos, sin carteles de cookies que tapen la pantalla.
