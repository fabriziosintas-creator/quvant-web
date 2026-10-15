import React from "react";
import { type Plano, camaraDeParadas, puntoDelPlano } from "./comun";
import { Captura, type Escena, MASCARA_TEXTO } from "./piezas";

/**
 * 0:14–0:22 · Yunque. Las capturas reales en planos de vidrio, en fila; la
 * cámara va de una a otra con una órbita mínima (menos de 6°): ingreso
 * (se completa el rol Mostrador y se toca "Ingresar") → tablero (se acerca
 * a la cifra del día y a "Sincronizado") → inventario (filtro "Bajo el
 * mínimo") → mostrador (se agrega un taladro y se ve el total). Al final se
 * aleja y se ven las cuatro: de ahí sale el salto a Forja.
 *
 * Los segundos son locales: 0 = arranca el salto que revela la escena (13,05 s del spot).
 */

const fila = (i: number, y: number): Plano => ({ posicion: [i * 9.4, y, -i * 0.9], giro: -0.1, ancho: 8, aspecto: 16 / 9 });
const INGRESO = fila(0, 0);
const TABLERO = fila(1, 0.3);
const INVENTARIO = fila(2, -0.2);
const MOSTRADOR = fila(3, 0.2);

/** La imagen vigente de una pantalla que cambia de estado: [desde, nombre]. */
export const estado = (local: number, estados: [number, string][]) =>
  estados.reduce((vigente, [desde, nombre]) => (local >= desde ? nombre : vigente), estados[0][1]);

const Contenido: React.FC<{ local: number }> = ({ local }) => (
  <>
    <Captura
      plano={INGRESO}
      nombre={estado(local, [
        [0, "yunque-01-ingresar-quieto"],
        [1.65, "yunque-02-ingresar-autocompletado"],
        [2.15, "yunque-03-ingresar-boton"],
      ])}
    />
    <Captura plano={TABLERO} nombre="yunque-04-tablero-arriba" />
    <Captura
      plano={INVENTARIO}
      nombre={estado(local, [
        [0, "yunque-07-inventario"],
        [6.55, "yunque-08-inventario-bajo-minimo"],
      ])}
    />
    <Captura
      plano={MOSTRADOR}
      nombre={estado(local, [
        [0, "yunque-10-mostrador"],
        [8.25, "yunque-11-mostrador-busqueda"],
        [8.75, "yunque-12-mostrador-carrito"],
      ])}
    />
  </>
);

const PANTALLA: [number, number] = [0.66, 0.5];
const MEDIO: [number, number, number] = [14.1, 0.05, -1.35];

export const YUNQUE: Escena = {
  id: "yunque",
  Contenido,
  camara: (local, aspecto) =>
    camaraDeParadas(
      [
        { t: 0, punto: puntoDelPlano(INGRESO, [0.5, 0.5]), pantalla: PANTALLA, distancia: 13.5, giro: 0.06 },
        { t: 2.55, punto: puntoDelPlano(INGRESO, [0.45, 0.48]), pantalla: PANTALLA, distancia: 11.5, giro: 0.03, curva: "lineal" },
        { t: 3.15, punto: puntoDelPlano(TABLERO, [0.5, 0.5]), pantalla: PANTALLA, distancia: 12.5, giro: 0 },
        // La cifra del día ("$ 3,1 M" en la captura) y "Sincronizado", arriba a la derecha.
        { t: 4.25, punto: puntoDelPlano(TABLERO, [0.173, 0.327]), pantalla: [0.66, 0.52], distancia: 4.2, giro: -0.03 },
        { t: 4.45, punto: puntoDelPlano(TABLERO, [0.18, 0.33]), pantalla: [0.66, 0.52], distancia: 4.0, giro: -0.035, curva: "lineal" },
        { t: 5.3, punto: puntoDelPlano(TABLERO, [0.917, 0.029]), pantalla: [0.7, 0.45], distancia: 3.6, giro: 0.02 },
        { t: 5.5, punto: puntoDelPlano(TABLERO, [0.91, 0.031]), pantalla: [0.7, 0.45], distancia: 3.45, giro: 0.025, curva: "lineal" },
        { t: 6.1, punto: puntoDelPlano(INVENTARIO, [0.5, 0.5]), pantalla: PANTALLA, distancia: 12.5, giro: 0.02 },
        { t: 7.45, punto: puntoDelPlano(INVENTARIO, [0.42, 0.42]), pantalla: PANTALLA, distancia: 9.5, giro: -0.02, curva: "lineal" },
        { t: 7.95, punto: puntoDelPlano(MOSTRADOR, [0.5, 0.5]), pantalla: PANTALLA, distancia: 12.5, giro: 0.02 },
        { t: 8.6, punto: puntoDelPlano(MOSTRADOR, [0.6, 0.45]), pantalla: PANTALLA, distancia: 10.5, giro: 0, curva: "lineal" },
        { t: 9.25, punto: puntoDelPlano(MOSTRADOR, [0.86, 0.42]), pantalla: [0.68, 0.5], distancia: 7.5, giro: -0.02 },
        { t: 10.0, punto: MEDIO, pantalla: [0.6, 0.5], distancia: 40, giro: 0.09 },
        { t: 10.95, punto: MEDIO, pantalla: [0.6, 0.5], distancia: 42, giro: 0.095, curva: "lineal" },
      ],
      local,
      aspecto,
    ),
  mascara: MASCARA_TEXTO,
};
