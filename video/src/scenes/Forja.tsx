import React from "react";
import { type Plano, camaraDeParadas, puntoDelPlano } from "./comun";
import { Captura, type Escena, MASCARA_TEXTO, Stock } from "./piezas";

/**
 * 0:24–0:33 · Forja. La red en el mapa con la transferencia en tránsito →
 * la Constelación (el plano hero, con la órbita más amplia) → la sucursal
 * por dentro en 3D (de la toma en vivo: la cámara de Forja se mueve sola
 * entre las estanterías) → la Sala de control, acercándose a los KPIs.
 *
 * Los segundos son locales: 0 = arranca el salto que revela la escena (23,05 s del spot).
 */

const fila = (i: number, y: number, aspecto = 16 / 9): Plano => ({
  posicion: [i * 9.4, y, -i * 0.9],
  giro: -0.1,
  ancho: 8,
  aspecto,
});
const MAPA = fila(0, 0);
const CONSTELACION = fila(1, -0.25);
const SUCURSAL = fila(2, 0.2, 1.6);
const SALA = fila(3, -0.1);

/** La toma de la sucursal en 3D arranca un poco antes de que la cámara llegue. */
const INICIO_SUCURSAL = 5.0;

const Contenido: React.FC<{ local: number }> = ({ local }) => (
  <>
    <Captura plano={MAPA} nombre="forja-05-mapa-1200x" />
    <Captura plano={CONSTELACION} nombre="forja-06-constelacion" />
    <Stock clip="forja3d" t={local - INICIO_SUCURSAL} plano={SUCURSAL} />
    <Captura plano={SALA} nombre="forja-10-sala-de-control" />
  </>
);

const PANTALLA: [number, number] = [0.66, 0.5];

export const FORJA: Escena = {
  id: "forja",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: puntoDelPlano(MAPA, [0.5, 0.5]), pantalla: PANTALLA, distancia: 13.5, giro: 0.06 },
        // Hacia la transferencia en tránsito (la curva entre Sucursal Norte y Casa Central).
        { t: 2.55, punto: puntoDelPlano(MAPA, [0.58, 0.55]), pantalla: PANTALLA, distancia: 9.5, giro: 0, curva: "lineal" },
        { t: 3.05, punto: puntoDelPlano(CONSTELACION, [0.5, 0.47]), pantalla: PANTALLA, distancia: 12.5, giro: -0.05 },
        { t: 4.85, punto: puntoDelPlano(CONSTELACION, [0.5, 0.47]), pantalla: PANTALLA, distancia: 10, giro: 0.07, curva: "lineal" },
        { t: 5.35, punto: puntoDelPlano(SUCURSAL, [0.5, 0.5]), pantalla: PANTALLA, distancia: 12.5, giro: 0 },
        { t: 7.15, punto: puntoDelPlano(SUCURSAL, [0.48, 0.45]), pantalla: PANTALLA, distancia: 10.5, giro: -0.03, curva: "lineal" },
        { t: 7.65, punto: puntoDelPlano(SALA, [0.5, 0.5]), pantalla: PANTALLA, distancia: 12.5, giro: 0.03 },
        // "Toda la red": los KPIs abajo a la izquierda de la sala.
        { t: 9.95, punto: puntoDelPlano(SALA, [0.22, 0.78]), pantalla: PANTALLA, distancia: 8, giro: -0.02, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: MASCARA_TEXTO,
};
