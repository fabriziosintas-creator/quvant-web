"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { PANEL_ADMIN } from "@/datos/textos";
import type { EstadoFuncion, PasoActivacion, SemanaDeUso } from "@/nucleos/tipos";

const T = PANEL_ADMIN.nucleos;
const CURVA = [0.25, 0.1, 0.25, 1] as const;

/**
 * Los gráficos de Núcleos, en SVG y HTML, en blanco y grises sobre negro
 * (guía de visualización: una sola escala, líneas de 2 px, la serie
 * elegida resaltada, texto en tokens de texto, tabla equivalente).
 */

export type Serie = { id: string; nombre: string; valores: number[] };

/** "2026-10-19" → "19/10". Va acá adentro: una función no puede pasar del servidor a este componente. */
const etiquetaSemana = (s: string) => s.slice(5).split("-").reverse().join("/");

/** Líneas por núcleo: la elegida en blanco, el resto en acero. Con tooltip por semana. */
export function LineasActividad({ series, semanas, elegida }: { series: Serie[]; semanas: string[]; elegida?: string }) {
  const quieto = useReducedMotion();
  const [x, setX] = useState<number | null>(null);
  const id = useId();
  const ancho = 720;
  const alto = 220;
  const margen = { izq: 36, der: 12, arr: 12, aba: 28 };
  const maximo = Math.max(1, ...series.flatMap((s) => s.valores));
  const n = semanas.length;
  const px = (i: number) => margen.izq + (i / Math.max(1, n - 1)) * (ancho - margen.izq - margen.der);
  const py = (v: number) => margen.arr + (1 - v / maximo) * (alto - margen.arr - margen.aba);
  const camino = (valores: number[]) => valores.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((f) => Math.round(maximo * f));

  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-labelledby={`${id}-t`}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const rel = ((e.clientX - r.left) / r.width) * ancho;
            const i = Math.round(((rel - margen.izq) / (ancho - margen.izq - margen.der)) * (n - 1));
            setX(Math.max(0, Math.min(n - 1, i)));
          }}
          onMouseLeave={() => setX(null)}
        >
          <title id={`${id}-t`}>{T.general.actividad}</title>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margen.izq} x2={ancho - margen.der} y1={py(t)} y2={py(t)} stroke="#26262B" strokeWidth={1} />
              <text x={margen.izq - 8} y={py(t) + 4} textAnchor="end" fontSize={10} fill="#9C9CA3" fontFamily="var(--font-plex)">
                {t >= 1000 ? `${Math.round(t / 1000)}K` : t}
              </text>
            </g>
          ))}
          {semanas.map((s, i) => (i % 2 === 0 ? (
            <text key={s} x={px(i)} y={alto - 8} textAnchor="middle" fontSize={10} fill="#9C9CA3" fontFamily="var(--font-plex)">
              {etiquetaSemana(s)}
            </text>
          ) : null))}
          {series.map((s) => {
            const activa = !elegida || s.id === elegida;
            return (
              <motion.path
                key={s.id}
                d={camino(s.valores)}
                fill="none"
                stroke={activa ? "#ECECEE" : "#9C9CA3"}
                strokeOpacity={activa ? 1 : 0.45}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={quieto ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: CURVA }}
              />
            );
          })}
          {x !== null ? (
            <g>
              <line x1={px(x)} x2={px(x)} y1={margen.arr} y2={alto - margen.aba} stroke="#9C9CA3" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.id} cx={px(x)} cy={py(s.valores[x] ?? 0)} r={4} fill={!elegida || s.id === elegida ? "#ECECEE" : "#9C9CA3"} stroke="#0D0D0F" strokeWidth={2} />
              ))}
            </g>
          ) : null}
        </svg>
      </div>
      <div className="flex min-h-5 flex-wrap items-center gap-x-5 gap-y-1 font-plex text-xs text-acero" aria-live="polite">
        {x !== null ? (
          <>
            <span className="text-blanco">{etiquetaSemana(semanas[x])}</span>
            {series.map((s) => (
              <span key={s.id}>
                <span className="tabular-nums text-blanco">{s.valores[x] ?? 0}</span> {s.nombre}
              </span>
            ))}
          </>
        ) : (
          series.map((s) => (
            <span key={s.id} className="flex items-center gap-2">
              <span aria-hidden className={`inline-block h-0.5 w-4 ${!elegida || s.id === elegida ? "bg-blanco" : "bg-acero/60"}`} />
              {s.nombre}
            </span>
          ))
        )}
      </div>
      <table className="sr-only">
        <caption>{T.general.actividad}</caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            {series.map((s) => (
              <th key={s.id} scope="col">{s.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((sem, i) => (
            <tr key={sem}>
              <th scope="row">{sem}</th>
              {series.map((s) => (
                <td key={s.id}>{s.valores[i] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Una mini línea de actividad (sparkline) para las tarjetas del ranking. */
export function MiniLinea({ valores, ancho = 96, alto = 24 }: { valores: number[]; ancho?: number; alto?: number }) {
  const maximo = Math.max(1, ...valores);
  const n = Math.max(1, valores.length - 1);
  const d = valores.map((v, i) => `${i === 0 ? "M" : "L"}${((i / n) * (ancho - 2) + 1).toFixed(1)},${(alto - 2 - (v / maximo) * (alto - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke="#9C9CA3" strokeWidth={1.5} strokeLinejoin="round" />
      {valores.length > 0 ? <circle cx={ancho - 1} cy={alto - 2 - ((valores[valores.length - 1] ?? 0) / maximo) * (alto - 4)} r={2.5} fill="#ECECEE" /> : null}
    </svg>
  );
}

/** Mapa de calor de adopción: clientes en filas, funciones clave en columnas. Celdas con la forma del semáforo. */
export function MapaCalorAdopcion({ funciones, filas }: { funciones: Array<{ id: string; nombre: string }>; filas: Array<{ id: string; nombre: string; href: string; estados: Record<string, EstadoFuncion | null> }> }) {
  const celda = (estado: EstadoFuncion | null) =>
    estado === "usada" ? "size-3 bg-blanco" : estado === "dejo_de_usar" ? "size-3 border border-blanco" : estado === "sin_usar" ? "size-3 border border-acero/50" : "size-1 bg-profundo";
  const texto = (estado: EstadoFuncion | null) => (estado === "usada" ? T.nucleo.usada : estado === "dejo_de_usar" ? T.nucleo.dejoDeUsar : estado === "sin_usar" ? T.nucleo.sinUsar : "—");
  return (
    <div className="overflow-x-auto border border-profundo">
      <table className="w-full min-w-[640px] border-collapse font-plex text-xs">
        <thead>
          <tr className="text-left text-acero">
            <th scope="col" className="p-3 font-medium uppercase tracking-etiqueta">{T.nucleo.ranking}</th>
            {funciones.map((f) => (
              <th key={f.id} scope="col" className="p-3 text-center align-bottom font-normal normal-case tracking-normal">
                <span className="inline-block max-w-24 text-[11px] leading-snug">{f.nombre}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-t border-profundo hover:bg-profundo/30">
              <th scope="row" className="p-3 text-left font-normal">
                <a href={fila.href} className="text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">{fila.nombre}</a>
              </th>
              {funciones.map((f) => (
                <td key={f.id} className="p-3 text-center" title={`${fila.nombre} · ${f.nombre}: ${texto(fila.estados[f.id] ?? null)}`}>
                  <span aria-hidden className={`inline-block ${celda(fila.estados[f.id] ?? null)}`} />
                  <span className="sr-only">{texto(fila.estados[f.id] ?? null)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex flex-wrap gap-x-5 gap-y-1 border-t border-profundo px-3 py-2 font-plex text-[11px] text-acero">
        <span className="flex items-center gap-2"><span aria-hidden className="size-3 bg-blanco" />{T.nucleo.usada}</span>
        <span className="flex items-center gap-2"><span aria-hidden className="size-3 border border-blanco" />{T.nucleo.dejoDeUsar}</span>
        <span className="flex items-center gap-2"><span aria-hidden className="size-3 border border-acero/50" />{T.nucleo.sinUsar}</span>
      </p>
    </div>
  );
}

/** El embudo de activación: cuántos clientes llegaron a cada paso. */
export function Embudo({ cuentas, total }: { cuentas: Record<PasoActivacion, number>; total: number }) {
  const pasos: PasoActivacion[] = ["alta", "primera_sesion", "primera_accion_principal", "primera_funcion_avanzada", "uso_semanal_estable"];
  const quieto = useReducedMotion();
  return (
    <ol className="flex flex-col gap-2">
      {pasos.map((p, i) => {
        const n = cuentas[p] ?? 0;
        return (
          <li key={p} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] items-center gap-3 font-plex text-xs">
            <span className="text-acero">{i + 1}. {T.nucleo.pasos[p]}</span>
            <span aria-hidden className="h-2.5 bg-profundo/50">
              <motion.span className="block h-full bg-blanco" initial={quieto ? false : { width: 0 }} animate={{ width: `${total ? (n / total) * 100 : 0}%` }} transition={{ duration: 1, ease: CURVA, delay: i * 0.1 }} />
            </span>
            <span className="min-w-8 text-right tabular-nums text-blanco">{n}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Uso semanal por módulo: una fila por semana, un cuadradito por módulo cuya intensidad es la cantidad de acciones. */
export function UsoSemanalPorModulo({ semanas, modulos }: { semanas: SemanaDeUso[]; modulos: string[] }) {
  const maximo = Math.max(1, ...semanas.flatMap((s) => modulos.map((m) => s.accionesPorModulo[m] ?? 0)));
  return (
    <div className="overflow-x-auto border border-profundo">
      <table className="w-full border-collapse font-plex text-xs">
        <thead>
          <tr className="text-left text-acero">
            <th scope="col" className="p-2 font-medium uppercase tracking-etiqueta">Semana</th>
            {modulos.map((m) => (
              <th key={m} scope="col" className="p-2 text-center font-normal normal-case tracking-normal">{m.replace(/_/g, " ")}</th>
            ))}
            <th scope="col" className="p-2 text-right font-medium uppercase tracking-etiqueta">Días</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((s) => (
            <tr key={s.inicio} className="border-t border-profundo">
              <th scope="row" className="whitespace-nowrap p-2 text-left font-normal tabular-nums text-acero">{s.inicio.slice(5).split("-").reverse().join("/")}</th>
              {modulos.map((m) => {
                const v = s.accionesPorModulo[m] ?? 0;
                return (
                  <td key={m} className="p-2 text-center" title={`${m}: ${v}`}>
                    <span aria-hidden className="inline-block size-4" style={{ background: v ? `rgb(236 236 238 / ${0.12 + 0.88 * (v / maximo)})` : "#26262B" }} />
                    <span className="sr-only">{v}</span>
                  </td>
                );
              })}
              <td className="p-2 text-right tabular-nums text-blanco">{s.diasActivos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Barras horizontales simples (por sucursal, por rol). */
export function BarrasSimples({ filas, maximo: maximoDado }: { filas: Array<{ etiqueta: string; valor: number }>; maximo?: number }) {
  const maximo = maximoDado ?? Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="flex flex-col">
      {filas.map((f) => (
        <li key={f.etiqueta} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 py-1.5 font-plex text-xs">
          <span className="truncate text-acero">{f.etiqueta}</span>
          <span aria-hidden className="h-2.5 bg-profundo/50"><span className="block h-full bg-blanco" style={{ width: `${(f.valor / maximo) * 100}%` }} /></span>
          <span className="min-w-8 text-right tabular-nums text-blanco">{f.valor}</span>
        </li>
      ))}
    </ul>
  );
}
