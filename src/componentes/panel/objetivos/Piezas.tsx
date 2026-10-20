"use client";

import { motion, useReducedMotion } from "motion/react";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import type { EstadoMeta } from "@/objetivos/tipos";

/**
 * Las piezas de Objetivos que se mueven: el anillo de progreso que se
 * dibuja al entrar, el ícono de estado (siempre con su palabra) y la curva
 * chica de la tarjeta. Con "menos movimiento", todo aparece directo.
 */

const T = PANEL_ADMIN.objetivos;
const CURVA = [0.25, 0.1, 0.25, 1] as const;

/** El ícono de cada estado: forma distinta además del color (para daltónicos). */
export function IconoEstado({ estado, tamano = 12 }: { estado: EstadoMeta; tamano?: number }) {
  const color = COLOR_ESTADO[estado];
  const s = tamano;
  return (
    <svg aria-hidden width={s} height={s} viewBox="0 0 12 12" className="shrink-0">
      {estado === "cumplido" ? <path d="M2 6.5 5 9.5 10 3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="square" /> : null}
      {estado === "en_camino" ? <path d="M2 6h7M6.5 2.5 10 6l-3.5 3.5" fill="none" stroke={color} strokeWidth="1.8" /> : null}
      {estado === "en_riesgo" ? (
        <>
          <path d="M6 1.5 11 10.5H1Z" fill="none" stroke={color} strokeWidth="1.5" />
          <path d="M6 5v2.5" stroke={color} strokeWidth="1.5" />
        </>
      ) : null}
      {estado === "atrasado" || estado === "no_cumplido" ? <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke={color} strokeWidth="1.8" /> : null}
      {estado === "sin_datos" ? <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="2 1.5" /> : null}
    </svg>
  );
}

export function ChipEstado({ estado }: { estado: EstadoMeta }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-plex text-[11px] uppercase tracking-etiqueta" style={{ color: COLOR_ESTADO[estado] }}>
      <IconoEstado estado={estado} />
      {T.estados[estado]}
    </span>
  );
}

/** El anillo de progreso: se dibuja al entrar; al cumplirse, el cuadradito del centro late una vez. */
export function Anillo({ avance, estado, tamano = 64 }: { avance: number | null; estado: EstadoMeta; tamano?: number }) {
  const quieto = useReducedMotion();
  const r = 26;
  const largo = 2 * Math.PI * r;
  const fraccion = Math.max(0, Math.min(1, avance ?? 0));
  const color = COLOR_ESTADO[estado];
  return (
    <svg aria-hidden width={tamano} height={tamano} viewBox="0 0 64 64" className="shrink-0 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#26262B" strokeWidth="5" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={largo}
        initial={{ strokeDashoffset: quieto ? largo * (1 - fraccion) : largo }}
        animate={{ strokeDashoffset: largo * (1 - fraccion) }}
        transition={{ duration: quieto ? 0 : 1.1, ease: CURVA }}
      />
      {estado === "cumplido" ? (
        <motion.rect
          x="28"
          y="28"
          width="8"
          height="8"
          fill={color}
          initial={{ scale: 1 }}
          animate={quieto ? undefined : { scale: [1, 1.6, 1] }}
          transition={{ delay: 1.1, duration: 0.6, ease: CURVA }}
          style={{ transformOrigin: "32px 32px" }}
        />
      ) : null}
    </svg>
  );
}

/** La curva chica de la tarjeta: lo real hasta hoy, sobre la línea ideal del período. */
export function Curvita({ puntos, meta, total, estado }: { puntos: Array<number | null>; meta: number; total: number; estado: EstadoMeta }) {
  const quieto = useReducedMotion();
  const ancho = 120;
  const alto = 32;
  const validos = puntos.map((p) => p ?? 0);
  const maximo = Math.max(meta, ...validos, 1);
  const x = (i: number) => (total <= 1 ? ancho : (i / (total - 1)) * ancho);
  const y = (v: number) => alto - 2 - (v / maximo) * (alto - 4);
  if (validos.length === 0) return <svg aria-hidden width={ancho} height={alto} />;
  const d = validos.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg aria-hidden width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} className="overflow-visible">
      <line x1="0" y1={y(0)} x2={ancho} y2={y(meta)} stroke="#9C9CA3" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 3" />
      <motion.path d={d} fill="none" stroke={COLOR_ESTADO[estado]} strokeWidth="1.6" initial={{ pathLength: quieto ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: quieto ? 0 : 1, ease: CURVA }} />
    </svg>
  );
}
