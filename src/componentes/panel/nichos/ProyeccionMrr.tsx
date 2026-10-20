"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { Pronostico } from "@/nichos/estadistica";
import { conUnidad, corto } from "@/objetivos/formato";

/**
 * El MRR del nicho mes a mes y su proyección a 6 meses: la historia (línea
 * llena que se dibuja al entrar), la proyección punteada y la banda de
 * incertidumbre (más ancha cuanto más lejos). Tabla equivalente para
 * lectores de pantalla.
 */
export function ProyeccionMrr({ historia, pronostico, color }: { historia: Array<{ mes: string; mrr: number }>; pronostico: Pronostico; color: string }) {
  const quieto = useReducedMotion();
  const id = useId();
  const ancho = 520;
  const alto = 200;
  const m = { izq: 52, der: 12, arr: 12, aba: 24 };
  const total = historia.length + pronostico.valores.length - 1;
  const maximo = Math.max(1, ...historia.map((h) => h.mrr), ...pronostico.alto) * 1.05;
  const px = (i: number) => m.izq + (i / Math.max(1, total)) * (ancho - m.izq - m.der);
  const py = (v: number) => m.arr + (1 - v / maximo) * (alto - m.arr - m.aba);
  const ultimo = historia.length - 1;
  const linea = historia.map((h, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(h.mrr).toFixed(1)}`).join(" ");
  const futuro = [`M${px(ultimo)},${py(historia[ultimo].mrr)}`, ...pronostico.valores.map((v, i) => `L${px(ultimo + i + 1).toFixed(1)},${py(v).toFixed(1)}`)].join(" ");
  // La banda: arriba de ida, abajo de vuelta.
  const banda = [
    `M${px(ultimo)},${py(historia[ultimo].mrr)}`,
    ...pronostico.alto.map((v, i) => `L${px(ultimo + i + 1).toFixed(1)},${py(v).toFixed(1)}`),
    ...pronostico.bajo
      .map((v, i) => ({ v, i }))
      .reverse()
      .map(({ v, i }) => `L${px(ultimo + i + 1).toFixed(1)},${py(v).toFixed(1)}`),
    "Z",
  ].join(" ");
  const marcas = [0, 0.5, 1].map((f) => f * maximo);
  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-t`}>
        {marcas.map((v) => (
          <g key={v}>
            <line x1={m.izq} x2={ancho - m.der} y1={py(v)} y2={py(v)} stroke="#26262B" />
            <text x={m.izq - 6} y={py(v) + 4} textAnchor="end" className="fill-acero font-plex text-[10px]">
              {corto(v, "ars")}
            </text>
          </g>
        ))}
        <text x={px(0)} y={alto - 6} className="fill-acero font-plex text-[10px]">
          {historia[0].mes.split("-").reverse().join("/")}
        </text>
        <motion.path d={banda} fill={color} fillOpacity="0.14" initial={{ opacity: quieto ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: quieto ? 0 : 0.9, duration: 0.5 }} />
        <motion.path d={linea} fill="none" stroke={color} strokeWidth="2.5" initial={{ pathLength: quieto ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: quieto ? 0 : 0.9 }} />
        <motion.path d={futuro} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" initial={{ opacity: quieto ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: quieto ? 0 : 0.9, duration: 0.5 }} />
        <circle cx={px(ultimo)} cy={py(historia[ultimo].mrr)} r="4" fill={color} />
      </svg>
      <table id={`${id}-t`} className="sr-only">
        <tbody>
          {historia.map((h) => (
            <tr key={h.mes}>
              <td>{h.mes}</td>
              <td>{conUnidad(h.mrr, "ars")}</td>
            </tr>
          ))}
          {pronostico.valores.map((v, i) => (
            <tr key={i}>
              <td>+{i + 1}</td>
              <td>
                {conUnidad(v, "ars")} ({conUnidad(pronostico.bajo[i], "ars")} – {conUnidad(pronostico.alto[i], "ars")})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
