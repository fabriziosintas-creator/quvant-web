"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, type RefObject } from "react";
// El acero de la marca (--color-acero en globals.css).
const ACERO_HEX = "#9C9CA3";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * El paso de la portada a los canales: los puntos de la grilla de la marca
 * se desordenan apenas, viajan y se acomodan sobre los cables que llevan a
 * cada canal (en la computadora) o sobre la línea que los une (en el
 * celular). Va atado al scroll: al bajar se arman, al subir se desarman.
 * Cuando los puntos llegan, aparecen los cables de verdad y los puntos se
 * apagan.
 *
 * Es un lienzo 2D con unos cien cuadraditos: se dibuja solo cuando cambia
 * el scroll. En vista texto o con "menos movimiento" no corre y los cables
 * están desde el principio.
 */

export type Destino = { x: number; y: number; color: string };

type Punto = {
  desdeX: number;
  desdeY: number;
  hastaX: number;
  hastaY: number;
  color: [number, number, number];
  retraso: number;
  curva: number;
  /** Los puntos de la grilla que no van a ningún cable: solo se apagan. */
  sobra: boolean;
};

const PASO_GRILLA = 28;
const ACERO = rgb(ACERO_HEX);

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** El tamaño del lienzo en píxeles reales (afuera del hook: el lienzo llega por ref). */
function dimensionar(lienzo: HTMLCanvasElement, ancho: number, alto: number) {
  lienzo.width = ancho;
  lienzo.height = alto;
}

/** La curva de la marca (la misma de --ease-quvant, aproximada). */
const curva = (t: number) => 1 - Math.pow(1 - t, 3);
const tramo = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Un azar que da siempre lo mismo: los puntos no cambian de lugar entre visitas. */
function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Puntos de una curva cúbica (los mismos cables que dibuja el SVG). */
export function puntosDeCurva(
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  [x3, y3]: [number, number],
  cantidad: number,
) {
  return Array.from({ length: cantidad }, (_, i) => {
    const t = i / (cantidad - 1);
    const u = 1 - t;
    return {
      x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
    };
  });
}

export function usePuntosACables({
  lienzo,
  disparador,
  destinos,
  alAvanzar,
  activo,
  inicio = "top 95%",
  fin = "top 40%",
  version = "",
  lado = 2,
}: {
  lienzo: RefObject<HTMLCanvasElement | null>;
  disparador: RefObject<HTMLElement | null>;
  /** Dónde termina cada punto, en coordenadas del lienzo (se piden de nuevo al cambiar de tamaño). */
  destinos: (lienzo: DOMRect) => Destino[];
  /** El avance (0 a 1), para encender los cables de verdad al final. */
  alAvanzar: (avance: number) => void;
  activo: boolean;
  inicio?: string;
  fin?: string;
  /** Cambia cuando cambian los cables (se vuelven a calcular los destinos). */
  version?: string;
  /** El lado de cada punto, en px (en el celular, un poco más grandes: la pantalla es chica). */
  lado?: number;
}) {
  useEffect(() => {
    const canvas = lienzo.current;
    const gatillo = disparador.current;
    if (!activo || !canvas || !gatillo) {
      alAvanzar(1);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alAvanzar(1);
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let puntos: Punto[] = [];
    let avance = 0;

    const dibujar = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (avance >= 0.999) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const apagado = 1 - tramo(avance, 0.86, 1);
      for (const p of puntos) {
        if (p.sobra) {
          const alfa = (1 - tramo(avance, 0, 0.45)) * 0.5;
          if (alfa <= 0) continue;
          ctx.globalAlpha = alfa;
          ctx.fillStyle = `rgb(${ACERO[0]},${ACERO[1]},${ACERO[2]})`;
          ctx.fillRect(p.desdeX - lado / 2, p.desdeY - lado / 2, lado, lado);
          continue;
        }
        const t = curva(tramo(avance, p.retraso, p.retraso + 0.55));
        // Viajan con una comba (no en línea recta), como si los tirara el cable.
        const x = p.desdeX + (p.hastaX - p.desdeX) * t + Math.sin(Math.PI * t) * p.curva;
        const y = p.desdeY + (p.hastaY - p.desdeY) * t;
        const tamano = lado + t;
        const r = Math.round(ACERO[0] + (p.color[0] - ACERO[0]) * t);
        const g = Math.round(ACERO[1] + (p.color[1] - ACERO[1]) * t);
        const b = Math.round(ACERO[2] + (p.color[2] - ACERO[2]) * t);
        ctx.globalAlpha = (0.5 + 0.5 * t) * apagado;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x - tamano / 2, y - tamano / 2, tamano, tamano);
      }
      ctx.globalAlpha = 1;
    };

    const armar = () => {
      const caja = canvas.getBoundingClientRect();
      if (caja.width === 0 || caja.height === 0) return;
      dimensionar(canvas, Math.round(caja.width * dpr), Math.round(caja.height * dpr));
      const objetivos = destinos(caja);
      // La grilla de la marca: un punto cada PASO_GRILLA, mezclados.
      const nodos: Array<{ x: number; y: number }> = [];
      for (let y = PASO_GRILLA / 2; y < caja.height; y += PASO_GRILLA) {
        for (let x = PASO_GRILLA / 2; x < caja.width; x += PASO_GRILLA) nodos.push({ x, y });
      }
      const r = azar(11);
      for (let i = nodos.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [nodos[i], nodos[j]] = [nodos[j], nodos[i]];
      }
      puntos = objetivos.map((o, i) => {
        const n = nodos[i % nodos.length];
        return {
          desdeX: n.x,
          desdeY: n.y,
          hastaX: o.x,
          hastaY: o.y,
          color: rgb(o.color),
          retraso: r() * 0.35,
          curva: (r() - 0.5) * 70,
          sobra: false,
        };
      });
      const sobrantes = nodos.slice(objetivos.length, objetivos.length * 3);
      for (const n of sobrantes) {
        puntos.push({ desdeX: n.x, desdeY: n.y, hastaX: n.x, hastaY: n.y, color: ACERO, retraso: 0, curva: 0, sobra: true });
      }
      dibujar();
    };

    armar();
    const disparo = ScrollTrigger.create({
      trigger: gatillo,
      start: inicio,
      end: fin,
      onUpdate: (estado) => {
        avance = estado.progress;
        alAvanzar(avance);
        dibujar();
      },
      onRefresh: (estado) => {
        avance = estado.progress;
        alAvanzar(avance);
        armar();
      },
    });
    avance = disparo.progress;
    alAvanzar(avance);
    dibujar();

    const observador = new ResizeObserver(armar);
    observador.observe(canvas);
    return () => {
      disparo.kill();
      observador.disconnect();
      alAvanzar(1);
    };
    // destinos y alAvanzar se leen al armar; version avisa cuándo cambiaron los cables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, version, inicio, fin, lado]);
}
