"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { agrupar, type TipoAviso } from "@/avisos/avisos";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { marcarLeidos } from "@/servidor/avisos/acciones";
import { crearClienteNavegador } from "@/supabase/navegador";

/**
 * La campanita del panel: contador de no leídos, panel lateral con los
 * avisos de hoy, ayer y antes, y los nuevos en vivo (Supabase Realtime,
 * con RLS: cada admin recibe los suyos y los de los dos) con un aviso
 * flotante que se va solo en 5 segundos.
 */

const T = PANEL_ADMIN.avisos;
type Aviso = { id: number; tipo: TipoAviso; titulo: string; texto: string | null; enlace: string | null; prioridad: string; creadoEn: string; leido: boolean };
const sinSuscripcion = () => () => {};
const COLOR = { alta: COLOR_ESTADO.atrasado, media: COLOR_ESTADO.en_riesgo, baja: COLOR_ESTADO.cumplido } as Record<string, string>;

export function Campanita() {
  const quieto = useReducedMotion();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [flotante, setFlotante] = useState<Aviso | null>(null);
  const apagados = useRef<Set<string>>(new Set());
  const boton = useRef<HTMLButtonElement>(null);
  // En el servidor no hay document.body: el portal va recién en el navegador.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const noLeidos = avisos.filter((a) => !a.leido).length;

  useEffect(() => {
    let vivo = true;
    let canal: ReturnType<ReturnType<typeof crearClienteNavegador>["channel"]> | null = null;
    let cliente: ReturnType<typeof crearClienteNavegador> | null = null;
    (async () => {
      const r = await fetch("/api/panel/avisos", { cache: "no-store" }).catch(() => null);
      if (!r?.ok || !vivo) return;
      const datos = (await r.json()) as { avisos: Aviso[]; apagados?: string[]; falta?: boolean };
      if (datos.falta) return;
      apagados.current = new Set(datos.apagados ?? []);
      setAvisos(datos.avisos);
      try {
        cliente = crearClienteNavegador();
        canal = cliente
          .channel("avisos-panel")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "avisos" }, (cambio) => {
            const f = cambio.new as { id: number; tipo: TipoAviso; titulo: string; texto: string | null; enlace: string | null; prioridad: string; creado_en: string; es_prueba: boolean };
            if (f.es_prueba || apagados.current.has(f.tipo)) return;
            const nuevo: Aviso = { id: f.id, tipo: f.tipo, titulo: f.titulo, texto: f.texto, enlace: f.enlace, prioridad: f.prioridad, creadoEn: f.creado_en, leido: false };
            setAvisos((lista) => (lista.some((a) => a.id === nuevo.id) ? lista : [nuevo, ...lista]));
            setFlotante(nuevo);
          })
          .subscribe();
      } catch (error) {
        console.error("[avisos] tiempo real:", error);
      }
    })();
    return () => {
      vivo = false;
      if (canal && cliente) void cliente.removeChannel(canal);
    };
  }, []);

  // El aviso flotante se va solo.
  useEffect(() => {
    if (!flotante) return;
    const t = setTimeout(() => setFlotante(null), 5000);
    return () => clearTimeout(t);
  }, [flotante]);

  // Escape cierra y el foco vuelve a la campanita.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const leer = useCallback((ids: number[]) => {
    setAvisos((lista) => lista.map((a) => (ids.includes(a.id) ? { ...a, leido: true } : a)));
    void marcarLeidos(ids);
  }, []);

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-label={noLeidos ? T.botonConNuevos.replace("{n}", String(noLeidos)) : T.boton}
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="relative flex size-9 items-center justify-center text-acero transition-colors hover:text-blanco"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 7.5a4.5 4.5 0 0 1 9 0v3.5l1.5 2H3l1.5-2Z" />
          <path d="M7.5 15a1.5 1.5 0 0 0 3 0" />
        </svg>
        <AnimatePresence>
          {noLeidos > 0 ? (
            <motion.span
              key={noLeidos}
              initial={quieto ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-blanco px-1 font-plex text-[10px] font-medium text-negro"
            >
              {noLeidos > 9 ? "9+" : noLeidos}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>

      {/* Afuera del encabezado: su desenfoque de fondo haría que "fixed" se mida contra él. */}
      {montado ? createPortal(<>
      <AnimatePresence>
        {abierto ? (
          <motion.aside
            role="dialog"
            aria-label={T.titulo}
            initial={quieto ? false : { x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={quieto ? { opacity: 0 } : { x: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 top-[var(--alto-panel,3.5rem)] z-50 flex flex-col border-l border-profundo bg-negro md:left-auto md:w-96"
          >
            <header className="flex items-center justify-between gap-3 border-b border-profundo px-4 py-3">
              <p className="font-michroma text-xs uppercase tracking-etiqueta text-blanco">{T.titulo}</p>
              <div className="flex items-center gap-3 font-plex text-[11px] uppercase tracking-etiqueta">
                {noLeidos > 0 ? (
                  <button type="button" onClick={() => leer(avisos.filter((a) => !a.leido).map((a) => a.id))} className="text-acero hover:text-blanco">
                    {T.marcarTodo}
                  </button>
                ) : null}
                <Link href="/panel/avisos" onClick={() => setAbierto(false)} className="text-acero hover:text-blanco">
                  {T.preferencias}
                </Link>
                <button type="button" onClick={() => setAbierto(false)} aria-label={T.cerrar} className="text-acero hover:text-blanco">
                  ✕
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {avisos.length === 0 ? (
                <p className="py-6 font-plex text-sm text-acero">{T.vacio}</p>
              ) : (
                agrupar(avisos, new Date().toISOString()).map((g) => (
                  <section key={g.grupo} className="mb-4">
                    <p className="mb-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.grupos[g.grupo]}</p>
                    <ul className="flex flex-col gap-1">
                      {g.avisos.map((a) => (
                        <li key={a.id}>
                          <Link
                            href={a.enlace ?? "/panel"}
                            onClick={() => {
                              leer([a.id]);
                              setAbierto(false);
                            }}
                            className={`flex gap-3 border border-transparent p-2 transition-colors hover:border-profundo ${a.leido ? "opacity-60" : ""}`}
                          >
                            <span aria-hidden className="mt-1.5 size-1.5 shrink-0" style={{ background: COLOR[a.prioridad] ?? "#9C9CA3" }} />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                                {T.tipos[a.tipo]} · {T.prioridades[a.prioridad as keyof typeof T.prioridades]}
                              </span>
                              <span className="font-lectura text-sm text-blanco">{a.titulo}</span>
                              {a.texto ? <span className="font-plex text-xs text-acero">{a.texto}</span> : null}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {flotante && !abierto ? (
          <motion.div
            role="status"
            initial={quieto ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 flex max-w-sm gap-3 border border-profundo bg-negro p-3 shadow-lg"
          >
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0" style={{ background: COLOR[flotante.prioridad] ?? "#9C9CA3" }} />
            <Link href={flotante.enlace ?? "/panel"} onClick={() => leer([flotante.id])} className="flex min-w-0 flex-col gap-0.5">
              <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.tipos[flotante.tipo]}</span>
              <span className="font-lectura text-sm text-blanco">{flotante.titulo}</span>
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </>, document.body) : null}
    </>
  );
}
