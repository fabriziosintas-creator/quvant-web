import React from "react";
import { type Plano, camaraDeParadas } from "./comun";
import { type Escena, Stock } from "./piezas";

/**
 * 0:36–0:40 · Método. Manos trabajando y código, en dos planos a la
 * derecha; a la izquierda, las dos frases y los tres puntos cuadrados (las
 * fases) que aparecen de a uno (los pone SpotCompleto).
 */

const TECLADO: Plano = { posicion: [2.8, 0.9, -1.2], giro: -0.12, ancho: 7.2, aspecto: 16 / 9 };
const CODIGO: Plano = { posicion: [6.6, -1.7, 0.8], giro: -0.2, ancho: 5.6, aspecto: 16 / 9 };

const Contenido: React.FC<{ local: number }> = ({ local }) => (
  <>
    <Stock clip="teclado" t={local} desde={5} plano={TECLADO} saturacion={0.15} />
    <Stock clip="codigo" t={local} desde={4} plano={CODIGO} saturacion={0.12} />
  </>
);

export const METODO: Escena = {
  id: "metodo",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: [4.4, -0.2, 0], pantalla: [0.72, 0.5], distancia: 13, giro: 0.05 },
        { t: 4.95, punto: [4.4, -0.2, 0], pantalla: [0.72, 0.5], distancia: 11.5, giro: -0.04, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: [0.28, 0.62],
};
