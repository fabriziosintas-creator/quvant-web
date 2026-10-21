import React from "react";
import { Composition, Still } from "remotion";
import { ALTO, ANCHO, DURACION, FPS, ForjaRecorrido } from "./compositions/ForjaRecorrido";
import { MuestraPantalla } from "./muestras/MuestraPantalla";
import { PRUEBA, PruebaShaders, QSola } from "./compositions/PruebaShaders";
import { HERO, HERO_CUADROS, HeroLoop } from "./compositions/HeroLoop";
import { SPOT, SPOT_CUADROS, SpotCompleto } from "./compositions/SpotCompleto";
import { SPOT_2026, Spot2026 } from "./spot2026/Spot2026";
import { DURACION as PROMO100_DURACION, FPS as PROMO100_FPS } from "./promo100/guion";
import { Promo100 } from "./promo100/Promo100";

/**
 * Composiciones del video: el hero-loop y el spot-completo (las dos piezas
 * del brief 4K), el recorrido de Forja para la web y las pruebas.
 */
export const Raiz: React.FC = () => {
  return (
    <>
      {/* "Primeros 100" (42 s, tres capítulos): 16:9 para la web y 9:16 para Reels y Stories. */}
      <Composition id="Promo100" component={Promo100} durationInFrames={PROMO100_DURACION * PROMO100_FPS} fps={PROMO100_FPS} width={1920} height={1080} />
      <Composition id="Promo100-Vertical" component={Promo100} durationInFrames={PROMO100_DURACION * PROMO100_FPS} fps={PROMO100_FPS} width={1080} height={1920} />
      {/* El spot 2026 (42 s, cortado a su música): 1080p para la web y 4K para redes. */}
      <Composition
        id="Spot2026"
        component={Spot2026}
        durationInFrames={SPOT_2026.segundos * SPOT_2026.fps}
        fps={SPOT_2026.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="Spot2026-4K"
        component={Spot2026}
        durationInFrames={SPOT_2026.segundos * SPOT_2026.fps}
        fps={SPOT_2026.fps}
        width={3840}
        height={2160}
      />
      {/* El fondo del hero del sitio: 4K/60 y su versión 1080p. */}
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={HERO_CUADROS}
        fps={HERO.fps}
        width={3840}
        height={2160}
      />
      <Composition
        id="HeroLoop1080"
        component={HeroLoop}
        durationInFrames={HERO_CUADROS}
        fps={HERO.fps}
        width={1920}
        height={1080}
      />
      {/* El spot de 45 s: 4K/60 y la prueba a 1080p con marca de tiempo. */}
      <Composition
        id="SpotCompleto"
        component={SpotCompleto}
        durationInFrames={SPOT_CUADROS}
        fps={SPOT.fps}
        width={3840}
        height={2160}
      />
      <Composition
        id="SpotPrueba1080"
        component={SpotCompleto}
        durationInFrames={SPOT_CUADROS}
        fps={SPOT.fps}
        width={1920}
        height={1080}
        defaultProps={{ marcaDeTiempo: true }}
      />
      {/* Un cuadro más: el 1440 tiene que ser idéntico al 0 (npm run verificar-loop). */}
      <Composition
        id="HeroLoopVerificacion"
        component={HeroLoop}
        durationInFrames={HERO_CUADROS + 1}
        fps={HERO.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="PruebaShaders"
        component={PruebaShaders}
        durationInFrames={PRUEBA.duracion}
        fps={PRUEBA.fps}
        width={PRUEBA.ancho}
        height={PRUEBA.alto}
      />
      <Still id="QSola4K" component={QSola} width={3840} height={2160} />
      <Composition
        id="ForjaRecorrido"
        component={ForjaRecorrido}
        durationInFrames={DURACION}
        fps={FPS}
        width={ANCHO}
        height={ALTO}
      />
      <Still
        id="MuestraMono"
        component={MuestraPantalla}
        width={1920}
        height={1080}
        defaultProps={{
          archivoPantalla: "pantallas/ferremix-nueva-escritorio-mono.webp",
          etiqueta: "A · Monocromo",
        }}
      />
      <Still
        id="MuestraColor35"
        component={MuestraPantalla}
        width={1920}
        height={1080}
        defaultProps={{
          archivoPantalla: "pantallas/ferremix-nueva-escritorio-color35.webp",
          etiqueta: "B · Color al 35 %",
        }}
      />
    </>
  );
};
