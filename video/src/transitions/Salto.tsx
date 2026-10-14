import React from "react";
import { Easing, interpolate } from "remotion";
import { COLOR } from "../brand/tokens";

/**
 * "El salto": la única transición del video (manual, recurso gráfico).
 *
 * - VueloDelPunto: un punto de la grilla se desprende y viaja en arco
 *   (Bézier cuadrática, 420 ms, cubic-bezier(.2,.8,.2,1)); en el aire pasa
 *   de círculo a cuadrado.
 * - Revelado: al aterrizar, la escena siguiente se abre desde ese punto
 *   con una máscara de círculo a cuadrado, bordes duros, sin difuminar.
 */

const curva = Easing.bezier(0.2, 0.8, 0.2, 1);

type Punto = [number, number];

export const VueloDelPunto: React.FC<{
  progreso: number;
  origen: Punto;
  destino: Punto;
  lado: number;
}> = ({ progreso, origen, destino, lado }) => {
  const t = curva(Math.min(1, Math.max(0, progreso)));
  // El punto de control, por encima del tramo: el arco del salto.
  const control: Punto = [
    (origen[0] + destino[0]) / 2,
    Math.min(origen[1], destino[1]) - Math.abs(destino[0] - origen[0]) * 0.35,
  ];
  const x = (1 - t) ** 2 * origen[0] + 2 * (1 - t) * t * control[0] + t ** 2 * destino[0];
  const y = (1 - t) ** 2 * origen[1] + 2 * (1 - t) * t * control[1] + t ** 2 * destino[1];
  const tamano = interpolate(t, [0, 1], [lado * 0.8, lado * 1.2]);

  return (
    <div
      style={{
        position: "absolute",
        left: x - tamano / 2,
        top: y - tamano / 2,
        width: tamano,
        height: tamano,
        background: COLOR.blanco,
        // De círculo a cuadrado durante el vuelo.
        borderRadius: `${interpolate(t, [0, 0.85], [50, 0], { extrapolateRight: "clamp" })}%`,
      }}
    />
  );
};

/**
 * Muestra `children` (que ocupa todo el cuadro) a través de una ventana
 * que crece desde `centro`: redonda al principio, cuadrada al final.
 */
export const Revelado: React.FC<{
  progreso: number;
  centro: Punto;
  ancho: number;
  alto: number;
  children: React.ReactNode;
}> = ({ progreso, centro, ancho, alto, children }) => {
  if (progreso >= 1) return <>{children}</>;
  const p = Easing.inOut(Easing.cubic)(Math.max(0, progreso));
  const lejos = Math.max(
    Math.hypot(centro[0], centro[1]),
    Math.hypot(ancho - centro[0], centro[1]),
    Math.hypot(centro[0], alto - centro[1]),
    Math.hypot(ancho - centro[0], alto - centro[1]),
  );
  const medio = p * lejos;
  const radio = medio * (1 - p);

  return (
    <div
      style={{
        position: "absolute",
        left: centro[0] - medio,
        top: centro[1] - medio,
        width: medio * 2,
        height: medio * 2,
        borderRadius: radio,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: medio - centro[0], top: medio - centro[1], width: ancho, height: alto }}>
        {children}
      </div>
    </div>
  );
};
