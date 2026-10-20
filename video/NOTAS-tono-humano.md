# Notas para el video de portada: tono humano

Escritas el 21-oct-2026 al terminar "web más humana" (paso 9). El video no se rehizo: esta es la lista de ajustes para que combine con la web nueva. Fabrizio decide si se aplican.

1. **Pantallas en color real al 35 %, no monocromas.** La web ya muestra las capturas del sistema y de Ferremix en color; el video sigue con la versión monocroma. Usar la variante con color real (hay una en `scripts/preparar-spot-2026.mjs`) con la saturación al 35 % para que conviva con el negro.
2. **Forja sin wireframe.** La web reemplazó el wireframe por el recorrido real grabado cuadro por cuadro (`ForjaRecorrido`). En el spot, donde aparezca el depósito de líneas, usar ese recorrido o una maqueta sólida en grises del manual (`#26262B` a `#9C9CA3`) con luz suave; el producto resaltado en cromo.
3. **Cortes con el punto, un poco más lentos.** El punto que avanza entre escenas viaja hoy en ~0,25 s con una curva que arranca rápido. Pasarlo a 0,6–0,9 s con la curva nueva del sitio, `cubic-bezier(0.25, 0.1, 0.25, 1)` (en Remotion: `Easing.bezier(0.25, 0.1, 0.25, 1)`), como algo que rueda, no como un cursor que salta.
4. **Luz más blanda en los dispositivos.** Los teléfonos y notebooks del spot tienen reflejos duros. Bajar la intensidad del entorno y sumar una luz grande y difusa de un costado, con una sombra de contacto suave debajo, para que se apoyen en algo.
5. **Sin efectos de terminal.** Si queda algún texto que se escribe letra por letra o un cursor que titila, reemplazarlo por la frase entera que aparece con un fundido de ~1 s. La intro de la tele se queda (decisión de fabrizio).
6. **Tipografía igual a la web.** Títulos de una a tres palabras en Michroma; todo lo demás en IBM Plex Sans (los párrafos) y Plex Mono solo para datos. Las fuentes ya están en `public/fonts/`.
