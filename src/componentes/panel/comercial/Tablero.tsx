"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useOptimistic, useState, useTransition, type CSSProperties } from "react";
import { ETAPAS_ABIERTAS, type Etapa } from "@/comercial/comercial";
import { ACENTO_NICHO, COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import { moverEtapa } from "@/servidor/comercial/acciones";

/**
 * El tablero por etapas. Con mouse, se arrastra la tarjeta a otra columna;
 * en el celular y con teclado, "Mover a…" en cada tarjeta (el arrastre con
 * el dedo no es accesible). El cambio se ve al instante (optimista) y la
 * tarjeta se reacomoda con layout animado. En el celular, las columnas se
 * deslizan de costado.
 */

const T = PANEL_ADMIN.comercial;
const B = T.tablero;

export type TarjetaOportunidad = {
  id: string;
  negocio: string;
  nicho: string | null;
  etapa: Etapa;
  valorAnual: number;
  dias: number;
  estancada: boolean;
  proximoPaso: string | null;
  proximoFecha: string | null;
  vencida: boolean;
  responsable: string;
};

const acento = (n: string | null) => (n && n in ACENTO_NICHO ? ACENTO_NICHO[n as keyof typeof ACENTO_NICHO] : "#9C9CA3");

export function Tablero({ tarjetas, ganadas, perdidas }: { tarjetas: TarjetaOportunidad[]; ganadas: number; perdidas: number }) {
  const quieto = useReducedMotion();
  const [lista, mover] = useOptimistic(tarjetas, (actual, cambio: { id: string; etapa: Etapa }) =>
    actual.map((t) => (t.id === cambio.id ? { ...t, etapa: cambio.etapa, dias: 0, estancada: false } : t)).filter((t) => (ETAPAS_ABIERTAS as string[]).includes(t.etapa)),
  );
  const [, iniciar] = useTransition();
  const [sobre, setSobre] = useState<Etapa | null>(null);
  const [aviso, setAviso] = useState("");

  const llevar = (id: string, etapa: Etapa) =>
    iniciar(async () => {
      mover({ id, etapa });
      const r = await moverEtapa(id, etapa);
      setAviso(r.mensaje ?? (r.ok ? "" : PANEL_ADMIN.comercial.errores.general));
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="hidden font-plex text-xs text-acero md:block">{B.arrastrar}</p>
      {aviso ? (
        <p role="status" className="border border-profundo px-4 py-2 font-plex text-xs text-blanco">
          {aviso}
        </p>
      ) : null}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {ETAPAS_ABIERTAS.map((etapa) => {
          const propias = lista.filter((t) => t.etapa === etapa);
          const total = propias.reduce((s, t) => s + t.valorAnual, 0);
          return (
            <section
              key={etapa}
              aria-label={T.etapas[etapa]}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(etapa);
              }}
              onDragLeave={() => setSobre((s) => (s === etapa ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) llevar(id, etapa);
              }}
              className={`flex w-[78vw] max-w-72 shrink-0 snap-start flex-col gap-2 border p-2 transition-colors md:w-64 ${sobre === etapa ? "border-acero bg-profundo/30" : "border-profundo"}`}
            >
              <header className="flex items-baseline justify-between gap-2 px-1 pt-1">
                <h3 className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{T.etapas[etapa]}</h3>
                <span className="font-plex text-[11px] tabular-nums text-acero">
                  {propias.length} · {conUnidad(total, "ars")}
                </span>
              </header>
              {propias.length === 0 ? <p className="px-1 py-4 font-plex text-[11px] text-acero/60">{B.vacio}</p> : null}
              <ul className="flex flex-col gap-2">
                {propias.map((t) => (
                  <motion.li key={t.id} layout={!quieto} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}>
                    <article
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      style={{ "--acento": acento(t.nicho) } as CSSProperties}
                      className="flex cursor-grab flex-col gap-2 border border-profundo bg-negro p-3 transition-colors hover:border-(--acento)/60 active:cursor-grabbing"
                    >
                      <Link href={`/panel/comercial/${t.id}`} className="flex items-start gap-2 font-lectura text-sm font-semibold leading-snug text-blanco hover:underline">
                        <span aria-hidden className="mt-1.5 size-1.5 shrink-0 bg-(--acento)" />
                        {t.negocio}
                      </Link>
                      <p className="font-plex text-[11px] text-acero">
                        {t.valorAnual > 0 ? `${conUnidad(t.valorAnual, "ars")} · ` : ""}
                        <span style={{ color: t.estancada ? COLOR_ESTADO.en_riesgo : undefined }}>{t.estancada ? `${B.estancada} · ` : ""}{B.dias.replace("{n}", String(t.dias))}</span>
                      </p>
                      <p className="font-plex text-[11px]" style={{ color: t.vencida ? COLOR_ESTADO.atrasado : "#9C9CA3" }}>
                        {t.proximoFecha ? (t.vencida ? B.vencido : B.vence).replace("{fecha}", diaLargo(t.proximoFecha)) : B.sinPaso}
                        {t.proximoPaso ? ` · ${t.proximoPaso}` : ""}
                      </p>
                      <label className="flex items-center gap-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                        <span className="sr-only">{B.moverA}</span>
                        <select
                          aria-label={`${B.moverA} ${t.negocio}`}
                          value=""
                          onChange={(e) => e.target.value && llevar(t.id, e.target.value as Etapa)}
                          className="h-8 w-full border border-profundo bg-negro px-2 font-plex text-[11px] normal-case tracking-normal text-blanco focus:border-acero focus:outline-none"
                        >
                          <option value="">{B.moverA}</option>
                          {[...ETAPAS_ABIERTAS, "ganado" as Etapa]
                            .filter((e) => e !== t.etapa)
                            .map((e) => (
                              <option key={e} value={e}>
                                {T.etapas[e]}
                              </option>
                            ))}
                        </select>
                      </label>
                    </article>
                  </motion.li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="flex flex-wrap gap-4 font-plex text-xs text-acero">
        <Link href="/panel/comercial?vista=lista&etapa=ganado" className="hover:text-blanco">
          {B.ganadas}: <span className="text-blanco">{ganadas}</span>
        </Link>
        <Link href="/panel/comercial?vista=lista&etapa=perdido" className="hover:text-blanco">
          {B.perdidas}: <span className="text-blanco">{perdidas}</span>
        </Link>
      </p>
    </div>
  );
}
