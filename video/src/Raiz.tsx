import React from "react";
import { Composition, Still } from "remotion";
import { ALTO, ANCHO, DURACION, FPS, ForjaRecorrido } from "./compositions/ForjaRecorrido";
import { MuestraPantalla } from "./muestras/MuestraPantalla";
import { PRUEBA, PruebaShaders, QSola } from "./compositions/PruebaShaders";
import { HERO, HERO_CUADROS, HeroLoop } from "./compositions/HeroLoop";

/**
 * Composiciones del video de portada.
 *
 * Por ahora están solo las dos muestras para elegir el tratamiento de las
 * capturas. PortadaCorta, PortadaCortaCelular y PortadaLarga se registran
 * acá cuando estén las capturas del sistema.
 */
export const Raiz: React.FC = () => {
  return (
    <>
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
