# Video de Quvant

Proyecto Remotion (React + three.js + shaders GLSL propios) con las dos piezas del brief 4K (`marca/video/video-4k-quvant.md` en el workspace) y el recorrido de Forja que usa la web.

| Composición | Qué es |
| --- | --- |
| `Spot2026` / `Spot2026-4K` | **El spot que usa la web** (Nosotros): 42 s, cortado a su música, con los trabajos reales del portfolio. Ver abajo |
| `HeroLoop` / `HeroLoop1080` | Fondo del hero del sitio: 24 s, sin audio, loop exacto |
| `SpotCompleto` / `SpotPrueba1080` | Spot de 45 s para redes y presentaciones (la prueba lleva marca de tiempo) |
| `ForjaRecorrido` | El video real de Forja de Plataformas › Industria |
| `PruebaShaders`, `QSola4K` | Pruebas de los shaders y de la Q cromada |

## Spot 2026

No usa stock: sale de las capturas del portfolio del sitio, la grabación de Forja, las fotos del método y la Q de cromo. La imagen y la música comparten la línea de tiempo (`src/spot2026/tiempos.ts`): para mover un corte, se cambia ahí y se regeneran las dos.

```console
npm run preparar-spot-2026   # junta el material del sitio en public/spot2026/
npm run musica-2026          # compone la música → assets/audio/musica-2026.wav (−14 LUFS)
node scripts/fotogramas-2026.mjs 9.5 24.6   # cuadros sueltos para revisar (out/spot2026/cuadros/)
npm run render-2026          # la imagen, 1080p/60 (unos 6 min en esta máquina)
npm run entregas-2026        # MP4 + WebM + póster → ../public/spot/
```

## De cero a las entregas (hero-loop y spot 2025)

```console
npm i --loglevel=error
npm run grabar            # capturas 4K de Yunque y Forja (Playwright, Chrome con GPU)
npm run grabar-forja      # la toma de Forja, cuadro por cuadro (ver abajo)
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

## El recorrido de Forja (la ventana de Plataformas › Industria)

```console
npm run grabar-forja      # la toma, 60 fps, en unos 2 min → public/forja/recorrido.mp4 + src/compositions/forja/{cursor,marcas}.json
npm run render-forja      # la edición, 34 s a 60 fps (unos 2 min)
npm run web-forja         # MP4 + WebM + póster → ../public/forja/
```

La toma no se filma en vivo: la demo corre con un reloj virtual (`scripts/reloj-virtual.js`) que solo avanza cuando el grabador lo pide, así que cada cuadro se dibuja entero antes de fotografiarlo y el video sale fluido aunque la máquina tarde. (La versión anterior se filmó en tiempo real desde la notebook y se trababa cada vez que el 3D no llegaba.) El guion está en `scripts/grabar-forja-cuadros.ts`; si la demo cambia de lugar un control, se ajusta ahí. La toma ya tiene el ritmo final: en la edición todo va a velocidad 1.

## Lo que hay que saber de las máquinas

La compu de escritorio (RTX 3070, 32 GB) renderiza todo, `OffthreadVideo` incluido. Lo que sigue es de la notebook:

- Siempre `--gl=angle`: sin eso Remotion dibuja con SwiftShader (CPU) y tarda una eternidad.
- La GPU es una Intel integrada con 2 GB compartidos entre todas las pestañas del render. A 4K, `--concurrency=2`; a 1080p, 3. Si los cuadros salen en blanco, es memoria de GPU: bajar la concurrencia.
- Son 8 GB de RAM: mientras renderiza a 4K no correr encodes AV1 al lado (libaom 4K usa ~2 GB). Así se cayó el navegador a mitad del spot; por eso va en tramos.
- `remotion.exe` está bloqueado (probablemente el antivirus): no se puede usar `OffthreadVideo`. El stock va en secuencias de imágenes, y `ForjaRecorrido` (que usa `OffthreadVideo`) se renderiza en la de escritorio.
- El ffmpeg de Remotion no tiene `lut3d` ni AV1: los scripts usan `ffmpeg-static`.
- AV1 4K va a menos de 1 cuadro por segundo en esta CPU: el loop (24 s) tarda media hora; el spot va en VP9.

## Música

`npm run musica` compone una pieza original en código, cortada a la línea de tiempo del spot. Para usar un tema elegido a mano (Pixabay Music, Free Music Archive), dejarlo como `assets/audio/musica.mp3`, anotarlo en `entregas/CREDITS.md` y correr `npm run entregas -- spot`: no hace falta volver a renderizar la imagen.

## Licencia de Remotion

Remotion es gratis para personas y empresas de hasta 3 empleados; más grandes necesitan una licencia de empresa ([términos](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)).
