import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useFuentes } from "../brand/fuentes";
import { COLOR, TIEMPO } from "../brand/tokens";
import { APERTURA } from "../scenes/Apertura";
import { CIERRE, QCierre, firma } from "../scenes/Cierre";
import { CODIGO_ESCENA } from "../scenes/Codigo";
import { suave, tramo } from "../scenes/comun";
import { DISENO } from "../scenes/Diseno";
import { FORJA } from "../scenes/Forja";
import { INDUSTRIA } from "../scenes/Industria";
import { METODO } from "../scenes/Metodo";
import type { Escena } from "../scenes/piezas";
import { MarcaDeTiempo, Textos } from "../scenes/Textos";
import { YUNQUE } from "../scenes/Yunque";
import { GrillaDePuntos, puntoDeGrilla } from "../three/DotGrid";
import { CadenaPost } from "../three/Gradacion";
import { Salto3D } from "../transitions/Jump";
import { REVELADAS_SPOT, cuadrosDelSalto } from "../transitions/tiempos";

/**
 * spot-completo · 45 s a 60 fps, para redes y presentaciones.
 *
 * Ocho escenas y entre cada una, "el salto": un punto de la grilla vuela y
 * la escena siguiente se abre desde donde aterriza. No hay otro tipo de
 * transición. Todo vive en un solo lienzo 3D (las dos escenas del salto en
 * sus texturas, la grilla detrás, la Q del cierre delante) y pasa por la
 * misma gradación; los textos van en el DOM, encima.
 *
 * Memoria de la GPU (Intel integrada, 2 GB compartidos entre todas las
 * pestañas del render): el lienzo va sin antialias propio, las texturas
 * del salto sin multisampling a 4K, y el antialias de la pasada final solo
 * se prende cuando está la Q (es lo único con bordes finos fuera del
 * salto). Con todo prendido, a la tercera escena los cuadros salían en
 * blanco.
 *
 * La música no se renderiza acá: se mezcla después con ffmpeg
 * (npm run mezclar-spot), así cambiarla no obliga a renderizar de nuevo.
 */

export const SPOT = { segundos: TIEMPO.spotSegundos, fps: TIEMPO.fps };
export const SPOT_CUADROS = SPOT.segundos * SPOT.fps;

type Bloque = {
  escena: Escena;
  /** Segundo en el que el salto terminó de revelarla. */
  revelada: number;
  /** El salto que la revela: de qué punto de la grilla sale y dónde aterriza (fracciones, origen arriba-izquierda). */
  salto: { origen: [number, number]; destino: [number, number] | "q" };
};

// Los segundos de cada revelado viven en tiempos.ts (los usa también la mezcla, para los "tic").
const [CODIGO_R, DISENO_R, YUNQUE_R, FORJA_R, INDUSTRIA_R, METODO_R, CIERRE_R] = REVELADAS_SPOT;

export const BLOQUES: Bloque[] = [
  { escena: APERTURA, revelada: 0, salto: { origen: [0, 0], destino: [0, 0] } },
  { escena: CODIGO_ESCENA, revelada: CODIGO_R, salto: { origen: [0.36, 0.58], destino: [0.62, 0.42] } },
  { escena: DISENO, revelada: DISENO_R, salto: { origen: [0.18, 0.8], destino: [0.6, 0.45] } },
  { escena: YUNQUE, revelada: YUNQUE_R, salto: { origen: [0.22, 0.74], destino: [0.66, 0.5] } },
  { escena: FORJA, revelada: FORJA_R, salto: { origen: [0.2, 0.78], destino: [0.66, 0.48] } },
  { escena: INDUSTRIA, revelada: INDUSTRIA_R, salto: { origen: [0.16, 0.8], destino: [0.66, 0.42] } },
  { escena: METODO, revelada: METODO_R, salto: { origen: [0.14, 0.84], destino: [0.7, 0.46] } },
  { escena: CIERRE, revelada: CIERRE_R, salto: { origen: [0.2, 0.8], destino: "q" } },
];

/** El tiempo de la grilla: corre normal y se frena del todo para el cierre (grilla quieta). */
export function tiempoGrilla(t: number) {
  if (t < 38) return t;
  if (t < 42) return 38 + (t - 38) - (t - 38) ** 2 / 8;
  return 40;
}

/** El punto que parpadea en la apertura antes de saltar. */
function parpadeo(t: number) {
  const encendidos: [number, number][] = [
    [1.0, 1.18],
    [1.42, 1.6],
    [1.84, 99],
  ];
  return Math.max(...encendidos.map(([a, b]) => tramo(t, a, a + 0.05) * (1 - tramo(t, b, b + 0.05))));
}

/** Qué se ve en el segundo t: la escena A, la B y cuánto va del salto. */
function momento(t: number, duracionSalto: number) {
  let k = 0;
  for (let i = 1; i < BLOQUES.length; i++) if (t >= BLOQUES[i].revelada - duracionSalto) k = i;
  if (k > 0 && t < BLOQUES[k].revelada) {
    return { a: k - 1, b: k, progreso: (t - (BLOQUES[k].revelada - duracionSalto)) / duracionSalto };
  }
  return { a: k, b: Math.min(k + 1, BLOQUES.length - 1), progreso: 0 };
}

/** El tiempo propio de un bloque: arranca cuando empieza el salto que lo revela. */
const tiempoLocal = (i: number, t: number, duracionSalto: number) =>
  i === 0 ? t : t - (BLOQUES[i].revelada - duracionSalto);

export const SpotCompleto: React.FC<{ marcaDeTiempo?: boolean }> = ({ marcaDeTiempo = false }) => {
  useFuentes();
  const cuadro = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = cuadro / fps;
  const u = width / 3840;
  const aspecto = width / height;
  const salto = cuadrosDelSalto(fps);
  const duracionSalto = salto.total / fps;
  const { a, b, progreso } = momento(t, duracionSalto);
  const saltando = progreso > 0;

  const A = BLOQUES[a].escena;
  const B = BLOQUES[b].escena;
  const localA = tiempoLocal(a, t, duracionSalto);
  const localB = tiempoLocal(b, t, duracionSalto);

  // El salto en curso (o el próximo, para el parpadeo de la apertura).
  const proximo = BLOQUES[b];
  const inicioSalto = proximo.revelada - duracionSalto;
  const origen = puntoDeGrilla(proximo.salto.origen, width, height, tiempoGrilla(inicioSalto), SPOT.segundos);
  const destino: [number, number] =
    proximo.salto.destino === "q"
      ? firma(width, height).centroQ
      : [proximo.salto.destino[0] * width, proximo.salto.destino[1] * height];

  const inicioCierre = BLOQUES[BLOQUES.length - 1].revelada - duracionSalto;

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <ThreeCanvas
        width={width}
        height={height}
        flat
        linear
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 9], fov: 40 }}
      >
        <GrillaDePuntos
          ancho={width}
          alto={height}
          periodo={SPOT.segundos}
          segundos={tiempoGrilla(t)}
          opacidad={suave(tramo(t, 0.25, 1.35))}
        />
        <Salto3D
          ancho={width}
          alto={height}
          progreso={progreso}
          corte={salto.corte}
          origen={origen}
          destino={destino}
          lado={Math.round(30 * u)}
          escenaA={<A.Contenido local={localA} />}
          escenaB={saltando ? <B.Contenido local={localB} /> : null}
          camaraA={A.camara(localA, aspecto)}
          camaraB={B.camara(localB, aspecto)}
          mascaraX={A.mascara}
          mascaraXB={B.mascara}
          antes={a === 0 && !saltando ? parpadeo(t) : 0}
          muestras={width > 3000 ? 0 : 2}
        />
        {t >= inicioCierre ? <QCierre local={t - inicioCierre} ancho={width} alto={height} /> : null}
        <CadenaPost
          ancho={width}
          alto={height}
          cuadro={cuadro}
          multisampling={t >= inicioCierre ? (width > 3000 ? 2 : 4) : 0}
        />
      </ThreeCanvas>
      <Textos t={t} ancho={width} alto={height} />
      {marcaDeTiempo ? <MarcaDeTiempo cuadro={cuadro} fps={fps} u={u} /> : null}
    </AbsoluteFill>
  );
};
