# Prompt: una web de Quvant más humana, menos máquina

Creado el 20 de octubre de 2026 a pedido de fabrizio: "necesito que crees un prompt para que la página se aleje de la experiencia de computadora y de que estás manejando una máquina con circuitos etc y que se sienta más real, no tan robótica la página".

Se pega en Claude Code dentro de VS Code, **en la carpeta `quvant-web`** (la web que se está armando con `prompts/web-quvant.md`). Sirve en cualquier punto del armado: si un paso de la web todavía no existe, Claude Code aplica estas reglas cuando lo construya. **No reemplaza** `web-quvant.md`, `video-portada-quvant.md` ni `web-quvant-login-y-panel.md`: cambia el tono, no la estructura, ni la marca, ni las reglas de lo que se puede prometer.

---

## 0. Antes de pegar esto (para fabrizio, no para Claude Code)

1. **Elegí la tipografía de los párrafos** (es la única decisión que se aparta del manual, por eso es tuya). Editá la línea que está al principio de la sección 1 antes de pegar:
   - **A (recomendada):** párrafos y textos largos en **IBM Plex Sans** (misma familia que la Mono, misma "voz", pero se lee como un texto escrito por una persona). La Mono queda solo para etiquetas chicas, datos y números. Michroma sigue igual.
   - **B (sin excepción al manual):** todo en IBM Plex Mono, como dice el manual, pero escrito y compuesto de otra forma (minúsculas, más grande, más interlineado). Mejora, pero menos.
2. **Juntá fotos reales** en `quvant-web\_marca\fotos\` (con el celular alcanza, mejor con luz de día y sin flash). Esto es lo que más cambia la sensación, más que cualquier efecto:
   - `nosotros-fabrizio.jpg`, `nosotros-michel.jpg` y, si tienen, una de los dos juntos trabajando.
   - `ferremix-*.jpg`: el local de Ferremix por fuera y por dentro, el mostrador, el taller, el encargado atendiendo. **Solo con permiso de Ferremix** (y de las personas que aparezcan).
   - `uso-*.jpg`: el sistema en uso de verdad (alguien contando stock con el celular, la caja en un mostrador, el dueño mirando el tablero en el teléfono).
   - `gimnasio-*.jpg`: solo si hay un gimnasio real que les dé permiso.
   - Si todavía no tenés fotos, pegalo igual: el prompt deja los lugares listos y escondidos hasta que las sumes.
3. **Testimonios**: si alguien (por ejemplo, de Ferremix) te dio una frase real sobre trabajar con ustedes, anotala con nombre, cargo y su permiso en `_marca\testimonios.txt`. Si no hay, no se inventa ninguno.

---

## 1. Qué hay que hacer

**DECISIÓN DE FABRIZIO — tipografía de párrafos: A** ← (cambiá a B si preferís no apartarte del manual)

Sos el mismo estudio creativo del prompt de la web (director de arte, desarrollador WebGL y redactor argentino). La web de Quvant está quedando **demasiado "máquina"**: se siente como manejar una computadora con circuitos, una terminal o un panel de control. Tenés que hacer que se sienta **real y humana**: una empresa de dos personas que entienden de negocios y de gente, que además hacen software muy bueno. Se mantienen la Q de cromo en 3D, los colores, el logo y la estructura de la página. **Cambia el tono, no la identidad.**

Hablame en español rioplatense. Si investigás, usá WebSearch (nunca WebFetch). Si algo de este prompt choca con `_marca/Quvant-manual-de-identidad-v2.pdf`, gana el manual y me avisás, salvo la excepción tipográfica de arriba si elegí A.

No confíes en tu memoria para APIs (Next.js, React Three Fiber, drei, GSAP o `motion`, Lenis): revisá la documentación actual antes de cambiar código. En PowerShell usá `npx.cmd` y `npm.cmd`.

## 2. Diagnóstico: de dónde sale lo robótico

Esto es lo que, juntos, hacen que la web parezca una máquina. Varias cosas las pedimos nosotros en los prompts anteriores; ahora se corrigen.

| Señal de máquina | De dónde viene | Por qué se siente robótico |
|---|---|---|
| Todo el texto en monoespaciada | Manual + "textos en Plex Mono tipo consola" | La mono es la letra de las terminales y del código. Un párrafo entero en mono se lee como un log, no como alguien hablando. |
| El lema que se escribe letra por letra, cursor que titila | Portada, paso 3 | Es literalmente una terminal. |
| Contador 000 → 100 en la carga, contadores 01 / 05, "Webs (1)" en el menú | Estudio de webs, sección 9.3 | Números de sistema, progreso de máquina. A una persona no le importa en qué sección está. |
| Etiquetas en MAYÚSCULAS con mucho espaciado por todos lados | "ILUSTRACIÓN DE EJEMPLO", "VISTA 3D / VISTA TEXTO" | Parecen rótulos de un tablero de control. |
| Grillas de líneas finas, celdas con borde de 1 px, esquinas a 90° | Grilla de rubros, separadores, ventanas | Dibujan circuitos y planillas. |
| Wireframe (estanterías de líneas, mosaicos de pantallas) | Forja y video de portada | Es la estética de un plano técnico, no de un lugar. |
| Cromo con reflejos duros y fríos (`roughness` 0.06, entorno de estudio) | Q 3D | Brillo de máquina, sin luz de ambiente, sin sombra: flota en el vacío. |
| Animaciones rápidas y secas (`expo.out`, máscaras que cortan letras, cursor cuadrado que salta) | Sección 5 y estudio | El movimiento mecánico, sin peso, es lo que más "robot" transmite. |
| Copy sobre tecnología ("núcleo común", "módulos", "plantillas por rubro", "roles") | Textos de Plataformas | Habla del sistema, no de la persona que atiende el mostrador. |
| Ninguna cara, ningún lugar real | Regla de "solo 3D o capturas" | Sin gente, nadie le cree a una empresa de "dos amigos". |

## 3. Principios para todo el sitio

1. **Gente y lugares antes que pantallas.** Cada sección importante tiene algo real: una foto de un local, de una persona o del sistema en una mano. Las capturas del sistema se muestran en uso, no flotando en el vacío.
2. **Habla como el manual pide** (sección 08 · Tono de voz): claro antes que técnico, concreto, cercano (voseo, frases cortas, palabras de todos los días), seguro sin soberbia. Primero qué le resuelve a la persona; la tecnología, después o nunca.
3. **Movimiento con peso.** Todo se mueve como un objeto real: arranca suave, frena suave, nunca salta. Más lento de lo que te parece.
4. **Luz, no brillo.** La Q es un objeto de metal en un espacio con luz suave y una sombra que la apoya, no un reflejo duro sobre negro.
5. **Aire y jerarquía.** Menos líneas y bordes; el espacio separa las cosas. Un título, una frase, una imagen por bloque.
6. **Nada de efectos de máquina**: ni terminal, ni contadores, ni números de sección, ni rótulos de tablero, ni wireframes.

## 4. Reglas que no cambian

- Colores: negro `#0D0D0F`, blanco `#ECECEE`, gris acero `#9C9CA3`, gris profundo `#26262B`. Sin colores nuevos ni degradados, salvo el cromo de la Q. Las **fotos** pueden tener sus colores reales (ver paso 6).
- Logo, isotipo y QUVANT en Michroma: no se tocan.
- Nunca nombrar "Yunque" ni hablar de cambios de nombre.
- Ferremix siempre como **"Propuesta de rediseño para Ferremix"**; el link dice "Ver propuesta", nunca "Ver sitio en vivo".
- La facturación con ARCA, los cobros con Mercado Pago y los mensajes por WhatsApp del sistema **no se presentan como funcionando**. Como mucho, "Integraciones en camino". (El botón de contacto por WhatsApp de la web sí existe: es otra cosa.)
- Nunca inventar clientes, cifras, testimonios, fotos, nombres ni premios. Lo que falte queda como `TODO` y **no se muestra en producción**.
- Nada de fotos de banco de imágenes (stock): una persona sonriendo de stock es más falsa que no poner ninguna.
- Todo sigue funcionando sin 3D, con `prefers-reduced-motion` y en un celular de 375 px. Las metas de Lighthouse de `web-quvant.md` se mantienen.

## 5. Orden de trabajo (un commit por paso; al terminar cada uno, frená, contame qué cambió y cómo lo pruebo)

### Paso 1 · Auditoría (sin cambiar nada)

Recorré el repo y armame una tabla con cada "efecto de máquina" que encuentres: archivo, qué hace, y qué propone este prompt en su lugar. Buscá al menos: efecto de escritura letra por letra, cursores que titilan, contadores y porcentajes de carga, numeración de secciones, contadores en el menú, cursor propio, textos en `uppercase` con `tracking` amplio, bordes de 1 px y grillas, wireframes, `roughness` del cromo, curvas `expo`/`power4`, duraciones menores a 0,4 s en entradas, máscaras de texto, y textos de `src/datos/textos.ts` con palabras técnicas. Si algo de la lista todavía no existe, decilo y seguí: lo aplicás cuando se construya.

### Paso 2 · Tipografía y aire

- Leé la **DECISIÓN DE FABRIZIO** de la sección 1. Dejá la elección en **un solo token** (`--fuente-texto` en el CSS y la clase de Tailwind correspondiente), para que cambiar de A a B sea una línea.
- **Opción A**: cargá **IBM Plex Sans** con `next/font/google` (pesos 400 y 500, también en itálica 400). Usala en párrafos, bajadas, descripciones, testimonios, formulario y botones. IBM Plex Mono queda **solo** para etiquetas chicas, datos y números (precios de ejemplo, fechas, "Ilustración de ejemplo"). Anotá en un comentario arriba del token: "Excepción al manual aprobada por fabrizio el <fecha>: Plex Sans solo para textos de lectura".
- **Opción B**: todo sigue en IBM Plex Mono, pero los párrafos en peso 400, 17–18 px en celular y 18–20 px en escritorio, interlineado 1,65, `letter-spacing: 0` (o apenas negativo), máximo 60 caracteres por línea, siempre en minúscula con mayúscula inicial.
- En las dos opciones:
  - **Michroma** solo para el logotipo, números grandes y títulos de **una a tres palabras** (como dice el manual: "títulos muy cortos"). Los títulos que son frases ("Dos amigos, dos fuerzas, una sola marca.") van en la fuente de texto, grandes (40–64 px en escritorio), peso 500, en minúscula con mayúscula inicial.
  - Las etiquetas dejan de ir en MAYÚSCULAS espaciadas: "Ilustración de ejemplo", "Propuesta de rediseño", en tamaño chico y gris acero.
  - Sacá la mayoría de las líneas de 1 px y los bordes de celdas: separá con espacio (secciones con 120–160 px de aire vertical en escritorio, 72–96 px en celular).
  - Esquinas suaves y consistentes: 16 px en tarjetas y fotos, 999 px (píldora) en botones. Nada de ángulos rectos en lo que se toca.
  - Texto en blanco `#ECECEE` al 100 % para lo que se lee y gris acero para lo secundario; nunca párrafos largos en gris.

### Paso 3 · Copy que habla de negocios y de gente

Reescribí `src/datos/textos.ts` siguiendo el tono de voz del manual. Reglas:

- Cada texto empieza por lo que le pasa a la persona (vender, cobrar, controlar, atender) y recién después, si hace falta, cómo lo hace el sistema.
- Voseo, frases cortas, palabras de mostrador. Nombrá personas y momentos: el encargado, el dueño, el cajero, el cierre de caja, el lunes a la mañana, el cliente que pregunta si hay stock.
- Prohibidas en textos visibles: núcleo, módulo, plantilla, plataforma, solución, omnicanal, en tiempo real, escalable, disruptivo, sinergia, ecosistema, integral, de punta a punta (salvo en el nombre del servicio ya aprobado), "roles" y "permisos" sin explicar.
- No sumes promesas ni cifras nuevas: solo reescribís lo que ya está aprobado en `web-quvant.md`.

Ejemplos (usalos o hacé otros en la misma línea):

| Así no | Así sí |
|---|---|
| "Un núcleo común con plantillas por rubro." | "Un mismo sistema que se acomoda a cómo trabaja tu rubro." |
| "Stock por sucursal y conteo con la cámara del teléfono." | "Contás el stock con la cámara del celular y sabés qué hay en cada sucursal." |
| "Ves el margen antes de aplicar un aumento masivo de precios." | "Antes de subir los precios, ves cuánto vas a ganar. Sin sorpresas a fin de mes." |
| "Se sigue vendiendo sin internet en el mostrador." | "Si se corta internet, el mostrador sigue vendiendo." |
| "Tablero por rol." | "Cada uno ve lo suyo: el cajero, la caja; el dueño, todo, desde el celular." |
| "Software a la vanguardia de cada nicho." escribiéndose como terminal | La frase oficial aparece entera, tranquila, y abajo una línea humana: "Hacemos los sistemas y las webs de negocios que atienden, venden y cobran todos los días." |

También:

- El interruptor **"VISTA 3D / VISTA TEXTO"** se mantiene (funciona igual), pero dice **"Con animaciones" / "Versión liviana"**, en la fuente de texto, sin mayúsculas.
- Botones con verbos de persona: "Contanos qué necesitás", "Escribinos", "Ver la propuesta para Ferremix".
- En Nosotros, cada uno habla en primera persona con su nombre: "Soy fabrizio, programo hace muchos años…" y "Soy Michel, …". Escribí una propuesta corta para cada uno con lo que ya está aprobado (fuerza de desarrollo y fuerza comercial), marcala `TODO: que la revise cada uno` y no inventes datos de sus vidas.

### Paso 4 · Movimiento natural y lento

- **Sacá** el efecto de escritura letra por letra, el cursor que titila, el contador 000 → 100, la numeración de secciones (01 / 05), los contadores del menú y el cursor propio cuadrado (volvé al cursor del sistema; en lo clickeable, que el elemento reaccione, no el cursor).
- **Carga**: la Q aparece con la luz encendiéndose despacio sobre ella (1–1,2 s) y el punto encaja con un movimiento suave al final. Sin números ni barra. Si el 3D tarda, el texto ya está a la vista.
- **Curvas y tiempos**, en un solo archivo `src/lib/movimiento.ts` que usen todos los componentes:
  - Entradas: `opacity` 0 → 1 y desplazamiento de 16–24 px, 0,9–1,2 s, curva tipo `cubic-bezier(0.25, 0.1, 0.25, 1)` o `power2.out` / `sine.inOut`. Nada de `expo` ni `power4`.
  - Escalonado entre elementos de 80–120 ms.
  - Hover: 250–350 ms, cambios chicos (opacidad, `scale` 1.02, elevar 2 px). Nada que salte.
  - Los títulos entran como una línea entera que aparece, no con máscaras que cortan letras.
- **La Q sigue al mouse** con más peso: resorte con poca rigidez y bastante amortiguación (en R3F, interpolá hacia el objetivo con un factor bajo, del orden de 0,04 por cuadro, ajustado por `delta`), giro máximo de 15–20°. Cuando nadie la toca, "respira": flota 1–2 % arriba y abajo en un ciclo de 6–8 s y gira lentísimo.
- **Scroll suave** con Lenis más liviano (que no se sienta "sobre rieles"; si dudás, menos suavizado). Con `prefers-reduced-motion` o en "Versión liviana": sin Lenis y sin animaciones grandes.
- **El punto que avanza** sigue siendo el hilo de la página, pero viaja despacio y con curva, como algo que rueda, no como un cursor que salta.

### Paso 5 · Luz suave sobre la Q y 3D con materia

- **Cromo satinado, no espejo**: `roughness` entre 0,15 y 0,25 (probá y mostrame dos valores), `metalness` 1, `envMapIntensity` moderado. Sigue siendo cromo pulido y se tiene que reconocer el logo del manual.
- **Luz de estudio fotográfico**: armá el entorno con `Environment` + `Lightformer` de drei: una caja de luz grande y blanda arriba a un costado, un rebote tenue del otro lado y un borde de luz de contorno atrás. Luces grandes y difusas en vez de puntos chicos y duros. Color de luz neutro (opcional: muy apenas cálido, 4500–5000 K; mostrámelo antes de dejarlo).
- **Que se apoye en algo**: una sombra de contacto suave debajo (`ContactShadows` o `AccumulativeShadows`, muy difuminada) y una niebla muy leve que dé profundidad. La Q tiene que parecer un objeto en un lugar, no un render en el vacío.
- **Forja (mini-depósito)**: sacá el wireframe. Hacelo como una **maqueta**: estanterías sólidas mate en grises del manual (`#26262B` a `#9C9CA3`), luz suave con oclusión ambiental o sombras blandas, cajas con un poco de variación de tamaño, el producto resaltado en cromo. Etiqueta "Ilustración de ejemplo" en chico.
- Rendimiento: mismas reglas de `web-quvant.md` (bajar calidad con `PerformanceMonitor`, `dpr` máximo 1,5, SVG de respaldo). En calidad baja, sin sombras acumulativas: una sombra pintada en una textura alcanza.

### Paso 6 · Fotos reales y personas

- Componente `src/componentes/Foto.tsx` sobre `next/image`, con esquinas de 16 px, `sizes` correctos, `placeholder="blur"` y texto alternativo que describa lo que se ve ("Mostrador de Ferremix en Moreno").
- Datos en `src/datos/fotos.ts`: cada foto con archivo, texto alternativo, sección y si tiene permiso (`permiso: true`). **Solo se muestran las que tienen permiso.** Si una sección no tiene fotos, el bloque de foto **no se muestra** en producción (en desarrollo, un recuadro con `TODO: foto de …`). Nunca recuadros grises en la web publicada.
- **Tratamiento de color (decisión tomada, se puede cambiar)**: las fotos van con sus colores reales, con un retoque leve y parejo (un poco menos de saturación, negros profundos) para que convivan con el negro de la marca. Alternativa en una línea: todas en blanco y negro. Dejalo en una sola prop/clase para cambiarlo de una vez.
- Dónde van:
  - **Nosotros**: las fotos de fabrizio y Michel al lado de su texto en primera persona.
  - **Plataformas**: en cada rubro, una foto del tipo de negocio (ferretería/mostrador, gimnasio) o del sistema en uso; las capturas del sistema aparecen dentro de un celular o una notebook en ese contexto, o con una sombra suave, en lugar de ventanas con borde fino flotando.
  - **Rubros**: los titulares gigantes en Michroma del estudio se reemplazan por tarjetas con foto, el nombre del rubro (Michroma, una palabra o dos) y una frase de qué le cambia el día ("Ferreterías y corralones: precio y stock al día en todas las sucursales"). Holística y los próximos rubros, sin foto y con "Próximamente".
  - **Ferremix**: ver paso 7.
- Las capturas del sistema y de Ferremix se muestran **en color real** en la web (no en monocromo).

### Paso 7 · Caso real y testimonios

- **Ferremix como historia**, en tres momentos cortos, con fotos del local si hay permiso:
  1. Quiénes son: "Ferremix es una ferretería industrial de Moreno. Venden STIHL, Husqvarna y Milwaukee, y tienen servicio técnico propio."
  2. Lo que vimos: su web anterior no se adaptaba al celular y no mostraba precio ni stock (usá solo lo que muestran las capturas; no inventes problemas).
  3. Lo que propusimos: el deslizador antes / después que ya está, y los tres cambios (pensada para el celular, catálogo con precio y stock, botón de presupuesto directo).
  - Siempre con "Propuesta de rediseño para Ferremix" visible y "Ver propuesta".
- **Testimonios**: `src/datos/testimonios.ts`, arreglo vacío por defecto. Cargá solo los que estén en `_marca/testimonios.txt`, con nombre, cargo, empresa y foto si hay permiso. El bloque **no aparece** si el arreglo está vacío. Diseño: la cita grande en la fuente de texto (itálica si elegí A), el nombre abajo en chico, sin comillas gigantes decorativas ni estrellas.

### Paso 8 · Contacto con caras

- Arriba del formulario: las fotos chicas de fabrizio y Michel y una frase: "Te respondemos nosotros, no un bot." Si hay un horario o un tiempo de respuesta real, va como `TODO` para que lo complete fabrizio; no lo inventes.
- Formulario más corto y amable: nombre, qué necesitás (sistema para tu negocio, una app a medida, una web) y "Contanos un poco". Empresa y rubro, opcionales.
- Al enviar sigue abriendo WhatsApp o el email (`src/datos/contacto.ts`), con un mensaje armado que suene escrito por una persona: "Hola, soy <nombre>. Les escribo porque…".
- Si ya existe el registro de `web-quvant-login-y-panel.md`, aplicá el mismo tono y tipografía a las pantallas públicas (registro, ingreso, emails de confirmación y bienvenida). El panel interno de fabrizio y Michel puede seguir siendo más técnico: es una herramienta de trabajo.

### Paso 9 · Video de portada (solo si ya existe)

No rehagas el video en este prompt. Si `video/` ya está armado, dejá en `video/NOTAS-tono-humano.md` una lista corta de qué ajustar para que combine con la web nueva: usar la versión de pantallas con color real al 35 % en lugar de la monocroma, sacar el wireframe de Forja (maqueta sólida como en el paso 5), cortes con el punto un poco más lentos y luz más blanda en los dispositivos. Yo decido si lo aplico.

### Paso 10 · Revisión final

- Repetí la búsqueda del paso 1 y mostrame que no quedó ningún efecto de máquina (o por qué alguno se queda).
- Leé en voz alta (mentalmente) cada texto de `textos.ts`: si suena a folleto de tecnología, reescribilo.
- Probá en 375 px, con `prefers-reduced-motion`, en "Versión liviana" y sin WebGL.
- `npm.cmd run build` y `npm.cmd run lint` sin errores, y Lighthouse en celular con las metas de `web-quvant.md`.
- Resumen final corto: qué cambió, qué fotos y textos faltan (con la lista de `TODO`), y qué decisión quedó para mí.

## 6. Qué no hay que hacer

- No cambies colores, logo, ni la estructura de secciones.
- No agregues colores de acento, degradados, iconos genéricos, emojis, ilustraciones de personas ni fotos de stock.
- No reemplaces el 3D por video ni lo saques: lo hacés más cálido, no menos protagonista.
- No agregues música ni sonidos.
- No inventes datos, testimonios, clientes ni historias de fabrizio y Michel.
