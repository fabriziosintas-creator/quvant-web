# Créditos · video de Quvant

## Spot 2026 (el que usa la web desde el 19-oct-2026)

Composición `Spot2026` (`src/spot2026/`). **No usa stock**: todo es material propio.

- **Imagen**: capturas de los trabajos del portfolio de Quvant (Grimm Travel, Yunque, Forja, HackFit, Firmamento, Gene Keys, Millonarios, Ideario), las mismas de `public/webs/` del sitio; 2,2 s del recorrido real de Forja; las fotos del método de `public/objetivo/` (las de Unsplash que ya usa el sitio, ver más abajo); la Q de cromo en 3D (`src/three/QChrome.tsx`).
- **Música y efectos**: pieza original compuesta en código (`scripts/componer-musica-2026.ts`): electrónica a 120 BPM en fa menor, con la estática, los impactos, los barridos y las subidas sincronizados a los cortes. Sin licencias de terceros.
- **Tipografías**: Michroma, IBM Plex Mono e IBM Plex Sans (SemiBold y Regular, de `@fontsource/ibm-plex-sans`), todas SIL Open Font License 1.1.

Las fotos de `public/objetivo/` son provisorias (Unsplash, licencia libre para uso comercial) hasta la sesión de fotos en la ferretería: al reemplazarlas, correr `npm run preparar-spot-2026`, `npm run render-2026` y `npm run entregas-2026`.

---

# Hero-loop y spot-completo (2025)

## Stock de video

Clips de [Pixabay](https://pixabay.com), bajo la [Licencia de contenido de Pixabay](https://pixabay.com/service/license-summary/): uso comercial gratis, sin atribución obligatoria. Igual quedan registrados acá. Todos pasaron por la LUT propia (`assets/luts/quvant.cube`) y por la gradación del video (`src/shaders/grade.frag`).

| Clip | Dónde se usa | Autor | Fuente |
| --- | --- | --- | --- |
| codigo-178565 | hero-loop · spot (01 · Programación, Método) | skarletmotion | [pixabay.com/videos/id-178565](https://pixabay.com/videos/id-178565/) |
| teclado-44423 | hero-loop · spot (01 · Programación, Método) | AJS1 | [pixabay.com/videos/id-44423](https://pixabay.com/videos/id-44423/) |
| diseno-52922 | hero-loop · spot (02 · Diseño, de fondo) | Gam-Ol | [pixabay.com/videos/id-52922](https://pixabay.com/videos/id-52922/) |
| geometria-25380 | hero-loop · spot (02 · Diseño, de fondo) | Gam-Ol | [pixabay.com/videos/id-25380](https://pixabay.com/videos/id-25380/) |
| deposito-197209 | spot (Industria) | ListosParaRodar | [pixabay.com/videos/id-197209](https://pixabay.com/videos/id-197209/) |

El resto de lo que se bajó y no entró en el corte final está en `assets/stock/CREDITS.md` y `assets/stock/CREDITS-extra.md`.

## Productos

Capturas y grabaciones propias de las demos públicas de **Yunque** (https://yunque-rust.vercel.app/ingresar) y **Forja** (https://yunque-rust.vercel.app/forja), hechas con Playwright (`npm run grabar`, `npm run grabar-forja`). Los datos son los de la empresa de demostración.

La pantalla de diseño de "02 · Diseño" no es stock: está dibujada en código (`src/scenes/lienzoDiseno.ts`).

## Música y sonido

- **Música**: pieza original de Quvant, compuesta en código (`scripts/componer-musica.ts`, `npm run musica`): electrónica mínima en re menor a 120 BPM, cortada a medida del spot. Sin licencias de terceros.
- **"Tic" del salto**: generado en el mismo script.

Si se reemplaza por un tema de Pixabay Music o Free Music Archive (archivo `assets/audio/musica.mp3`), anotar acá el título, el autor, la URL y la licencia.

## Tipografías

- [Michroma](https://fonts.google.com/specimen/Michroma) — Vernon Adams, SIL Open Font License 1.1.
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (Regular y Bold) — IBM, SIL Open Font License 1.1.
