# Video de Quvant

Proyecto Remotion (React + three.js + shaders GLSL propios) con las dos piezas del brief 4K (`marca/video/video-4k-quvant.md` en el workspace) y el recorrido de Forja que usa la web.

| Composición | Qué es |
| --- | --- |
| `HeroLoop` / `HeroLoop1080` | Fondo del hero del sitio: 24 s, sin audio, loop exacto |
| `SpotCompleto` / `SpotPrueba1080` | Spot de 45 s para redes y presentaciones (la prueba lleva marca de tiempo) |
| `ForjaRecorrido` | El video real de Forja de Plataformas › Industria |
| `PruebaShaders`, `QSola4K` | Pruebas de los shaders y de la Q cromada |

## De cero a las entregas

```console
npm i --loglevel=error
npm run grabar            # capturas 4K de Yunque y Forja (Playwright, Chrome con GPU)
npm run grabar-forja      # la toma en vivo de Forja
npm run stock             # stock de Pixabay (PIXABAY_API_KEY en .env)
npm run normalizar        # LUT y recorte a 4K
npm run preparar-hero     # material del hero-loop → public/hero/
npm run preparar-spot     # material del spot → public/spot/
npm run musica            # música y "tic" del spot → assets/audio/
npx remotion bundle src/index.ts --out-dir=build
npx remotion render build HeroLoop out/hero-loop-4k.mp4 --gl=angle --concurrency=2
# el spot, en tres tramos (cada uno con un navegador nuevo) y unidos sin recodificar:
for r in 0-899 900-1799 1800-2699; do npx remotion render build SpotCompleto out/revision/spot-parte-$r.mp4 --gl=angle --concurrency=2 --muted --crf=16 --jpeg-quality=92 --frames=$r; done
npm run unir-spot         # → out/spot-completo-4k-imagen.mp4
npm run entregas -- hero  # póster, 1080p H.264, 1080p y 4K AV1
npm run entregas -- spot  # mezcla de audio, MP4 y WebM (VP9)
npm run verificar-loop    # cuadro 0 contra el 1440 del loop
npm run verificar-entregas
```

Todo lo que se regenera (material, renders, `out/`) está en `.gitignore`.

## Lo que hay que saber de esta máquina

- Siempre `--gl=angle`: sin eso Remotion dibuja con SwiftShader (CPU) y tarda una eternidad.
- La GPU es una Intel integrada con 2 GB compartidos entre todas las pestañas del render. A 4K, `--concurrency=2`; a 1080p, 3. Si los cuadros salen en blanco, es memoria de GPU: bajar la concurrencia.
- Son 8 GB de RAM: mientras renderiza a 4K no correr encodes AV1 al lado (libaom 4K usa ~2 GB). Así se cayó el navegador a mitad del spot; por eso va en tramos.
- `remotion.exe` está bloqueado (probablemente el antivirus): no se puede usar `OffthreadVideo`. El stock va en secuencias de imágenes.
- El ffmpeg de Remotion no tiene `lut3d` ni AV1: los scripts usan `ffmpeg-static`.
- AV1 4K va a menos de 1 cuadro por segundo en esta CPU: el loop (24 s) tarda media hora; el spot va en VP9.

## Música

`npm run musica` compone una pieza original en código, cortada a la línea de tiempo del spot. Para usar un tema elegido a mano (Pixabay Music, Free Music Archive), dejarlo como `assets/audio/musica.mp3`, anotarlo en `entregas/CREDITS.md` y correr `npm run entregas -- spot`: no hace falta volver a renderizar la imagen.

## Licencia de Remotion

Remotion es gratis para personas y empresas de hasta 3 empleados; más grandes necesitan una licencia de empresa ([términos](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)).
