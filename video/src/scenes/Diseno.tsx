import React from "react";
import { type Plano, camaraDeParadas, puntoDelPlano } from "./comun";
import { type Escena, LienzoDiseno, MASCARA_ETIQUETA, Stock } from "./piezas";

/**
 * 0:08–0:12 · 02 · Diseño. La herramienta de diseño (dibujada en código:
 * se arma el tablero de Yunque con el cursor), una interfaz técnica detrás
 * y geometría de líneas al fondo. De 0:12 a 0:13 la cámara se aleja y
 * queda la grilla: de ahí sale el salto a Yunque.
 */

const LIENZO: Plano = { posicion: [0, 0, 0], giro: -0.12, ancho: 10, aspecto: 16 / 9 };
const HUD: Plano = { posicion: [7.6, 2.8, -4.5], giro: -0.3, ancho: 7, aspecto: 16 / 9 };
const GEOMETRIA: Plano = { posicion: [-1, -0.5, -10], giro: 0, ancho: 30, aspecto: 16 / 9 };

/** Cuándo empieza a moverse el cursor: apenas termina de abrirse la escena. */
const INICIO_DISENO = 0.8;

const Contenido: React.FC<{ local: number }> = ({ local }) => (
  <>
    <Stock clip="geometria" t={local} plano={GEOMETRIA} opacidad={0.55} saturacion={0.25} />
    <Stock clip="hud" t={local} plano={HUD} opacidad={0.5} saturacion={0.15} />
    <LienzoDiseno t={local - INICIO_DISENO} plano={LIENZO} />
  </>
);

const centro = puntoDelPlano(LIENZO, [0.5, 0.5]);

export const DISENO: Escena = {
  id: "diseno",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: centro, pantalla: [0.58, 0.5], distancia: 11.5, giro: 0.07 },
        { t: 4.95, punto: puntoDelPlano(LIENZO, [0.47, 0.44]), pantalla: [0.6, 0.5], distancia: 8.6, giro: -0.02, curva: "lineal" },
        { t: 6.0, punto: centro, pantalla: [0.62, 0.48], distancia: 36, giro: 0.1 },
        { t: 6.95, punto: centro, pantalla: [0.62, 0.48], distancia: 40, giro: 0.11, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: MASCARA_ETIQUETA,
};
