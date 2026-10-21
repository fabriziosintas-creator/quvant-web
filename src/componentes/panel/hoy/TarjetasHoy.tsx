"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition, type CSSProperties } from "react";
import { FormTipoCambio } from "@/componentes/panel/objetivos/Formularios";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Tarjeta } from "@/hoy/reglas";
import { posponerTarjeta } from "@/servidor/hoy/acciones";

/**
 * Las tarjetas de "Hoy": grandes, para el pulgar. Cada una dice qué pasa,
 * por qué importa y tiene sus botones. Al posponerla (o resolverla) sale
 * con una animación corta y el resto se reacomoda. Si no queda nada
 * urgente, el punto de la marca late una vez.
 */

const T = PANEL_ADMIN.hoy;
const COLOR_URGENCIA = { 0: COLOR_ESTADO.atrasado, 1: COLOR_ESTADO.en_riesgo, 2: COLOR_ESTADO.en_camino } as const;

export function TarjetasHoy({ tarjetas, mes }: { tarjetas: Tarjeta[]; mes: string }) {
  const quieto = useReducedMotion();
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [, iniciar] = useTransition();
  const visibles = tarjetas.filter((t) => !ocultas.has(t.clave));
  const posponer = (clave: string) => {
    setOcultas((o) => new Set(o).add(clave));
    iniciar(async () => {
      const ok = await posponerTarjeta(clave);
      if (!ok) setOcultas((o) => {
        const n = new Set(o);
        n.delete(clave);
        return n;
      });
    });
  };

  if (visibles.length === 0 || visibles.every((t) => t.urgencia === 2)) {
    return (
      <>
        <div className="flex items-center gap-4 border border-profundo p-5">
          <motion.span aria-hidden className="size-3 shrink-0" style={{ background: COLOR_ESTADO.cumplido }} initial={{ scale: 1 }} animate={quieto ? undefined : { scale: [1, 1.8, 1] }} transition={{ duration: 0.7, delay: 0.3 }} />
          <p className="font-lectura text-base text-blanco">{T.festejo}</p>
        </div>
        {visibles.length ? <Lista tarjetas={visibles} posponer={posponer} mes={mes} quieto={!!quieto} /> : null}
      </>
    );
  }
  return <Lista tarjetas={visibles} posponer={posponer} mes={mes} quieto={!!quieto} />;
}

function Lista({ tarjetas, posponer, mes, quieto }: { tarjetas: Tarjeta[]; posponer: (c: string) => void; mes: string; quieto: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {tarjetas.map((t, i) => {
          const textos = T.tarjetas[t.tipo];
          const color = COLOR_URGENCIA[t.urgencia];
          return (
            <motion.li
              key={t.clave}
              layout={!quieto}
              initial={quieto ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: quieto ? 0 : i * 0.06 } }}
              exit={quieto ? { opacity: 0 } : { opacity: 0, x: 60, transition: { duration: 0.25 } }}
            >
              <article style={{ "--urgencia": color } as CSSProperties} className="relative flex flex-col gap-4 border border-profundo p-4 md:p-5">
                <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-(--urgencia)" />
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex items-center gap-2 font-plex text-[10px] uppercase tracking-etiqueta" style={{ color }}>
                      <span aria-hidden className="size-1.5 bg-(--urgencia)" />
                      {T.urgencias[String(t.urgencia) as "0" | "1" | "2"]}
                    </p>
                    <h2 className="font-lectura text-lg font-semibold leading-snug text-blanco">{textos.titulo.replace("{n}", String(t.cantidad))}</h2>
                    <p className="font-plex text-xs text-acero">{textos.porque}</p>
                  </div>
                  <button type="button" onClick={() => posponer(t.clave)} className="h-11 shrink-0 px-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
                    {T.posponer}
                  </button>
                </header>
                {t.items.length > 0 ? (
                  <ul className="flex flex-col">
                    {t.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-profundo py-2.5">
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-lectura text-[15px] text-blanco">{item.titulo}</span>
                          {item.detalle ? <span className="font-plex text-xs text-acero">{item.detalle}</span> : null}
                        </span>
                        <span className="flex shrink-0 gap-2">
                          {item.acciones.map((a) =>
                            a.externo ? (
                              <a key={a.etiqueta} href={a.href} className="inline-flex h-11 items-center border border-profundo px-4 font-plex text-xs uppercase tracking-[0.12em] text-blanco hover:border-acero">
                                {T.acciones[a.etiqueta as keyof typeof T.acciones] ?? a.etiqueta}
                              </a>
                            ) : (
                              <Link key={a.etiqueta} href={a.href} className="inline-flex h-11 items-center border border-profundo px-4 font-plex text-xs uppercase tracking-[0.12em] text-blanco hover:border-acero">
                                {T.acciones[a.etiqueta as keyof typeof T.acciones] ?? a.etiqueta}
                              </Link>
                            ),
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {t.tipo === "tipo_cambio" ? <FormTipoCambio mes={mes} actual={null} /> : null}
                {t.accion ? (
                  <Link href={t.accion.href} className="inline-flex h-11 w-fit items-center bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
                    {T.acciones[t.accion.etiqueta as keyof typeof T.acciones] ?? t.accion.etiqueta}
                  </Link>
                ) : null}
              </article>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
