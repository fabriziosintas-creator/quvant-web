# Integración del hero-loop en el sitio

El hero-loop es el fondo del bloque de portada: a la izquierda va el texto del sitio (QUVANT, la bajada y los botones) y el video deja ese tercio en negro, con la grilla. No tiene texto ni audio. Dura 24 s y el cuadro final empalma con el primero, así que el `loop` del navegador no muestra el corte.

## Archivos

| Archivo | Para qué | Peso |
| --- | --- | --- |
| `hero-loop-1080.webm` | AV1 1080p: el que conviene servir en la web | {{peso:hero-loop-1080.webm}} |
| `hero-loop-1080.mp4` | H.264 1080p: celulares y navegadores sin AV1 | {{peso:hero-loop-1080.mp4}} |
| `hero-loop-4k.webm` | AV1 4K, para pantallas grandes | {{peso:hero-loop-4k.webm}} |
| `hero-loop-4k.mp4` | H.264 4K, el máster | {{peso:hero-loop-4k.mp4}} |
| `hero-poster.jpg` | El primer cuadro, en 4K: póster y versión quieta (la Q de frente, y el video arranca justo ahí) | {{peso:hero-poster.jpg}} |

El presupuesto del sitio pide una primera carga de menos de 1,5 MB sin 3D: el video no puede bloquear la carga. Por eso el snippet usa `preload="none"` y el póster pinta primero. El AV1 pesa muy poco (el 1080p queda por debajo de 1 MB y el 4K en pocos MB): conviene servir el 1080p a todos y el 4K solo a pantallas grandes, con `media`. Los MP4 quedan de respaldo para los navegadores sin AV1; el MP4 4K es el máster, no va a la web.

## HTML

```html
<div class="hero-fondo" aria-hidden="true">
  <video autoplay muted loop playsinline preload="none" poster="/hero/hero-poster.jpg">
    <!-- AV1 primero; el navegador que no lo decodifica pasa al MP4. -->
    <source src="/hero/hero-loop-1080.webm" type='video/webm; codecs="av01.0.09M.08"' />
    <source src="/hero/hero-loop-1080.mp4" type="video/mp4" />
  </video>
</div>
```

Para pantallas de más de 2560 px de ancho se puede anteponer el 4K con `media` (Chrome 120+, Firefox y Safari lo respetan; los demás lo ignoran y siguen con el 1080p):

```html
<source src="/hero/hero-loop-4k.webm" type='video/webm; codecs="av01.0.13M.08"' media="(min-width: 2561px)" />
<source src="/hero/hero-loop-4k.mp4" type="video/mp4" media="(min-width: 2561px)" />
```

## CSS

```css
.hero-fondo {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #0d0d0f; /* el negro del video es el mismo: se funden */
  overflow: hidden;
  pointer-events: none;
}

.hero-fondo video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 70% 50%; /* anclado a la derecha: la acción está ahí */
  mix-blend-mode: lighten; /* ver abajo */
}

/* Menos movimiento: queda el póster, quieto. */
@media (prefers-reduced-motion: reduce) {
  .hero-fondo video {
    display: none;
  }
  .hero-fondo {
    background: #0d0d0f url("/hero/hero-poster.jpg") 70% 50% / cover no-repeat;
  }
}
```

El texto de la portada tiene que quedar por encima (`position: relative; z-index: 1`).

### Por qué `lighten` y no `screen`

El brief pedía `mix-blend-mode: screen`, pero eso solo funde si el negro del video es negro puro (#000). El negro de este video es el de la marca, #0D0D0F, igual al del sitio, y `screen` de #0D0D0F sobre #0D0D0F da #191A1D: el video se vería como un rectángulo más claro. Con `lighten` (el máximo de los dos, canal por canal) donde el video es negro gana el fondo del sitio, aunque algún navegador decodifique el negro un punto más oscuro, y donde hay imagen gana el video. Sin modo de mezcla también funciona: el negro del video mide #0D0D0F exacto.

## En quvant-web (Next)

- Los archivos van a `public/hero/`.
- Hoy la portada tiene la Q cromada en 3D (`QCromoDiferido` en `src/app/page.tsx`). El video la reemplaza en ese lugar, o queda detrás y la Q encima: hay que elegir uno de los dos (las dos Q juntas compiten).
- Que respete el interruptor VISTA 3D / VISTA TEXTO (`useVista` de `src/estado/vista.ts`), como `VideoForja.tsx`: en vista texto, solo el póster.
- Como `VideoForja`, pausarlo cuando sale de pantalla (IntersectionObserver): no hace falta decodificar 4K detrás del resto de la página.
