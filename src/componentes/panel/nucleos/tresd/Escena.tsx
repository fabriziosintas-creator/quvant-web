"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PANEL_ADMIN } from "@/datos/textos";

const T = PANEL_ADMIN.nucleos.tresD;

/**
 * El marco de las vistas 3D de Núcleos. Reglas (B.5): siempre hay una
 * vista en lista equivalente (el 3D ayuda a ver, no esconde datos); carga
 * diferida, solo cuando entra en pantalla; un <Canvas> por pantalla; sin
 * WebGL o con "menos movimiento" queda la lista sola.
 */
const Lienzo = dynamic(() => import("./Lienzo").then((m) => m.Lienzo), { ssr: false });

function hayWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Escena({ titulo, nota, escena, lista, alto = "h-[420px]" }: { titulo: string; nota: string; escena: ReactNode; lista: ReactNode; alto?: string }) {
  const quieto = useReducedMotion();
  const [soporta, setSoporta] = useState<boolean | null>(null);
  const [modo, setModo] = useState<"3d" | "lista">("3d");
  const [visible, setVisible] = useState(false);
  const marco = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Se decide en el navegador (document) y fuera del render.
    const soporte = hayWebGL() && !quieto;
    queueMicrotask(() => setSoporta(soporte));
  }, [quieto]);

  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const obs = new IntersectionObserver((entradas) => entradas.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const en3d = soporta === true && modo === "3d";

  return (
    <section ref={marco} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">
            <span aria-hidden className="size-1.5 bg-blanco" />
            {titulo}
          </h2>
          <p className="mt-2 max-w-2xl font-lectura text-sm leading-relaxed text-acero">{soporta === false ? T.sinWebGL : nota}</p>
        </div>
        {soporta ? (
          <div role="group" aria-label={`${T.ver3d} / ${T.verLista}`} className="flex items-center gap-1 border border-profundo p-1">
            {(["3d", "lista"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => setModo(m)}
                className={`h-8 px-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta transition-colors ${modo === m ? "bg-blanco text-negro" : "text-acero hover:text-blanco"}`}
              >
                {m === "3d" ? T.ver3d : T.verLista}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {en3d ? (
        <div className={`relative ${alto} overflow-hidden border border-profundo bg-negro`}>{visible ? <Lienzo>{escena}</Lienzo> : null}</div>
      ) : null}
      <div className={en3d ? "sr-only" : ""}>{lista}</div>
    </section>
  );
}
