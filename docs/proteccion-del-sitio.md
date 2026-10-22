# Protección del sitio contra copias

22 de octubre de 2026. Para Fabrizio y Michel.

## Lo que hay que saber primero

Una página web no se puede esconder. El navegador tiene que descargar el HTML, el CSS y el JavaScript para mostrarla, así que quien la mira la puede guardar.

Bloquear el clic derecho o "Inspeccionar" se saltea en segundos, no frena a ningún bot y empeora la experiencia y la accesibilidad, así que no lo usamos.

Lo que sí hacemos es que copiar salga caro, que una copia publicada no sirva y que nos enteremos.

## Lo que ya está funcionando

1. **Guardia de dominio** (`src/componentes/estructura/guardiaDominio.ts`).
   - **Qué hace:** si el sitio se abre desde otro dominio, o desde una copia guardada en una computadora, lleva a la persona a quvant.com.ar, a la misma página. Además deja un aviso **"Copia del sitio"** en el panel con el dominio de la copia, que también llega por WhatsApp si está configurado.
   - **Dónde va:** el script viaja dentro de cada página, así que va con cualquier copia hecha con "Guardar como" o con una herramienta de copia.
   - **Por qué cuesta desactivarlo:** el dominio está escrito codificado, así que buscar y reemplazar "quvant.com.ar" no alcanza.
2. **Bloqueo de herramientas de copia** (`src/proxy.ts`). HTTrack, SiteSucker, wget, curl y los scripts de scraping más comunes reciben "Acceso no permitido". Google, las vistas previas de WhatsApp y las redes, y los navegadores, entran normal.
3. **Sin iframes ajenos** (`next.config.ts`). Ningún otro sitio puede mostrar nuestras páginas adentro del suyo para hacerlas pasar por propias.
4. **El código original no está expuesto.** Lo que se descarga está minificado y no se publican los mapas de código: pedirlos da 403. Las claves, la base y la lógica del servidor nunca llegan al navegador.
5. **Visitas repetidas.** Si una misma conexión entra 3 veces o más en un día, llega un aviso al panel con las páginas que miró.
6. **Derechos reservados en el pie.** Dice: "© 2026 Quvant. Todos los derechos reservados. Prohibida su reproducción total o parcial sin autorización."

## Si llega un aviso de "Copia del sitio"

1. Abrí el dominio que dice el aviso y sacá capturas con la fecha visible. Guardá también el código de la página (clic derecho → "Ver código fuente" → guardar).
2. Fijate quién aloja ese dominio. Buscalo en https://who.is: aparecen el registrador y, muchas veces, el hosting.
   - Si es un dominio `.ar`, el titular figura en https://nic.ar.
3. Pedí que lo bajen:
   - **Al hosting o al registrador:** casi todos tienen un formulario de "abuse" o de infracción de derechos de autor. Si es un hosting de Estados Unidos, se llama aviso DMCA.
   - **A Google:** que deje de mostrar la copia, con el formulario de "Retirar contenido por derechos de autor" de Google.
   - **Al dueño de la copia, si se puede identificar:** una intimación por carta documento. La web (textos, diseño, código e imágenes) es una obra protegida por la Ley 11.723 de Propiedad Intelectual.
4. Si es grave, o es un competidor que la usa para vender, conviene consultarlo con un abogado.

## Para estar más cubiertos (lo hace Fabrizio, cuando quiera)

- **Registrar la marca "Quvant" en el INPI** (Instituto Nacional de la Propiedad Industrial). Así, nadie puede usar el nombre para algo parecido.
- **Registrar la web y el sistema como obra en la DNDA** (Dirección Nacional del Derecho de Autor). No es obligatorio para tener los derechos, pero da una fecha cierta que sirve de prueba ante cualquier reclamo.
- **Protección de bots de Vercel (opcional).** En el proyecto, en Vercel → Firewall, se pueden activar las reglas de bots administradas, que desafían al tráfico que no es un navegador real. Pruebenlo de a poco: puede frenar algunas herramientas legítimas.
  - Hoy el sitio deja entrar a propósito a los bots de ChatGPT, Claude y Perplexity (`src/app/robots.ts`), para que nos citen cuando alguien pregunta por sistemas de gestión. Bloquearlos nos saca de esa vidriera.

Nada de esto es asesoramiento legal: son los pasos habituales, para ordenar qué hacer.
