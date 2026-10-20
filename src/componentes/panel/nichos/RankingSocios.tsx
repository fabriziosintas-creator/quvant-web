"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { PANEL_ADMIN } from "@/datos/textos";
import { Semaforo } from "@/componentes/panel/nucleos/comunes";
import type { SocioNicho } from "@/nichos/tipos";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import type { Semaforo as TipoSemaforo } from "@/nucleos/tipos";

/**
 * Los rankings de socios del nicho: pestañas que reordenan las tarjetas
 * con layout animado, y la ficha de cada socio al tocarlo. "Los que más
 * venden" cuenta operaciones de venta (nunca montos) y solo de los que
 * aceptaron compartir métricas.
 */

const S = PANEL_ADMIN.nichos.socios;
type Orden = keyof typeof S.rankings;
const ORDENES = Object.keys(S.rankings) as Orden[];

const promedio4 = (s: SocioNicho) => {
  const ult = s.semanas.slice(-4);
  return ult.length ? Math.round(ult.reduce((a, b) => a + b, 0) / ult.length) : 0;
};
const pct = (n: number) => `${Math.round(n * 100)} %`;

function Linea({ valores, color }: { valores: number[]; color: string }) {
  if (valores.length < 2) return <span className="w-24" />;
  const max = Math.max(1, ...valores);
  const d = valores.map((v, i) => `${i ? "L" : "M"}${((i / (valores.length - 1)) * 96).toFixed(1)},${(22 - (v / max) * 20).toFixed(1)}`).join(" ");
  return (
    <svg aria-hidden width="96" height="24" viewBox="0 0 96 24" className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function RankingSocios({ socios, acento }: { socios: SocioNicho[]; acento: string }) {
  const quieto = useReducedMotion();
  const [orden, setOrden] = useState<Orden>("activos");
  const [abierto, setAbierto] = useState<string | null>(null);

  const { lista, ocultos } = useMemo(() => {
    let l = [...socios];
    let ocultos = 0;
    if (orden === "activos") l.sort((a, b) => promedio4(b) - promedio4(a));
    if (orden === "ventas") {
      const comparten = l.filter((s) => s.comparteMetricas && s.ventas4 !== null);
      ocultos = l.filter((s) => s.conUso).length - comparten.length;
      l = comparten.sort((a, b) => (b.ventas4 ?? 0) - (a.ventas4 ?? 0));
    }
    if (orden === "crecimiento") l.sort((a, b) => (b.crecimiento ?? -9) - (a.crecimiento ?? -9));
    if (orden === "riesgo") l.sort((a, b) => (a.salud ?? 101) - (b.salud ?? 101));
    if (orden === "antiguos") l.sort((a, b) => (a.alta ?? "9999").localeCompare(b.alta ?? "9999"));
    if (orden === "adopcion") l.sort((a, b) => (b.adopcion ?? -1) - (a.adopcion ?? -1));
    return { lista: l, ocultos };
  }, [socios, orden]);

  const metrica = (s: SocioNicho) => {
    if (!s.conUso && orden !== "antiguos") return S.sinUso;
    switch (orden) {
      case "activos":
        return S.metrica.activos.replace("{n}", String(promedio4(s)));
      case "ventas":
        return S.metrica.ventas.replace("{n}", String(s.ventas4 ?? 0));
      case "crecimiento":
        return S.metrica.crecimiento.replace("{n}", s.crecimiento === null ? "—" : `${s.crecimiento > 0 ? "+" : ""}${pct(s.crecimiento)}`);
      case "riesgo":
        return S.metrica.riesgo.replace("{n}", s.salud === null ? "—" : String(s.salud));
      case "antiguos":
        return S.metrica.antiguos.replace("{n}", s.alta ? diaLargo(s.alta) : "—");
      default:
        return S.metrica.adopcion.replace("{n}", s.adopcion === null ? "—" : pct(s.adopcion));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={S.titulo} className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {ORDENES.map((o) => (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={orden === o}
            onClick={() => setOrden(o)}
            className="h-9 shrink-0 border border-profundo px-3 font-plex text-[11px] uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco aria-selected:border-(--acento) aria-selected:text-blanco"
            style={{ ["--acento" as string]: acento }}
          >
            {S.rankings[o]}
          </button>
        ))}
      </div>
      {orden === "ventas" ? (
        <p className="font-plex text-xs text-acero">
          {S.ventasNota}
          {ocultos > 0 ? ` ${S.ventasOcultos.replace("{n}", String(ocultos))}` : ""}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {lista.map((s, i) => (
          <motion.li key={s.id} layout={!quieto} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}>
            <article className="border border-profundo transition-colors hover:border-acero">
              <button type="button" aria-expanded={abierto === s.id} onClick={() => setAbierto(abierto === s.id ? null : s.id)} className="grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 p-3 text-left sm:grid-cols-[1.5rem_minmax(0,1fr)_auto_auto_auto]">
                <span className="font-plex text-xs tabular-nums text-acero">{i + 1}</span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-lectura text-[15px] font-semibold text-blanco">{s.nombre}</span>
                  <span className="font-plex text-xs text-acero">{metrica(s)}</span>
                </span>
                <span className="hidden sm:block">
                  <Linea valores={s.semanas} color={acento} />
                </span>
                {s.conUso ? <Semaforo valor={s.semaforo as TipoSemaforo} /> : <span />}
                <span aria-hidden className="hidden font-plex text-xs text-acero sm:block">
                  {abierto === s.id ? "−" : "+"}
                </span>
              </button>
              {abierto === s.id ? <Ficha s={s} acento={acento} /> : null}
            </article>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Ficha({ s, acento }: { s: SocioNicho; acento: string }) {
  const F = S.ficha;
  const dato = (etiqueta: string, valor: string | number | null) => (
    <div>
      <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{etiqueta}</dt>
      <dd className="mt-1 text-blanco">{valor === null || valor === "" ? "—" : valor}</dd>
    </div>
  );
  return (
    <div className="flex flex-col gap-4 border-t border-profundo p-4 font-plex text-xs">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dato(F.alta, s.alta ? diaLargo(s.alta) : null)}
        {dato(F.abono, s.abono === null ? null : conUnidad(s.abono, "ars"))}
        {dato(F.plan, s.plan)}
        {dato(F.sucursales, s.sucursales)}
        {dato(F.responsable, s.responsable)}
        {dato(F.salud, s.salud)}
        {dato(F.adopcion, s.adopcion === null ? null : pct(s.adopcion))}
        {dato(F.ventas, s.comparteMetricas ? s.ventas4 : null)}
        {dato(F.crecimiento, s.crecimiento === null ? null : `${s.crecimiento > 0 ? "+" : ""}${pct(s.crecimiento)}`)}
        {dato(F.alertas, s.alertas)}
      </dl>
      {s.semanas.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-etiqueta text-acero">{F.semanas}</p>
          <div className="flex h-16 items-end gap-1">
            {s.semanas.map((v, i) => (
              <span key={i} title={`${v} ${F.acciones}`} className="barra-crece block flex-1" style={{ height: `${Math.max(4, (v / Math.max(1, ...s.semanas)) * 100)}%`, background: acento, opacity: 0.4 + (0.6 * (i + 1)) / s.semanas.length, transformOrigin: "bottom", animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        </div>
      ) : null}
      {s.dejoDeUsar.length > 0 ? (
        <p className="text-acero">
          {F.dejoDeUsar}: <span className="text-blanco">{s.dejoDeUsar.join(" · ")}</span>
        </p>
      ) : null}
      {s.href ? (
        <Link href={s.href} className="w-fit border border-profundo px-3 py-2 uppercase tracking-etiqueta text-blanco hover:border-acero">
          {F.verEnNucleos} →
        </Link>
      ) : null}
    </div>
  );
}
