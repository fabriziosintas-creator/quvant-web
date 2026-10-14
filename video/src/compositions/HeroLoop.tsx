import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, TIEMPO } from "../brand/tokens";
import { GrillaDePuntos } from "../three/DotGrid";
import { GlassScreen, GlassSecuencia } from "../three/GlassScreen";
import { CadenaPost } from "../three/Gradacion";
import { QChrome, ESCALA_Q } from "../three/QChrome";
import { Salto3D, cuadrosDelSalto } from "../transitions/Jump";

/**
 * hero-loop · 24 s, sin audio, loop perfecto: el fondo del hero del sitio.
 *
 * - El tercio izquierdo (donde el sitio pone QUVANT, la bajada y los
 *   botones) queda negro con la grilla al 60 %; todo lo demás se funde a
 *   negro hacia la izquierda. El degradé del brief (de x = 0 a x = 45 %) va
 *   corrido a 18–50 %: así el tercio izquierdo queda negro casi puro, que
 *   es lo que el brief pide para el texto.
 * - La Q cromada es la protagonista: una vuelta completa en 24 s sobre el
 *   eje vertical, con ±12° de inclinación.
 * - Detrás, al 25–35 % y desenfocadas, pasan capturas de Yunque y Forja en
 *   planos de vidrio y fragmentos de stock de código y diseño.
 * - Cada 6 s, un salto del punto cambia lo que hay detrás. Los saltos
 *   terminan exactamente en 6, 12, 18 y 24 s.
 * - Nada de texto.
 *
 * Todo es función del segundo del loop (cuadro / fps, módulo 24): el
 * cuadro 1440 es el cuadro 0. scripts/verify-loop.ts lo comprueba.
 */

export const HERO = { segundos: TIEMPO.heroLoopSegundos, fps: TIEMPO.fps };
export const HERO_CUADROS = HERO.segundos * HERO.fps;

const TRAMO = 6;
const OPACIDAD_CAPTURA = 0.32;
const OPACIDAD_STOCK = 0.26;
const CUADROS_STOCK = 105; // 7 s a 15 fps (scripts/preparar-hero.ts)

type Plano =
  | { tipo: "captura"; nombre: string; ancho: number; posicion: [number, number, number]; giro: number }
  | {
      tipo: "stock";
      clip: string;
      ancho: number;
      posicion: [number, number, number];
      giro: number;
      /** Si el clip es muy claro, menos opacidad. */
      opacidad?: number;
    };

type Tramo = {
  planos: Plano[];
  /** El salto que lo revela: de dónde sale el punto y dónde aterriza (fracción del cuadro). */
  salto: { origen: [number, number]; destino: [number, number] };
};

// Cada tramo: una captura grande al fondo, una más chica a la derecha y un
// fragmento de stock más cerca, hacia la izquierda (ahí lo come el degradé).
const TRAMOS: Tramo[] = [
  {
    planos: [
      { tipo: "captura", nombre: "yunque-04-tablero-arriba", ancho: 9.6, posicion: [3.6, 1.1, -6.5], giro: -0.22 },
      { tipo: "captura", nombre: "forja-06-constelacion", ancho: 6.4, posicion: [7.0, -2.6, -4.2], giro: -0.38 },
      { tipo: "stock", clip: "codigo-178565", ancho: 6, posicion: [-1.0, -2.2, -3.6], giro: 0.3 },
    ],
    salto: { origen: [0.49, 0.84], destino: [0.86, 0.16] },
  },
  {
    planos: [
      { tipo: "captura", nombre: "forja-05-mapa-1200x", ancho: 10, posicion: [3.2, 0.8, -7], giro: -0.18 },
      { tipo: "captura", nombre: "yunque-07-inventario", ancho: 6, posicion: [7.2, 2.6, -4.6], giro: -0.42 },
      { tipo: "stock", clip: "diseno-52922", ancho: 6, posicion: [0.2, -2.8, -3.4], giro: 0.22 },
    ],
    salto: { origen: [0.47, 0.86], destino: [0.92, 0.2] },
  },
  {
    planos: [
      { tipo: "captura", nombre: "yunque-10-mostrador", ancho: 9, posicion: [4.2, -0.6, -6.8], giro: -0.26 },
      { tipo: "captura", nombre: "forja-08-sucursal-estanterias", ancho: 6.8, posicion: [6.5, 2.4, -4.4], giro: -0.34 },
      { tipo: "stock", clip: "teclado-44423", ancho: 4.8, posicion: [1.2, 2.7, -4.2], giro: 0.24, opacidad: 0.12 },
    ],
    salto: { origen: [0.5, 0.82], destino: [0.95, 0.3] },
  },
  {
    planos: [
      { tipo: "captura", nombre: "forja-10-sala-de-control", ancho: 9.8, posicion: [3.4, 1.0, -6.6], giro: -0.2 },
      { tipo: "captura", nombre: "yunque-13-servicio-tecnico", ancho: 6.2, posicion: [7.0, -2.4, -4.4], giro: -0.4 },
      { tipo: "stock", clip: "geometria-25380", ancho: 6, posicion: [-0.6, -2.4, -3.5], giro: 0.26 },
    ],
    salto: { origen: [0.48, 0.88], destino: [0.89, 0.24] },
  },
];

const modulo = (x: number, m: number) => ((x % m) + m) % m;

/** Cuándo termina el salto que revela el tramo k: 6, 12, 18 y 24 (≡ 0). */
const finDelSalto = (k: number) => (k === 0 ? HERO.segundos : k * TRAMO);

/** Qué se ve en el segundo t: la escena A, la B y cuánto va del salto. */
function momento(t: number, duracionSalto: number) {
  for (let k = 0; k < TRAMOS.length; k++) {
    const fin = finDelSalto(k);
    const inicio = fin - duracionSalto;
    if (t >= inicio && t < fin) {
      return { a: (k + TRAMOS.length - 1) % TRAMOS.length, b: k, progreso: (t - inicio) / duracionSalto };
    }
  }
  const a = Math.floor(t / TRAMO) % TRAMOS.length;
  return { a, b: (a + 1) % TRAMOS.length, progreso: 0 };
}

/** El tiempo propio de un tramo: empieza cuando arranca el salto que lo revela. */
const tiempoDelTramo = (k: number, t: number, duracionSalto: number) =>
  modulo(t - (finDelSalto(k) - duracionSalto), HERO.segundos);

const Escena: React.FC<{ indice: number; local: number }> = ({ indice, local }) => {
  const tramo = TRAMOS[indice];
  // Los planos pasan despacio hacia la izquierda y giran apenas.
  const deriva = -0.07 * local;
  return (
    <>
      {tramo.planos.map((plano) => {
        const posicion: [number, number, number] = [plano.posicion[0] + deriva, plano.posicion[1], plano.posicion[2]];
        const rotacion: [number, number, number] = [0, plano.giro + 0.012 * local, 0];
        if (plano.tipo === "captura") {
          return (
            <GlassScreen
              key={plano.nombre}
              src={staticFile(`hero/capturas/${plano.nombre}.webp`)}
              ancho={plano.ancho}
              posicion={posicion}
              rotacion={rotacion}
              opacidad={OPACIDAD_CAPTURA}
            />
          );
        }
        const cuadro = Math.min(CUADROS_STOCK, Math.floor(local * 15) + 1);
        return (
          <GlassSecuencia
            key={plano.clip}
            url={staticFile(`hero/stock/${plano.clip}/c${String(cuadro).padStart(4, "0")}.jpg`)}
            aspecto={16 / 9}
            ancho={plano.ancho}
            posicion={posicion}
            rotacion={rotacion}
            opacidad={plano.opacidad ?? OPACIDAD_STOCK}
            saturacion={0.85}
          />
        );
      })}
    </>
  );
};

export const HeroLoop: React.FC = () => {
  const cuadro = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = modulo(cuadro / fps, HERO.segundos);
  const salto = cuadrosDelSalto(fps);
  const duracionSalto = salto.total / fps;
  const { a, b, progreso } = momento(t, duracionSalto);

  // El punto sale de un punto de la grilla: se lo acomoda a la grilla de ese cuadro.
  const paso = Math.round((48 * width) / 3840);
  const angulo = (2 * Math.PI * t) / HERO.segundos;
  const desplazamiento = [Math.cos(angulo) * width * 0.008, Math.sin(angulo) * height * 0.008];
  const alPunto = ([fx, fy]: [number, number]): [number, number] => {
    const x = fx * width;
    const y = (1 - fy) * height; // la grilla cuenta desde abajo
    const sx = Math.round((x + desplazamiento[0] - paso / 2) / paso) * paso + paso / 2 - desplazamiento[0];
    const sy = Math.round((y + desplazamiento[1] - paso / 2) / paso) * paso + paso / 2 - desplazamiento[1];
    return [sx, height - sy];
  };
  const { origen, destino } = TRAMOS[b].salto;

  // La Q: una vuelta en 24 s y ±12° de inclinación, las dos periódicas.
  const giro = angulo;
  const inclinacion = ((12 * Math.PI) / 180) * Math.sin(angulo);

  return (
    <AbsoluteFill style={{ background: COLOR.negro }}>
      <ThreeCanvas width={width} height={height} flat linear camera={{ position: [0, 0, 9], fov: 40 }}>
        <GrillaDePuntos ancho={width} alto={height} periodo={HERO.segundos} izquierda={0.6} />
        <Salto3D
          ancho={width}
          alto={height}
          progreso={progreso}
          corte={salto.corte}
          origen={alPunto(origen)}
          destino={[destino[0] * width, destino[1] * height]}
          lado={Math.round((22 * width) / 3840)}
          escenaA={<Escena indice={a} local={tiempoDelTramo(a, t, duracionSalto)} />}
          escenaB={<Escena indice={b} local={tiempoDelTramo(b, t, duracionSalto)} />}
          camaraA={{ posicion: [0, 0, 9], fov: 40 }}
          camaraB={{ posicion: [0, 0, 9], fov: 40 }}
          desenfoque={(7 * width) / 1920}
          mascaraX={[0.18, 0.5]}
          muestras={0}
        />
        <QChrome posicion={[2.25, 0.05, 0]} rotacion={[inclinacion, giro]} escala={ESCALA_Q * 1.05} orden={10} />
        {/* A 4K, menos muestras: la memoria de la GPU no alcanza para varias pestañas. */}
        <CadenaPost
          ancho={width}
          alto={height}
          cuadro={cuadro}
          periodo={HERO.segundos * fps}
          multisampling={width > 3000 ? 2 : 4}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
