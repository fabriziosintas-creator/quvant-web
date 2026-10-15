import { useFrame } from "@react-three/fiber";
import React, { use, useEffect, useState } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { cargarFuentes } from "../brand/fuentes";
import { GlassScreen, GlassSecuencia, PlanoDeVidrio } from "../three/GlassScreen";
import type { Camara } from "../transitions/Jump";
import { type Plano, cuadroDeSecuencia } from "./comun";
import { LIENZO, dibujarDiseno } from "./lienzoDiseno";

/**
 * Las piezas con las que se arman las escenas del spot (todas dentro del
 * lienzo 3D, así pasan por el salto y por la gradación).
 */

export type PropsEscena = { local: number };

/** Una escena del spot: su contenido 3D, su cámara y su máscara hacia la izquierda. */
export type Escena = {
  id: string;
  Contenido: React.FC<PropsEscena>;
  camara: (local: number, aspecto: number) => Camara;
  /** Dónde se funde el contenido hacia la izquierda (el lugar de los textos). */
  mascara: [number, number];
};

export const SIN_MASCARA: [number, number] = [0, 0];
/** La máscara de las escenas con título y bajada a la izquierda: el contenido se apaga antes del texto. */
export const MASCARA_TEXTO: [number, number] = [0.3, 0.55];
/** La de las escenas con solo una etiqueta chica abajo a la izquierda. */
export const MASCARA_ETIQUETA: [number, number] = [0.02, 0.3];

/** Los tramos de stock de public/spot/stock (npm run preparar-spot). */
export const STOCK = {
  codigo: { carpeta: "codigo-178565", fps: 30, cuadros: 300, aspecto: 16 / 9 },
  teclado: { carpeta: "teclado-44423", fps: 25, cuadros: 250, aspecto: 16 / 9 },
  hud: { carpeta: "diseno-52922", fps: 30, cuadros: 240, aspecto: 16 / 9 },
  geometria: { carpeta: "geometria-25380", fps: 30, cuadros: 240, aspecto: 16 / 9 },
  deposito: { carpeta: "deposito-197209", fps: 25, cuadros: 125, aspecto: 16 / 9 },
  forja3d: { carpeta: "forja-3d", fps: 30, cuadros: 150, aspecto: 1.6 },
} as const;

type PropsPlano = { plano: Plano; opacidad?: number; saturacion?: number; corrimiento?: [number, number, number] };

function ubicacion(plano: Plano, corrimiento: [number, number, number] = [0, 0, 0]) {
  return {
    ancho: plano.ancho,
    posicion: plano.posicion.map((x, i) => x + corrimiento[i]) as [number, number, number],
    rotacion: [0, plano.giro, 0] as [number, number, number],
  };
}

/** Una captura de Yunque o Forja (public/spot/capturas). */
export const Captura: React.FC<PropsPlano & { nombre: string }> = ({ nombre, plano, opacidad = 1, saturacion = 1, corrimiento }) => (
  <GlassScreen
    src={staticFile(`spot/capturas/${nombre}.webp`)}
    {...ubicacion(plano, corrimiento)}
    opacidad={opacidad}
    saturacion={saturacion}
  />
);

/** Un tramo de stock en el segundo t (desde: segundo del tramo en el que arranca). */
export const Stock: React.FC<PropsPlano & { clip: keyof typeof STOCK; t: number; desde?: number }> = ({
  clip,
  t,
  desde = 0,
  plano,
  opacidad = 1,
  saturacion = 1,
  corrimiento,
}) => {
  const s = STOCK[clip];
  return (
    <GlassSecuencia
      url={staticFile(cuadroDeSecuencia(`spot/stock/${s.carpeta}`, Math.max(0, t), s.fps, s.cuadros, desde))}
      aspecto={s.aspecto}
      {...ubicacion(plano, corrimiento)}
      opacidad={opacidad}
      saturacion={saturacion}
    />
  );
};

/**
 * La herramienta de diseño (lienzoDiseno.ts) como textura: se redibuja en
 * cada cuadro antes de que el salto dibuje las escenas. Espera a las
 * fuentes suspendiendo: ThreeCanvas retiene el cuadro.
 */
export const LienzoDiseno: React.FC<PropsPlano & { t: number }> = ({ t, plano, opacidad = 1, corrimiento }) => {
  use(cargarFuentes());
  const [{ lienzo, textura }] = useState(() => {
    const c = document.createElement("canvas");
    c.width = LIENZO.ancho;
    c.height = LIENZO.alto;
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.NoColorSpace;
    tx.anisotropy = 8;
    return { lienzo: c, textura: tx };
  });

  useEffect(() => () => textura.dispose(), [textura]);

  useFrame(() => {
    dibujarDiseno(lienzo.getContext("2d")!, t);
    textura.needsUpdate = true;
  }, -2);

  return <PlanoDeVidrio textura={textura} aspecto={LIENZO.ancho / LIENZO.alto} {...ubicacion(plano, corrimiento)} opacidad={opacidad} />;
};
