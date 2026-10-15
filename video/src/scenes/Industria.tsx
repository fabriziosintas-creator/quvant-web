import React from "react";
import { type Plano, camaraDeParadas } from "./comun";
import { type Escena, Stock } from "./piezas";

/**
 * 0:33–0:36 · Industria. Un depósito con estanterías, muy desaturado, con
 * la cámara entrando por el pasillo. El texto va a la izquierda, sobre la
 * grilla: la máscara se come más de media pantalla.
 */

const DEPOSITO: Plano = { posicion: [0, 0, 0], giro: 0, ancho: 16, aspecto: 16 / 9 };

const Contenido: React.FC<{ local: number }> = ({ local }) => (
  <Stock clip="deposito" t={local} plano={DEPOSITO} saturacion={0.08} />
);

export const INDUSTRIA: Escena = {
  id: "industria",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: [0, 0, 0], pantalla: [0.56, 0.5], distancia: 13.5, giro: 0.03 },
        { t: 3.95, punto: [0.6, 0, 0], pantalla: [0.6, 0.5], distancia: 11.5, giro: -0.02, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: [0.28, 0.78],
};
