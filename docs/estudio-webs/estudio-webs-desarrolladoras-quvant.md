# Prompt: estudio de webs de desarrolladoras de referencia para Quvant

Creado el 13 de octubre de 2026 a pedido de fabrizio: "hace un estudio de 5 desarrolladoras que tengan una pagina excepcional basadas en el diseño, la interaccion con el usuario y el posicionamiento del seo para estudiar y adaptar a la nuestra".

Resultados en `/mnt/project-files/quvant/estudio-webs-desarrolladoras/`. La rutina mensual vuelve a correr este prompt para mantener el estudio al día.

---

## Tarea

Estudiá 5 desarrolladoras (empresas o agencias de software) con una web excepcional en tres ejes: **diseño**, **interacción con el usuario** (3D, scroll, microinteracciones, rendimiento) y **posicionamiento SEO**. El objetivo es adaptar lo que sirva a la web de Quvant, la empresa de desarrollo de software de fabrizio.

## Antes de empezar, leé

- `/mnt/project-files/prompts/web-quvant.md`: el prompt con el que se construye la web de Quvant (Next.js + three.js, página única con Q de cromo en 3D). Cada recomendación tiene que decir cómo encaja ahí.
- `/mnt/project-files/quvant/Quvant-manual-de-identidad-v2.pdf`: la marca manda. Negro `#0D0D0F`, blanco `#ECECEE`, grises `#9C9CA3` y `#26262B`, sin degradados salvo el cromo de la Q, Michroma en mayúsculas, IBM Plex Mono. Frase: "Software a la vanguardia de cada nicho."
- Si ya existe una versión anterior del estudio en la carpeta de resultados, leela y actualizala (sumá una línea al `CHANGELOG.md`) en lugar de empezar de cero.

## Cómo elegir las 5

- Desarrolladoras o agencias que construyan software o web, no estudios solo de diseño gráfico.
- Con premios verificables (Awwwards Site/Developer of the Day o of the Year, Agencia del Año, FWA, CSS Design Awards, D&AD, Webby) o reconocimiento fuerte del sector.
- Que la mezcla cubra: 3D/WebGL de punta, una agencia con tipografía y scroll ejemplares, una con el mismo stack que Quvant (Next.js + three.js), y una empresa de software "seria" que posicione muy bien en Google.
- En la primera versión se eligieron Lusion, Active Theory, basement.studio, Locomotive y Netguru. En cada corrida mensual revisá si alguna perdió vigencia (rediseño, web caída) o si apareció una mejor (premios del último mes) y cambiala si corresponde, explicando por qué.

## Cómo investigar

- Para buscar usá **WebSearch, nunca WebFetch**.
- Para recorrer cada web usá Playwright (Chromium ya instalado) y curl desde Bash:
  - capturas en escritorio (1440 × 900) y celular (390 × 844), al cargar y después de hacer scroll;
  - título, descripción, canonical, Open Graph, H1/H2, JSON-LD, imágenes sin alt, cantidad de lienzos 3D, fuentes, peso;
  - `robots.txt`, `sitemap.xml` (verificá que sea un sitemap real y no la página de inicio), `llms.txt`;
  - Lighthouse en modo celular (`npm i lighthouse` en una carpeta temporal, con `CHROME_PATH` apuntando al Chromium de `/opt/pw-browsers`).
- Algunas webs bloquean navegadores sin placa de video: si pasa, simulá una (sobrescribir `WEBGL_debug_renderer_info`) y anotá que la web bloquea.
- Aclará los límites: el entorno no tiene placa de video, así que el rendimiento de las webs 3D sale peor que en un equipo real.

## Qué entregar (en `/mnt/project-files/quvant/estudio-webs-desarrolladoras/`)

- `00-resumen.md`: las 5 con por qué están, lo principal y las ideas que más le suman a Quvant.
- `01-analisis-por-web.md`: por cada web, diseño, interacción y SEO (lo verificable), capturas y "qué adaptar a Quvant / qué no copiar".
- `02-recomendaciones-quvant.md`: cuadro comparativo, recomendaciones por prioridad que digan en qué sección de la web de Quvant entran, presupuesto de rendimiento y lista de lo que no hay que copiar.
- `03-agregado-para-el-prompt-web.md`: bloque para pegarle a Claude Code junto con `web-quvant.md`. **No modifiques `web-quvant.md`**.
- `04-metodo-y-fuentes.md`, `CHANGELOG.md`, `capturas/` (JPG) y `_datos/` (mediciones crudas).

## Reglas

- Todo en español rioplatense, claro para un dueño de empresa.
- Respetá el manual de marca en cada adaptación.
- La web de Quvant no puede nombrar "Yunque" ni prometer ARCA, Mercado Pago o WhatsApp como funciones disponibles; las recomendaciones tampoco.
- Nunca recomiendes inventar clientes, logos, cifras ni premios.
