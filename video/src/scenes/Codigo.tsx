import React from "react";
import { type Plano, camaraDeParadas, curvaMarca, tramo } from "./comun";
import { type Escena, MASCARA_ETIQUETA, Stock } from "./piezas";

/**
 * 0:03–0:08 · 01 · Programación. Código en pantalla oscura casi a cuadro
 * completo; la cámara se aleja y entran las manos en el teclado, más cerca.
 * Grading frío: el verde del clip se apaga casi del todo.
 */

const CODIGO: Plano = { posicion: [0, 0, 0], giro: 0, ancho: 14, aspecto: 16 / 9 };
const TECLADO: Plano = { posicion: [4.4, -2.0, 2.4], giro: -0.2, ancho: 5.6, aspecto: 16 / 9 };

const Contenido: React.FC<{ local: number }> = ({ local }) => {
  const entrada = curvaMarca(tramo(local, 1.7, 2.7));
  return (
    <>
      <Stock clip="codigo" t={local} desde={1} plano={CODIGO} saturacion={0.12} />
      {local > 1.6 ? (
        <Stock clip="teclado" t={local - 1.6} plano={TECLADO} saturacion={0.15} corrimiento={[(1 - entrada) * 9, 0, 0]} />
      ) : null}
    </>
  );
};

export const CODIGO_ESCENA: Escena = {
  id: "codigo",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: [0, 0, 0], pantalla: [0.5, 0.5], distancia: 10.5, giro: 0.05 },
        { t: 5.95, punto: [1.2, -0.5, 0], pantalla: [0.58, 0.5], distancia: 17.5, giro: -0.05, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: MASCARA_ETIQUETA,
};
