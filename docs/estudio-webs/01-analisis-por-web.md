# Análisis web por web

Relevado el 13 de octubre de 2026. Cada web se abrió con un navegador automático (Chromium) en escritorio (1440 × 900) y en celular (390 × 844), se hizo scroll y se midió con Lighthouse en modo celular. También se revisaron a mano `robots.txt`, `sitemap.xml`, `llms.txt`, metadatos y datos estructurados (JSON-LD). Método y límites en [04-metodo-y-fuentes.md](04-metodo-y-fuentes.md).

---

## 1. Lusion (Bristol, Reino Unido): lusion.co

**Por qué está:** estudio de 3D y web interactiva. Su web v3 ganó **Site of the Year 2023 de Awwwards, con Developer Award**, y tiene un Wood Pencil de D&AD por el rediseño. Clientes: Google, Porsche, Coca-Cola.

![Lusion cargador](capturas/lusion-escritorio-1.jpg)
![Lusion escena 3D](capturas/lusion-escritorio-3.jpg)
![Lusion celular](capturas/lusion-celular-2.jpg)

### Diseño
- **El cargador es parte de la marca**: pantalla negra, un contador grande 000 → 100 y bloques blancos que arman la "L" del logo. No es una espera, es la presentación.
- Después pasa a un fondo claro con **una sola escena 3D dentro de una "ventana" con bordes redondeados**: piezas plásticas brillantes en blanco, negro y un solo color de acento (azul).
- Tipografía sans (Aeonik) + **IBM Plex Mono** para etiquetas y detalles técnicos, la misma mono que usa Quvant.
- Muy poco texto en pantalla, mucho aire, menú mínimo (LET'S TALK + MENU).

### Interacción
- Las piezas 3D reaccionan al mouse y al scroll con física (se empujan, caen y se reacomodan).
- La escena se sostiene en el celular (la captura móvil muestra el mismo 3D adaptado al formato vertical).
- Contador de carga real: muestra el progreso de los modelos y texturas.

### SEO (lo verificable)
- Bien: título claro con la palabra clave ("Award Winning 3D and Interactive Web Studio"), descripción, un H1 que explica qué hacen, Open Graph y tarjeta de Twitter.
- Flojo: **es una aplicación que se arma en el navegador**. El `robots.txt` apunta a `sitemap-index.xml`, pero esa dirección **devuelve la página de inicio en HTML, no un sitemap**. No tiene canonical ni JSON-LD, y viewport con `user-scalable=no` (impide hacer zoom, penaliza accesibilidad).
- Rendimiento: Lighthouse **no pudo terminar la prueba** en celular porque la página dejó de responder durante la carga de la escena (en nuestro entorno sin placa de video; en un teléfono real anda mejor, pero indica que es muy pesada).

### Qué adaptar a Quvant
- **El cargador como momento de marca**: la Q que se arma (aro, cola, punto) acompañada de un contador 000 → 100 en Michroma. El prompt ya pide la Q armándose en menos de 2 segundos; sumarle el contador le da el toque "Lusion".
- **El 3D enmarcado en una ventana**: en la sección Plataformas, el sistema o el mini-depósito de Forja dentro de un recuadro con borde `#26262B`, como una pantalla. Separa el "efecto" del contenido y se ve serio.
- **Un solo acento**: Lusion usa azul; Quvant ya tiene el suyo, que es el cromo. Nada más.

**No copiar:** la falta de sitemap real, el bloqueo del zoom y el peso.

---

## 2. Active Theory (Los Ángeles y Ámsterdam): activetheory.net

**Por qué está:** estudio de producción digital fundado en 2012, referente mundial en WebGL. Su web v4 ganó **Site of the Year 2018 de Awwwards** y tienen Webbys por proyectos como YouTube. Desarrollan su propio motor 3D para web.

![Active Theory portada](capturas/active-theory-escritorio-1.jpg)
![Active Theory al hacer scroll](capturas/active-theory-escritorio-4.jpg)
![Active Theory celular](capturas/active-theory-celular-2.jpg)

### Diseño
- **Todo es una sola escena 3D**: el logo es un objeto de vidrio iridiscente colgado de una cinta, sobre un fondo casi negro con viñeteado.
- Casi sin texto: un botón flotante tipo "píldora" arriba a la derecha (Work · Contact) y un contador de proyectos.
- Estética cinematográfica: profundidad de campo, partículas, luces de color.

### Interacción
- **El scroll no baja la página, mueve la cámara**: al avanzar, el logo se desarma en miles de partículas de colores y la escena cambia de proyecto en proyecto.
- El mouse inclina la cámara y desplaza la escena.
- Botón de audio (la web tiene música).
- Mismo comportamiento en el celular.

### SEO (lo verificable)
- Bien: el HTML inicial trae descripción, Open Graph y tarjeta de Twitter completas.
- Muy flojo: **el navegador de prueba sin placa de video fue redirigido a `/unsupported` con la etiqueta `noindex`** ("Your browser is not supported"). Lighthouse le dio **54 de SEO** por eso. Si el robot de Google cae en ese caso, la página no se indexaría (es una inferencia: no podemos ver qué ve Google). No tiene H1 en la experiencia, ni sitemap real (`sitemap.xml` devuelve la página), ni JSON-LD.
- Para ver la web tuvimos que simular una placa de video: la experiencia directamente no existe para quien no tiene WebGL potente.

### Qué adaptar a Quvant
- **Scroll que cuenta una historia en una sola escena**: la idea del prompt del "punto que avanza" como hilo es exactamente esto. Conviene hacerlo con **un solo lienzo 3D fijo detrás de toda la página** (no un lienzo por sección): la Q se queda, el punto viaja y la cámara cambia de encuadre en cada sección. Es más liviano y se siente "una sola experiencia".
- **El menú tipo píldora flotante** con fondo `#26262B` translúcido: limpio y reconocible.
- **Materiales con reflejos reales**: lo que hace lindo su logo es el mapa de entorno; la Q de cromo de Quvant necesita lo mismo (ya está en el prompt).

**No copiar:** la pantalla de "navegador no soportado" (Quvant siempre tiene que mostrar el texto, con la Q en SVG si no hay 3D, como ya pide el prompt), el iridiscente y los colores (el manual solo permite el cromo), la música y la falta de texto.

---

## 3. basement.studio (Argentina, trabaja para Silicon Valley): basement.studio

**Por qué está:** estudio de diseño e ingeniería **argentino** que hace webs de alto rendimiento y 3D para Vercel, Next.js, Linear, Cursor, X, MrBeast y otros. Su propia web ganó **Awwwards Developer Award y Site of the Day (abril 2025) y FWA Site of the Day (marzo 2025)**; la web de Next.js Conf 2024 que hicieron también tiene Developer Award. Usa **el mismo stack que el prompt de Quvant: Next.js, WebGL/three.js y GSAP**. Es la referencia más cercana a lo que Quvant quiere ser.

![basement portada 3D](capturas/basement-escritorio-1.jpg)
![basement grilla de clientes](capturas/basement-escritorio-2.jpg)
![basement proyectos](capturas/basement-escritorio-4.jpg)
![basement celular](capturas/basement-celular-1.jpg)

### Diseño
- **Negro, blanco y un solo acento** (naranja muy chico en el selector Human/Machine). Muy parecido a la paleta de Quvant.
- Portada: su **oficina real reconstruida en 3D como dibujo de líneas (wireframe)** con píxeles que se disuelven. Es 3D, pero sobrio, técnico, casi un plano de ingeniería.
- **Grilla de logos de clientes en celdas con bordes finos** (SpaceX, X, Vercel, Next.js, Linear…): prueba social inmediata y se ve ordenada.
- Proyectos destacados en lista: imagen grande a la izquierda, texto corto y etiquetas de servicio a la derecha.
- Tipografía sans grande y apretada para títulos, texto chico para el resto. Contadores al lado del menú: Showcase (26), Blog (29).

### Interacción
- La escena 3D de la portada se mueve con el mouse y el scroll.
- **Selector "HUMAN / MACHINE"** fijo abajo: cambia la web a una versión de texto plano pensada para inteligencias artificiales y buscadores. Es una idea única que, además, sirve como versión liviana.
- Pantalla de celular bien resuelta: menú hamburguesa, grilla de clientes en 3 columnas.

### SEO (lo mejor del grupo)
- **Lighthouse en celular: SEO 100, accesibilidad 100, buenas prácticas 96.**
- Next.js con el HTML ya armado desde el servidor: los buscadores leen todo el texto sin ejecutar el 3D.
- Título con su frase de marca, descripción, **canonical**, Open Graph con un GIF animado (se destaca al compartir).
- **JSON-LD de organización completo** (nombre, nombres alternativos, área de servicio, temas que domina).
- **Sitemap real con 74 páginas**: servicios, cada proyecto, cada artículo del blog, equipo, preguntas frecuentes.
- **`llms.txt`**: un resumen de la empresa escrito para que ChatGPT, Claude y otros asistentes la describan bien.
- **Espejo para máquinas**: cada página tiene una versión en texto plano en `/ai/...` y una en Markdown (`.md`).
- `robots.txt` **invita explícitamente a los robots de IA** (GPTBot, ClaudeBot, OAI-SearchBot…) y les cierra solo lo privado.
- Página de **preguntas frecuentes** (qué hacen, cómo trabajan con 3D, cómo arrancar un proyecto): contenido que posiciona y que los asistentes citan.
- Punto débil: es pesada (**13,8 MB**, rendimiento 48 en nuestra prueba; el 3D bloquea el procesador mucho tiempo).

### Qué adaptar a Quvant
- **Todo el kit de SEO técnico, tal cual** (ver recomendaciones): HTML desde el servidor, canonical, JSON-LD, sitemap con una página por servicio y por caso, `llms.txt`, robots abierto a IA, preguntas frecuentes.
- **El selector Human/Machine convertido en "VISTA 3D / VISTA TEXTO"**: un interruptor chico en Plex Mono que apaga el 3D y muestra la versión liviana. Resuelve de una sola vez el modo de bajo rendimiento, la accesibilidad y la lectura para IA, y queda como guiño de "agencia creativa".
- **3D técnico y sobrio** como su wireframe: para el mini-depósito de Forja, estanterías en líneas finas `#9C9CA3` sobre negro, con el producto resaltado en cromo. Encaja con la marca mejor que un render colorido.
- **Grilla con celdas de borde fino** para los rubros (Industria, Gimnasios, Holística, Pymes, Inmobiliarias, Supermercados) mientras no haya logos de clientes.
- **Contadores al lado del menú** (Casos (1), Rubros (6)).

**No copiar:** el peso de la portada; Quvant tiene que cargar la Q en diferido y con un presupuesto de peso.

---

## 4. Locomotive (Montreal, Canadá): locomotive.ca

**Por qué está:** agencia de diseño y desarrollo fundada en 2008, **Agencia del Año de Awwwards siete años seguidos (2018–2024)** y autora de **Locomotive Scroll**, una librería de scroll de código abierto que usa medio mundo. Su organización interna es un "Triforce" de operaciones, diseño y desarrollo (OPS / DES / DEV aparece en el logo).

![Locomotive portada](capturas/locomotive-escritorio-1.jpg)
![Locomotive anillo 3D](capturas/locomotive-escritorio-2.jpg)
![Locomotive lista de proyectos](capturas/locomotive-escritorio-3.jpg)
![Locomotive celular](capturas/locomotive-celular-2.jpg)

### Diseño
- Portada con **video a pantalla completa** y el nombre en una serif condensada gigante. Después pasa a **fondo blanco, mucho aire y tipografía enorme**.
- **Lista de proyectos como titulares gigantes** separados por líneas finas (Lightship, Wolverine Worldwide, The Drake Hotel, Dulcedo, Scout Motors). Al pasar el mouse aparece una imagen chica **metida dentro del título** (se ve en "Scout [foto] Motors").
- **Objetos 3D reales como "trofeos"**: un anillo de campeonato que gira para contar sus 7 años de Agencia del Año ("The dynasty").
- Mucha personalidad y humor (emojis en el H1, "Freshness guaranteed", tienda propia).

### Interacción
- Scroll suave con su propia librería (hoy montada sobre Lenis, la misma que pide el prompt de Quvant).
- Imágenes que aparecen al pasar sobre los títulos, transiciones con máscaras, un personaje 3D que camina en la sección de carreras.

### SEO (lo verificable)
- **Lighthouse en celular: SEO 100, accesibilidad 95.**
- Título con palabra clave local: "Locomotive | **Montreal web agency**". Descripción larga con años de trayectoria ("Over the 15 years").
- Canonical, Open Graph, sitemap real (76 páginas) y **`llms.txt`** muy bien escrito (quiénes son, desde cuándo, qué premios, qué rubros).
- Página en inglés y francés.
- Flojo: H1 con emojis ("🔶 Locomotive® Digital-first Design Agency🍺🔞"), sin JSON-LD, y en nuestra prueba el scroll suave disparó un **CLS de 1** (la página "salta" mientras carga) y rendimiento 25.

### Qué adaptar a Quvant
- **Lista de rubros/productos como titulares gigantes en Michroma** separados por líneas `#26262B`: QUVANT INDUSTRIA, FORJA BY QUVANT, QUVANT GIMNASIOS, HACKFIT. Al pasar el mouse, una captura del sistema aparece dentro del título. Es elegante, barato de cargar y muy "agencia premiada". Puede reemplazar o acompañar el carrusel 3D de rubros del prompt (más liviano en el celular).
- **Un objeto 3D como trofeo** para contar un logro: en vez del anillo, la Q de cromo puede reaparecer en la sección del caso Ferremix o en Nosotros.
- **Palabra clave local en el título**: "Quvant | Desarrollo de software en Argentina".
- **`llms.txt` con historia y datos concretos**, como el de ellos.

**No copiar:** los emojis en títulos, el salto de diseño al cargar (reservar el alto de cada bloque), y el fondo blanco (Quvant es negro).

---

## 5. Netguru (Polonia): netguru.com

**Por qué está:** es la contracara de los estudios creativos. Una **empresa de desarrollo de software a medida** con más de 630 personas, reconocida por Awwwards, Clutch, Forbes e Inc. 5000. No gana por efectos 3D sino por **cómo convierte y cómo posiciona en Google**: es lo que Quvant necesita del lado "seriedad".

![Netguru portada](capturas/netguru-escritorio-1.jpg)
![Netguru casos](capturas/netguru-escritorio-3.jpg)
![Netguru servicios](capturas/netguru-escritorio-4.jpg)
![Netguru celular](capturas/netguru-celular-1.jpg)

### Diseño
- Portada oscura con un acento verde, titular corto y **"Trusted by:" con logos de IKEA, Volkswagen, OLX y Żabka** apenas abajo.
- **Casos de éxito como tarjetas con resultado medible**: "21% Higher Conversion for a Top RE Marketplace", "Scaling Core Apps for Delivery Hero". Cada tarjeta lleva el logo del cliente y una etiqueta del servicio en mono (UX/UI, BACKEND DEVELOPMENT).
- Servicios en lista de dos columnas: nombre a la izquierda, explicación a la derecha.

### Interacción
- Sobria: hover en tarjetas, menús desplegables por servicio, un video de fondo. Nada de 3D.
- El cartel de cookies tapa media pantalla en el celular hasta que se acepta.

### SEO (lo verificable)
- **Lighthouse en celular: SEO 100, accesibilidad 100.**
- **Título con la búsqueda que les da plata**: "Software Development Company | Netguru". Descripción con números ("más de 10 años", "más de 630 desarrolladores").
- **Máquina de contenido**: sitemap con unas **2.500 páginas, de las cuales unas 1.970 son artículos del blog**; además páginas por servicio, por industria y por caso.
- JSON-LD de organización (con todas sus redes), sitio web y migas de pan.
- `robots.txt` cuidado (bloquea vistas previas y parámetros que duplican páginas).
- Flojo: **el H1 de la portada ("AI-native commerce") no coincide con el título** ("Software Development Company"): manda señales mezcladas. Buenas prácticas 75 y 5,7 MB por los scripts de marketing (HubSpot).

### Qué adaptar a Quvant
- **Una página por servicio y por rubro**, cada una con su búsqueda objetivo en español: "sistema de gestión para ferreterías", "sistema de gestión para gimnasios", "desarrollo de software a medida", "diseño web para empresas". Esto es lo que más tráfico va a traer, y la página única sola no lo logra.
- **Casos con un número en el título** apenas haya datos reales (por ejemplo "Ferremix: catálogo con precio y stock desde el celular"; cuando haya métricas, el porcentaje).
- **Franja "Confían en nosotros"** cuando haya clientes que autoricen su logo (hoy no: no inventar).
- **Título y H1 alineados** en cada página (el error de Netguru que no hay que repetir).
- **Blog o notas** a mediano plazo, con temas del rubro ("cómo calcular el margen antes de un aumento masivo").

**No copiar:** el cartel de cookies invasivo y la carga de scripts de marketing.
