"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { cadaDia, diasEntre } from "@/objetivos/fechas";
import { conUnidad, corto, diaCorto } from "@/objetivos/formato";
import type { Acumulacion, EstadoMeta, Unidad } from "@/objetivos/tipos";

/**
 * El gráfico grande del detalle: la línea ideal (fina), la real (que se
 * dibuja al entrar) y la proyección punteada hasta el cierre. Al pasar el
 * dedo o el mouse, el valor de ese día, lo esperado y la diferencia. Debajo
 * va la tabla equivalente para lectores de pantalla.
 */

const T = PANEL_ADMIN.objetivos.detalle;
const CURVA = [0.25, 0.1, 0.25, 1] as const;

export function GraficoMeta({
  serie,
  desde,
  hasta,
  meta,
  inicio,
  acumulacion,
  proyeccion,
  unidad,
  estado,
}: {
  serie: Array<{ dia: string; valor: number | null }>;
  desde: string;
  hasta: string;
  meta: number;
  inicio: number | null;
  acumulacion: Acumulacion;
  proyeccion: number | null;
  unidad: Unidad;
  estado: EstadoMeta;
}) {
  const quieto = useReducedMotion();
  const id = useId();
  const [x, setX] = useState<number | null>(null);
  const ancho = 720;
  const alto = 260;
  const m = { izq: 56, der: 16, arr: 16, aba: 28 };
  const total = Math.max(1, diasEntre(desde, hasta));
  const base = acumulacion === "valor_al_cierre" ? (inicio ?? 0) : 0;
  const ideal = (i: number) => (acumulacion === "promedio" ? meta : base + (meta - base) * (i / total));
  const valores = serie.map((p) => p.valor ?? 0);
  const maximo = Math.max(meta, proyeccion ?? 0, ...valores, 1) * 1.08;
  const px = (i: number) => m.izq + (i / total) * (ancho - m.izq - m.der);
  const py = (v: number) => m.arr + (1 - v / maximo) * (alto - m.arr - m.aba);

  const real = serie.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(p.valor ?? 0).toFixed(1)}`).join(" ");
  const ultimo = serie.length - 1;
  const color = COLOR_ESTADO[estado];
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maximo);
  const dias = cadaDia(desde, hasta);
  const etiquetasX = [0, Math.round(total / 2), total];

  const alMover = (evento: React.PointerEvent<SVGSVGElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const relativo = ((evento.clientX - caja.left) / caja.width) * ancho;
    const i = Math.round(((relativo - m.izq) / (ancho - m.izq - m.der)) * total);
    setX(Math.max(0, Math.min(ultimo, i)));
  };

  const elegido = x !== null && serie[x] ? { dia: serie[x].dia, valor: serie[x].valor, esperado: ideal(x) } : null;

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative">
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full touch-pan-y" role="img" aria-labelledby={`${id}-tabla`} onPointerMove={alMover} onPointerLeave={() => setX(null)}>
          {marcas.map((v) => (
            <g key={v}>
              <line x1={m.izq} x2={ancho - m.der} y1={py(v)} y2={py(v)} stroke="#26262B" strokeWidth="1" />
              <text x={m.izq - 8} y={py(v) + 4} textAnchor="end" className="fill-acero font-plex text-[10px]">
                {corto(v, unidad)}
              </text>
            </g>
          ))}
          {etiquetasX.map((i) => (
            <text key={i} x={px(i)} y={alto - 8} textAnchor={i === 0 ? "start" : i === total ? "end" : "middle"} className="fill-acero font-plex text-[10px]">
              {diaCorto(dias[i] ?? hasta)}
            </text>
          ))}
          {/* La meta. */}
          <line x1={m.izq} x2={ancho - m.der} y1={py(meta)} y2={py(meta)} stroke="#9C9CA3" strokeOpacity="0.5" strokeDasharray="2 4" />
          {/* El ritmo ideal. */}
          <line x1={px(0)} y1={py(ideal(0))} x2={px(total)} y2={py(ideal(total))} stroke="#ECECEE" strokeOpacity="0.45" strokeWidth="1" />
          {/* La proyección, punteada, desde hoy hasta el cierre. */}
          {proyeccion !== null && ultimo >= 0 && ultimo < total ? (
            <motion.line
              x1={px(ultimo)}
              y1={py(valores[ultimo])}
              x2={px(total)}
              y2={py(proyeccion)}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ opacity: quieto ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: quieto ? 0 : 1, duration: 0.4 }}
            />
          ) : null}
          {/* Lo real. */}
          {serie.length > 0 ? (
            <motion.path d={real} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: quieto ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: quieto ? 0 : 1.1, ease: CURVA }} />
          ) : null}
          {serie.length > 0 ? <circle cx={px(ultimo)} cy={py(valores[ultimo])} r="4" fill={color} /> : null}
          {elegido && x !== null ? (
            <g>
              <line x1={px(x)} x2={px(x)} y1={m.arr} y2={alto - m.aba} stroke="#ECECEE" strokeOpacity="0.3" />
              <circle cx={px(x)} cy={py(elegido.valor ?? 0)} r="5" fill="#0D0D0F" stroke={color} strokeWidth="2" />
            </g>
          ) : null}
        </svg>
        {elegido ? (
          <div className="pointer-events-none absolute left-14 top-3 flex flex-col gap-0.5 border border-profundo bg-negro/95 px-3 py-2 font-plex text-xs">
            <span className="text-acero">{diaCorto(elegido.dia)}</span>
            <span className="text-blanco">
              {T.real}: {conUnidad(elegido.valor, unidad)}
            </span>
            <span className="text-acero">
              {T.esperado}: {conUnidad(elegido.esperado, unidad)}
            </span>
            <span className="text-acero">
              {T.diferencia}: {conUnidad((elegido.valor ?? 0) - elegido.esperado, unidad)}
            </span>
          </div>
        ) : null}
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 font-plex text-[11px] text-acero">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5" style={{ background: color }} />
          {T.real}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-px w-5 bg-blanco/45" />
          {T.ideal}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-0 w-5 border-t border-dashed" style={{ borderColor: color }} />
          {T.proyeccion}
        </span>
      </figcaption>
      <table id={`${id}-tabla`} className="sr-only">
        <caption>{T.grafico}</caption>
        <thead>
          <tr>
            <th>{T.fecha}</th>
            <th>{T.real}</th>
            <th>{T.esperado}</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((p, i) => (
            <tr key={p.dia}>
              <td>{p.dia}</td>
              <td>{conUnidad(p.valor, unidad)}</td>
              <td>{conUnidad(ideal(i), unidad)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
