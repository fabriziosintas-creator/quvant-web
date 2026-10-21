"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { agregarReciente, type Reciente, type Resultado, type TipoResultado } from "@/buscador/buscador";
import { ACENTO_NICHO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";

/**
 * El buscador rápido del panel: Ctrl+K (Cmd+K en Mac), "/" o la lupa del
 * encabezado. Diálogo modal con el foco adentro, lista como listbox,
 * flechas para recorrer, Enter para abrir y Escape para cerrar (el foco
 * vuelve a donde estaba). En el celular ocupa toda la pantalla.
 *
 * Una llamada por tecla (espera de 150 ms, cancelando la anterior). Los
 * recientes quedan solo en este navegador.
 */

const B = PANEL_ADMIN.buscador;
const CLAVE_RECIENTES = "quvant:buscador:recientes";
const ORDEN: TipoResultado[] = ["accion", "pagina", "local", "cliente", "oportunidad", "registro", "socio", "objetivo", "nicho", "charla"];
const ICONO: Record<TipoResultado, string> = { accion: "→", pagina: "◇", local: "⌂", cliente: "●", socio: "○", registro: "@", oportunidad: "◆", objetivo: "◎", nicho: "■", charla: "✉" };
const SUGERENCIAS: Reciente[] = [
  ...B.acciones.slice(0, 4).map((a) => ({ tipo: "accion" as const, titulo: a.titulo, contexto: "", enlace: a.enlace, nicho: null })),
  { tipo: "pagina", titulo: "Hoy", contexto: "/panel", enlace: "/panel", nicho: null },
  { tipo: "pagina", titulo: "Mapa", contexto: "/panel/mapa", enlace: "/panel/mapa", nicho: null },
];

const sinSuscripcion = () => () => {};
const acento = (nicho: string | null) => (nicho && nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : null);

function leerRecientes(): Reciente[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE_RECIENTES) ?? "[]");
    return Array.isArray(v) ? (v as Reciente[]).filter((r) => typeof r?.enlace === "string" && r.enlace.startsWith("/panel")) : [];
  } catch {
    return [];
  }
}

const escribiendo = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function Buscador() {
  const router = useRouter();
  const quieto = useReducedMotion();
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [recientes, setRecientes] = useState<Reciente[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [falta, setFalta] = useState(false);
  const [activo, setActivo] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);
  const anterior = useRef<HTMLElement | null>(null);
  const idLista = useId();

  const abrir = useCallback(() => {
    anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRecientes(leerRecientes());
    setTexto("");
    setResultados([]);
    setActivo(0);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => {
    setAbierto(false);
    // El foco vuelve a donde estaba.
    requestAnimationFrame(() => anterior.current?.focus());
  }, []);

  // Ctrl+K / Cmd+K desde cualquier lado; "/" si no se está escribiendo.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (abierto) cerrar();
        else abrir();
      } else if (e.key === "/" && !abierto && !escribiendo(e.target)) {
        e.preventDefault();
        abrir();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto, abrir, cerrar]);

  useEffect(() => {
    if (abierto) entrada.current?.focus();
  }, [abierto]);

  // Una llamada por tecla: 150 ms de espera y se cancela la anterior.
  useEffect(() => {
    if (!abierto) return;
    const q = texto.trim();
    // Con menos de 2 letras se muestran recientes y sugerencias (ver "vacio").
    if (q.length < 2) return;
    const control = new AbortController();
    const reloj = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/panel/buscar?q=${encodeURIComponent(q)}`, { signal: control.signal, cache: "no-store" });
        if (!r.ok) return;
        const datos = (await r.json()) as { resultados: Resultado[]; falta?: boolean };
        setResultados(datos.resultados);
        setFalta(Boolean(datos.falta));
        setActivo(0);
      } catch {
        // Cancelada por la tecla siguiente, o sin señal: queda lo anterior.
      } finally {
        if (!control.signal.aborted) setBuscando(false);
      }
    }, 150);
    return () => {
      clearTimeout(reloj);
      control.abort();
    };
  }, [texto, abierto]);

  const vacio = texto.trim().length < 2;
  const lista: Array<Reciente & { id?: string }> = vacio ? (recientes.length ? recientes : SUGERENCIAS) : resultados;
  const grupos = vacio
    ? [{ titulo: recientes.length ? B.recientes : B.sugerencias, items: lista.map((r, i) => ({ r, i })) }]
    : ORDEN.map((tipo) => ({ titulo: B.grupos[tipo], items: lista.map((r, i) => ({ r, i })).filter(({ r }) => r.tipo === tipo) })).filter((g) => g.items.length > 0);
  // El orden en pantalla (agrupado) manda para las flechas.
  const enPantalla = grupos.flatMap((g) => g.items.map((x) => x.i));

  const ir = (r: Reciente) => {
    const nuevos = agregarReciente(leerRecientes(), { tipo: r.tipo, titulo: r.titulo, contexto: r.contexto, enlace: r.enlace, nicho: r.nicho });
    try {
      window.localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(nuevos));
    } catch {
      // Sin localStorage, no hay recientes: nada más cambia.
    }
    setAbierto(false);
    router.push(r.enlace);
  };

  const alTeclearEnLista = (e: React.KeyboardEvent) => {
    const pos = enPantalla.indexOf(activo);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo(enPantalla[Math.min(pos + 1, enPantalla.length - 1)] ?? 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo(enPantalla[Math.max(pos - 1, 0)] ?? 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const elegido = lista[activo];
      if (elegido) ir(elegido);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "Tab") {
      // El foco queda adentro del diálogo.
      const focos = dialogo.current?.querySelectorAll<HTMLElement>("input, button");
      if (!focos?.length) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  };

  // Que la opción activa se vea al recorrer con las flechas.
  useEffect(() => {
    document.getElementById(`${idLista}-${activo}`)?.scrollIntoView({ block: "nearest" });
  }, [activo, idLista]);

  const pideVisita = /^(nueva |cargar )?visita/i.test(texto.trim());

  return (
    <>
      <button type="button" onClick={abrir} aria-label={B.boton} title={B.boton} className="flex size-9 items-center justify-center text-acero transition-colors hover:text-blanco">
        <svg aria-hidden width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7.5" cy="7.5" r="5" />
          <path d="m11.5 11.5 4 4" />
        </svg>
      </button>
      {montado
        ? createPortal(
            <AnimatePresence>
              {abierto ? (
                <motion.div key="fondo" className="fixed inset-0 z-[60] bg-negro/70 backdrop-blur-sm md:pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: quieto ? 0 : 0.15 }} onMouseDown={(e) => e.target === e.currentTarget && cerrar()}>
                  <motion.div
                    ref={dialogo}
                    role="dialog"
                    aria-modal="true"
                    aria-label={B.titulo}
                    onKeyDown={alTeclearEnLista}
                    initial={quieto ? false : { y: -12, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={quieto ? { opacity: 0 } : { y: -8, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mx-auto flex h-full w-full flex-col border-profundo bg-negro md:h-auto md:max-h-[70vh] md:max-w-2xl md:border"
                  >
                    <div className="flex items-center gap-3 border-b border-profundo px-4">
                      <svg aria-hidden width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-acero">
                        <circle cx="7.5" cy="7.5" r="5" />
                        <path d="m11.5 11.5 4 4" />
                      </svg>
                      <input
                        ref={entrada}
                        type="text"
                        role="combobox"
                        aria-expanded={lista.length > 0}
                        aria-controls={idLista}
                        aria-autocomplete="list"
                        aria-activedescendant={lista.length ? `${idLista}-${activo}` : undefined}
                        value={texto}
                        onChange={(e) => {
                          setTexto(e.target.value);
                          if (e.target.value.trim().length < 2) {
                            setResultados([]);
                            setBuscando(false);
                          }
                        }}
                        placeholder={B.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-14 min-w-0 flex-1 bg-transparent font-lectura text-base text-blanco placeholder:text-acero/70 focus:outline-none"
                      />
                      <button type="button" onClick={cerrar} className="shrink-0 font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
                        Esc
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                      {pideVisita ? <p className="px-2 py-1 font-plex text-[11px] text-acero">{B.visita}</p> : null}
                      {falta && !vacio ? <p className="px-2 py-1 font-plex text-[11px] text-acero">{B.falta}</p> : null}
                      {!vacio && !buscando && resultados.length === 0 ? <p className="px-2 py-6 font-plex text-sm text-acero">{B.sinResultados.replace("{q}", texto.trim())}</p> : null}
                      <div id={idLista} role="listbox" aria-label={B.titulo}>
                        {grupos.map((g) => (
                          <div key={g.titulo} role="group" aria-label={g.titulo} className="mb-2">
                            <p aria-hidden className="px-2 pb-1 pt-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                              {g.titulo}
                            </p>
                            {g.items.map(({ r, i }) => {
                              const color = acento(r.nicho);
                              return (
                                <div
                                  key={`${r.enlace}-${i}`}
                                  id={`${idLista}-${i}`}
                                  role="option"
                                  aria-selected={i === activo}
                                  onMouseMove={() => setActivo(i)}
                                  onClick={() => ir(r)}
                                  className="flex cursor-pointer items-center gap-3 px-2 py-2 aria-selected:bg-profundo/60"
                                >
                                  <span aria-hidden className="flex w-5 shrink-0 justify-center font-plex text-xs text-acero">
                                    {ICONO[r.tipo]}
                                  </span>
                                  <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate font-lectura text-sm text-blanco">{r.titulo}</span>
                                    {r.contexto ? <span className="truncate font-plex text-[11px] text-acero">{r.contexto}</span> : null}
                                  </span>
                                  {color ? <span aria-hidden className="size-2 shrink-0" style={{ background: color }} /> : null}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="hidden border-t border-profundo px-4 py-2 font-plex text-[10px] uppercase tracking-etiqueta text-acero md:block">{buscando ? B.buscando : B.ayuda}</p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
