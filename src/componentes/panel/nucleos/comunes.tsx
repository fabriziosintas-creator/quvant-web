"use client";

import Link from "next/link";
import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Semaforo as TipoSemaforo, Tendencia as TipoTendencia } from "@/nucleos/tipos";

const T = PANEL_ADMIN.nucleos;

/**
 * Piezas comunes de Núcleos. Estados sin colores nuevos (el manual no tiene
 * semáforo): la forma del cuadradito de la marca, siempre con su palabra.
 *   verde    ■ lleno, blanco        amarillo  □ con borde, blanco
 *   rojo     ▢ vacío, borde acero   arranque  · punto chico, acero
 */
export function Semaforo({ valor, conTexto = true, tamano = "md" }: { valor: TipoSemaforo; conTexto?: boolean; tamano?: "sm" | "md" }) {
  const lado = tamano === "sm" ? "size-2" : "size-2.5";
  const forma =
    valor === "verde" ? `${lado} bg-blanco` : valor === "amarillo" ? `${lado} border border-blanco` : valor === "rojo" ? `${lado} border border-acero/70` : "size-1.5 bg-acero";
  return (
    <span className="inline-flex items-center gap-2 font-plex text-xs text-blanco">
      <span aria-hidden className={`inline-block shrink-0 ${forma}`} />
      {conTexto ? <span className={valor === "rojo" ? "text-acero" : ""}>{T.semaforo[valor]}</span> : <span className="sr-only">{T.semaforo[valor]}</span>}
    </span>
  );
}

export function Tendencia({ valor }: { valor: TipoTendencia }) {
  const flecha = valor.direccion === "sube" ? "↗" : valor.direccion === "baja" ? "↘" : "→";
  return (
    <span className="inline-flex items-center gap-1.5 font-plex text-xs tabular-nums text-blanco">
      <span aria-hidden>{flecha}</span>
      <span className="sr-only">{T.tendencia[valor.direccion]}</span>
      {valor.porcentaje > 0 ? "+" : ""}
      {valor.porcentaje} %
    </span>
  );
}

/** Un número que cuenta hasta su valor al aparecer (sin movimiento, aparece directo). */
export function Numero({ valor, formato = (n) => String(n) }: { valor: number; formato?: (n: number) => string }) {
  const quieto = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (quieto) return;
    const control = animate(0, valor, { duration: 1.1, ease: [0.25, 0.1, 0.25, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => control.stop();
  }, [valor, quieto]);
  return <>{formato(quieto ? valor : n)}</>;
}

/** Indicador grande en Michroma (los de arriba de cada vista). */
export function IndicadorGrande({ etiqueta, valor, detalle }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border border-profundo p-4 md:p-5">
      <p className="font-plex text-[11px] font-medium uppercase leading-snug tracking-etiqueta text-acero">{etiqueta}</p>
      <p className="font-michroma text-2xl leading-none text-blanco md:text-3xl">{valor}</p>
      {detalle ? <div className="font-plex text-xs text-acero">{detalle}</div> : null}
    </div>
  );
}

export function CartelEjemplo({ motivo }: { motivo: string | null }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-acero/60 px-4 py-3 font-plex text-xs">
      <span className="flex items-center gap-2 font-medium uppercase tracking-etiqueta text-blanco">
        <span aria-hidden className="size-2 border border-blanco" />
        {T.ejemplo.cartel}
      </span>
      <span className="text-acero">{T.ejemplo.explicacion}</span>
      {motivo ? <span className="text-acero">· {motivo}</span> : null}
    </div>
  );
}

/**
 * La transición de una vista a otra: entrar es acercarse (la vista nueva
 * crece apenas desde el 97 %), volver es alejarse. Lenta y suave; sin
 * movimiento, aparece directo.
 */
export function Vista({ children, nivel }: { children: ReactNode; nivel: 0 | 1 | 2 }) {
  const quieto = useReducedMotion();
  return (
    <motion.div
      key={nivel}
      initial={quieto ? false : { opacity: 0, scale: nivel === 0 ? 1.02 : 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-12"
    >
      {children}
    </motion.div>
  );
}

/** Las tarjetas que se ordenan solas al cambiar el orden (layout animado). */
export function ListaOrdenada<T extends { id: string }>({ items, render }: { items: T[]; render: (item: T, indice: number) => ReactNode }) {
  const quieto = useReducedMotion();
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <motion.li key={item.id} layout={!quieto} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}>
          {render(item, i)}
        </motion.li>
      ))}
    </ul>
  );
}

/** Los filtros globales (links: quedan en la dirección y se mantienen al navegar). */
export function Filtros({ base, filtros }: { base: string; filtros: { rango: number; responsable: string; incluirPrueba: boolean } }) {
  const url = (cambios: Partial<{ rango: number; responsable: string; incluirPrueba: boolean }>) => {
    const f = { ...filtros, ...cambios };
    const p = new URLSearchParams();
    if (f.rango !== 30) p.set("rango", String(f.rango));
    if (f.responsable !== "todos") p.set("responsable", f.responsable);
    if (f.incluirPrueba) p.set("prueba", "1");
    const s = p.toString();
    return `${base}${s ? `?${s}` : ""}`;
  };
  const clase = (activo: boolean) =>
    `inline-flex h-9 items-center border px-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors ${activo ? "border-blanco text-blanco" : "border-profundo text-acero hover:text-blanco"}`;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-2" role="group" aria-label={T.filtros.rango}>
        {([7, 30, 90] as const).map((r) => (
          <Link key={r} href={url({ rango: r })} className={clase(filtros.rango === r)} aria-current={filtros.rango === r ? "true" : undefined}>
            {T.filtros.rangos[String(r) as "7" | "30" | "90"]}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2" role="group" aria-label={T.filtros.responsable}>
        {(["todos", "fabrizio", "michel"] as const).map((r) => (
          <Link key={r} href={url({ responsable: r })} className={clase(filtros.responsable === r)} aria-current={filtros.responsable === r ? "true" : undefined}>
            {T.filtros[r]}
          </Link>
        ))}
      </div>
      <Link href={url({ incluirPrueba: !filtros.incluirPrueba })} className={clase(filtros.incluirPrueba)} aria-pressed={filtros.incluirPrueba}>
        {T.filtros.prueba}
      </Link>
    </div>
  );
}

export const CLASE_BOTON_PANEL = "inline-flex h-10 items-center gap-2 bg-blanco px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero disabled:cursor-wait disabled:bg-acero";
export const CLASE_BOTON_PANEL_2 = "inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero disabled:cursor-wait";
