# Qué adaptar a la web de Quvant, y cómo

Síntesis del estudio de las 5 webs ([01-analisis-por-web.md](01-analisis-por-web.md)) aplicada al prompt de la web de Quvant (`/mnt/project-files/prompts/web-quvant.md`). Todo respeta el manual v2: negro `#0D0D0F`, blanco `#ECECEE`, grises `#9C9CA3` y `#26262B`, sin degradados salvo el cromo de la Q, Michroma en mayúsculas para títulos, IBM Plex Mono para el resto.

## La conclusión en una línea

Las webs más premiadas (Lusion, Active Theory) impresionan con 3D pero **casi no existen para Google**; las que mejor posicionan (Netguru) **no impresionan**. La única que logra las dos cosas es **basement.studio**, que además es argentina y usa el mismo stack que el prompt de Quvant. **El modelo a seguir es basement: el "wow" de Lusion/Active Theory en la portada, el orden de Locomotive en la tipografía y la estructura de páginas de Netguru para Google.**

## Cuadro comparativo

| | Lusion | Active Theory | basement | Locomotive | Netguru |
|---|---|---|---|---|---|
| Premio principal | Site of the Year 2023 | Site of the Year 2018 | Developer Award + SOTD 2025 | Agencia del Año 2018–2024 | Reconocida por Awwwards, Clutch, Forbes |
| Impacto visual | Muy alto | Altísimo | Alto | Alto | Medio |
| 3D | Escena física con mouse | Toda la web es 3D | Wireframe sobrio | Objetos puntuales | No |
| Se lee sin 3D | Parcial | No (bloquea) | Sí | Sí | Sí |
| SEO Lighthouse (celular) | No terminó | 54 | **100** | **100** | **100** |
| Accesibilidad Lighthouse | No terminó | 100* | **100** | 95 | **100** |
| Sitemap real | No | No | Sí (74) | Sí (76) | Sí (~2.500) |
| JSON-LD | No | No | Sí | No | Sí |
| `llms.txt` para IA | No | No | Sí + espejo `/ai` | Sí | No |
| Peso medido | Muy pesada | 0,7 MB* | 13,8 MB | 2,9 MB | 5,7 MB |

\* Medido sobre la pantalla de "navegador no soportado" que Active Theory le muestra a un navegador sin placa de video.

## Recomendaciones, por prioridad

### Prioridad 1: cambios que conviene meter antes de empezar a construir

1. **Sumar páginas indexables además de la página única.** El prompt pide una sola página; eso está bien para la experiencia, pero una sola página compite por una sola búsqueda. Copiando a Netguru y basement, la portada sigue siendo el recorrido 3D, y además existen:
   - `/sistemas/ferreterias-y-corralones` (Quvant para industria y ferreterías, con Forja)
   - `/sistemas/gimnasios` (Quvant para gimnasios + HackFit)
   - `/desarrollo-a-medida`
   - `/diseno-web`
   - `/casos/ferremix`
   - `/preguntas-frecuentes`

   Cada sección de la portada termina con un "Ver más" que lleva a su página. Las páginas usan el mismo diseño, con la Q chica (o en SVG) para que carguen rápido.
2. **Títulos con la búsqueda real, en español y con lugar**, y el H1 diciendo lo mismo (el error de Netguru es que no coinciden):
   - Portada: "Quvant | Desarrollo de software y sistemas de gestión en Argentina"
   - "Sistema de gestión para ferreterías y corralones | Quvant"
   - "Sistema de gestión para gimnasios | Quvant"
   - "Desarrollo de software a medida para empresas | Quvant"
   - "Diseño y renovación de páginas web para empresas | Quvant"
3. **Kit técnico de basement completo**: HTML desde el servidor (que el texto exista sin ejecutar el 3D), `canonical` en cada página, `lang="es-AR"`, sitemap con todas las páginas, `robots.txt` que deje pasar a Google y a los robots de IA (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) y cierre solo lo privado, Open Graph por página.
4. **Datos estructurados (JSON-LD)**: `Organization` (nombre, logo, redes, área de servicio Argentina), `WebSite`, `SoftwareApplication` para Quvant y para HackFit (sin precio si no está definido), `FAQPage` en preguntas frecuentes, `BreadcrumbList` en las subpáginas y `CreativeWork` en el caso Ferremix.
5. **`llms.txt` en la raíz**, como basement y Locomotive: quién es Quvant, qué hace, sus 3 servicios, rubros, productos y la frase oficial, con links a cada página. Así ChatGPT, Claude o Perplexity describen bien a Quvant cuando alguien pregunta "¿quién me hace un sistema para mi ferretería?".
6. **Nunca bloquear a quien no tiene 3D** (el error de Active Theory). El prompt ya pide la Q en SVG como respaldo; hay que asegurarse de que esa versión no sea una pantalla de aviso sino la web completa.

### Prioridad 2: diseño e interacción (el "flash")

7. **Interruptor "VISTA 3D / VISTA TEXTO"** (adaptado del HUMAN / MACHINE de basement): chico, fijo abajo, en Plex Mono. Apaga el 3D, el scroll suave y las animaciones y deja la versión liviana. Es el modo de bajo rendimiento del prompt, la opción de accesibilidad y un detalle de agencia, todo en uno. Recordar la elección del visitante.
8. **Cargador con contador** (Lusion): mientras la Q se arma (aro, cola, punto que encaja), un contador 000 → 100 en Michroma abajo a la izquierda. Que dure menos de 2 segundos, como pide el prompt, y que si la carga tarda más se muestre el texto igual.
9. **Un solo lienzo 3D fijo detrás de toda la página** (Active Theory): la Q y el punto viven en una única escena; con el scroll la cámara cambia de encuadre por sección y el punto viaja de sección en sección. Más liviano que un lienzo por sección y se siente como una sola historia.
10. **Rubros como titulares gigantes** (Locomotive): QUVANT INDUSTRIA · FORJA BY QUVANT · QUVANT GIMNASIOS · HACKFIT · PRÓXIMAMENTE, en Michroma, separados por líneas `#26262B`; al pasar el mouse aparece la captura del sistema dentro del título. En el celular se vuelven tarjetas que se tocan. Puede reemplazar el carrusel 3D de rubros si el rendimiento no da.
11. **3D sobrio y técnico para Forja** (basement): el mini-depósito en líneas finas `#9C9CA3` sobre negro (wireframe), con el producto resaltado en cromo y la etiqueta "Ilustración de ejemplo". Encaja con la marca y pesa mucho menos que un render con texturas.
12. **3D enmarcado** (Lusion): las demos del sistema dentro de una "ventana" con borde `#26262B` y esquinas apenas redondeadas, como una pantalla. Separa el efecto del contenido.
13. **Grilla de celdas con borde fino** (basement): para los 6 rubros mientras no haya logos de clientes. Cuando haya clientes que lo autoricen, la misma grilla pasa a ser "Confían en nosotros" (Netguru). Nunca inventar logos.
14. **Menú tipo píldora flotante** (Active Theory) con fondo `#26262B` semitransparente y contadores al lado de cada ítem en Plex Mono (Casos (1), Rubros (6)), como basement.
15. **La Q como trofeo** (Locomotive): reaparece en 3D en un momento clave (el cierre de Nosotros o el caso Ferremix), no solo en la portada.

### Prioridad 3: contenido que posiciona y convence

16. **Preguntas frecuentes reales** (basement): "¿Cuánto tarda un sistema a medida?", "¿Funciona sin internet?", "¿Puedo migrar mis datos de Excel?", "¿Qué pasa con mis datos sensibles al renovar la web?", "¿Trabajan con ferreterías chicas?". Sin prometer ARCA, Mercado Pago ni WhatsApp (solo "integraciones en camino").
17. **Casos con resultado en el título** (Netguru): hoy "Propuesta de rediseño para Ferremix: catálogo con precio y stock desde el celular". Cuando haya un cliente real con métricas, el número va en el título.
18. **Notas cortas del rubro** a mediano plazo (Netguru tiene ~1.970 artículos; Quvant con 1 o 2 por mes alcanza para empezar): "Cómo ver el margen antes de un aumento masivo de precios", "Vender sin internet en el mostrador", "Cómo contar stock con el celular". Cada nota enlaza a la página del sistema.
19. **Perfil de empresa en Google (Google Business Profile)** con el mismo nombre, logo y web, para aparecer en búsquedas locales. Es fuera de la web pero suma al SEO local.

### Presupuesto de rendimiento (para no caer en lo de basement, Lusion o Locomotive)

Las cuatro webs con más efectos sacaron entre 25 y 48 de rendimiento en nuestra prueba de celular. Para que Quvant no pague ese precio:

- Primera carga **por debajo de 1,5 MB** sin contar el 3D; el 3D se pide después de que el texto ya está en pantalla.
- La Q en formato `.glb` comprimido (Draco o Meshopt) o generada por código, y el mapa de entorno chico (1k).
- Reservar el alto de cada bloque para que nada "salte" al cargar (CLS menor a 0,1; Locomotive marcó 1).
- No usar `user-scalable=no` (Lusion y Active Theory lo hacen y bloquea el zoom).
- Sin scripts de marketing pesados en la carga inicial; si se suma analítica, una liviana (Vercel Analytics o similar).
- Metas del prompt: Lighthouse celular ≥ 85 rendimiento y ≥ 95 en accesibilidad, buenas prácticas y SEO. basement y Netguru demuestran que 100 en SEO y accesibilidad es alcanzable.

## Lo que NO hay que copiar

- La pantalla de "navegador no soportado" y el `noindex` de Active Theory.
- Webs que se arman solo en el navegador sin sitemap real (Lusion, Active Theory).
- Colores de acento, iridiscentes o degradados (Lusion azul, Active Theory multicolor, Netguru verde): en Quvant el único "color" es el cromo.
- Fondo blanco y emojis en títulos (Locomotive).
- Música de fondo (Active Theory).
- Carteles de cookies que tapan media pantalla (Netguru).
- Logos de clientes, cifras o premios que Quvant todavía no tiene.

## Cómo sumarlo al prompt de la web

En [03-agregado-para-el-prompt-web.md](03-agregado-para-el-prompt-web.md) está todo esto escrito como un bloque para pegarle a Claude Code junto con el prompt de la web (o después, si ya arrancó), sin tocar el archivo original.
