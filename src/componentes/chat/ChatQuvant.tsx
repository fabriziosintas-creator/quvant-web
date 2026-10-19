"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { usePathname } from "next/navigation";
import { IsotipoQ } from "@/componentes/marca/IsotipoQ";
import { ACENTO_CANAL } from "@/datos/colores";
import { CHAT } from "@/datos/textos";
import type { Estado, Mensaje, Pedido, VistaVisitante } from "@/servidor/chat/tipos";

/**
 * "Hablemos ahora": el chat de Quvant, abajo a la derecha en todo el sitio.
 *
 * Computadora: una píldora fija abajo a la derecha (con la invitación);
 * la ventana se abre encima, chica.
 * Celular: el botón es la Q del medio de la barra de canales (DockCanales),
 * así no flota nada encima del contenido; el chat se abre a pantalla completa.
 *
 * Responde el asistente (api/chat). Si alguien del equipo toma la charla
 * desde el panel, sus mensajes llegan solos: el chat pregunta cada pocos
 * segundos mientras está abierto (y cada tanto cerrado, si espera a una
 * persona, para avisar con un número sobre el botón). La conversación se
 * recuerda en este navegador (localStorage).
 *
 * Cualquier botón del sitio lo puede abrir con el evento "quvant:abrir-chat".
 */

const CLAVE_ID = "quvant-chat-id";
const CLAVE_INVITACION = "quvant-chat-invitacion";
const VERDE = ACENTO_CANAL.contacto;

const leer = (clave: string) => {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
};
const escribir = (clave: string, valor: string) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento: la charla dura lo que dure la pestaña.
  }
};

/** El mensaje del visitante que se muestra mientras viaja (después lo reemplaza el del servidor). */
function mensajeProvisorio(texto: string): Mensaje {
  const ahora = Date.now();
  return { id: `local-${ahora}`, autor: "visitante", nombre: null, texto, fecha: ahora };
}

export function abrirChat(texto?: string) {
  window.dispatchEvent(new CustomEvent("quvant:abrir-chat", { detail: { texto } }));
}

/* Los mensajes del equipo sin leer, para el botón de la barra del celular. */
let sinLeerCompartido = 0;
const oyentes = new Set<() => void>();
function publicarSinLeer(cantidad: number) {
  sinLeerCompartido = cantidad;
  for (const oyente of oyentes) oyente();
}
export function useSinLeerChat() {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    () => sinLeerCompartido,
    () => 0,
  );
}

export function ChatQuvant() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  // La charla de este navegador, si ya había una (no cambia lo que se dibuja en el servidor).
  const [id, setId] = useState<string | null>(() => (typeof window === "undefined" ? null : leer(CLAVE_ID) || null));
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [estado, setEstado] = useState<Estado>("bot");
  const [atiende, setAtiende] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sinLeer, setSinLeer] = useState(0);
  const [invitacion, setInvitacion] = useState(false);

  useEffect(() => publicarSinLeer(sinLeer), [sinLeer]);

  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const abiertoRef = useRef(abierto);
  useEffect(() => {
    abiertoRef.current = abierto;
  }, [abierto]);

  const incorporar = useCallback((vista: VistaVisitante, contarSinLeer: boolean) => {
    setEstado(vista.estado);
    setAtiende(vista.atiende);
    setPedido(vista.pedido);
    if (vista.mensajes.length === 0) return;
    setMensajes((actuales) => {
      const conocidos = new Set(actuales.map((m) => m.id));
      const nuevos = vista.mensajes.filter((m) => !conocidos.has(m.id));
      if (contarSinLeer) {
        const delEquipo = nuevos.filter((m) => m.autor === "humano").length;
        if (delEquipo) setSinLeer((n) => n + delEquipo);
      }
      return [...actuales.filter((m) => !m.id.startsWith("local-")), ...nuevos];
    });
  }, []);

  // Al llegar: si ya había una charla en este navegador, se recupera.
  useEffect(() => {
    const guardado = leer(CLAVE_ID);
    if (!guardado) return;
    fetch(`/api/chat?conversacion=${guardado}&desde=0`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((vista: VistaVisitante | null) => {
        if (vista) incorporar(vista, false);
        else {
          setId(null);
          escribir(CLAVE_ID, "");
        }
      })
      .catch(() => undefined);
  }, [incorporar]);

  // La invitación aparece una sola vez, a los pocos segundos.
  useEffect(() => {
    if (leer(CLAVE_INVITACION) || leer(CLAVE_ID)) return;
    const temporizador = setTimeout(() => setInvitacion(true), 9000);
    return () => clearTimeout(temporizador);
  }, []);

  const cerrarInvitacion = () => {
    setInvitacion(false);
    escribir(CLAVE_INVITACION, "vista");
  };

  // Lo nuevo del equipo: seguido con el chat abierto; cada tanto, cerrado, si espera a una persona.
  const ultimaFecha = mensajes.reduce((max, m) => (m.id.startsWith("local-") ? max : Math.max(max, m.fecha)), 0);
  useEffect(() => {
    if (!id) return;
    const esperaPersona = estado === "espera-humano" || estado === "humano";
    if (!abierto && !esperaPersona) return;
    const intervalo = setInterval(
      () => {
        fetch(`/api/chat?conversacion=${id}&desde=${ultimaFecha}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((vista: VistaVisitante | null) => vista && incorporar(vista, !abiertoRef.current))
          .catch(() => undefined);
      },
      abierto ? 4000 : 15000,
    );
    return () => clearInterval(intervalo);
  }, [id, abierto, estado, ultimaFecha, incorporar]);

  // Abrir desde otros botones del sitio.
  useEffect(() => {
    const alPedir = (evento: Event) => {
      const detalle = (evento as CustomEvent<{ texto?: string }>).detail;
      setAbierto(true);
      setSinLeer(0);
      setInvitacion(false);
      escribir(CLAVE_INVITACION, "vista");
      if (detalle?.texto) setTexto(detalle.texto);
    };
    window.addEventListener("quvant:abrir-chat", alPedir);
    return () => window.removeEventListener("quvant:abrir-chat", alPedir);
  }, []);

  // Abierto: Esc lo cierra, el foco va al campo y en el celular la página de atrás no se mueve.
  useEffect(() => {
    document.documentElement.classList.toggle("chat-abierto", abierto);
    if (!abierto) return;
    entrada.current?.focus({ preventScroll: true });
    const alTeclear = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  // Siempre a la vista el último mensaje.
  useEffect(() => {
    const caja = lista.current;
    if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: "smooth" });
  }, [mensajes, enviando, abierto, pedido]);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || enviando) return;
    setError(null);
    setTexto("");
    setEnviando(true);
    const temporal = mensajeProvisorio(limpio);
    setMensajes((actuales) => [...actuales, temporal]);
    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversacion: id, texto: limpio, pagina: ruta }),
      });
      const datos = (await respuesta.json()) as VistaVisitante & { error?: string };
      if (!respuesta.ok) throw new Error(datos.error ?? CHAT.error);
      if (datos.conversacion !== id) {
        setId(datos.conversacion);
        escribir(CLAVE_ID, datos.conversacion);
      }
      incorporar(datos, false);
    } catch (falla) {
      setMensajes((actuales) => actuales.filter((m) => m.id !== temporal.id));
      setTexto(limpio);
      setError(falla instanceof Error ? falla.message : CHAT.error);
    } finally {
      setEnviando(false);
    }
  };

  const alEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    void enviar(texto);
  };

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      void enviar(texto);
    }
  };

  const lineaEstado = CHAT.estados[estado].replace("{nombre}", atiende ?? "alguien del equipo");
  const conPersona = estado === "humano";

  return (
    <>
      {/* El botón (y la invitación), cuando el chat está cerrado. */}
      {!abierto ? (
        <div className="chat-lanzador fixed bottom-6 right-6 z-[60] hidden flex-col items-end gap-3 md:flex">
          {invitacion ? (
            <div className="charla-burbuja relative w-64 rounded-[16px] border border-profundo bg-negro/95 p-4 pr-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md">
              <p className="titulo text-sm text-blanco">{CHAT.invitacion.titulo}</p>
              <p className="mt-1 font-lectura text-sm text-acero">{CHAT.invitacion.texto}</p>
              <button
                type="button"
                onClick={cerrarInvitacion}
                aria-label={CHAT.invitacion.cerrar}
                className="absolute right-2 top-2 flex size-7 items-center justify-center font-plex text-xs text-acero hover:text-blanco"
              >
                ✕
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setAbierto(true);
              setSinLeer(0);
              cerrarInvitacion();
            }}
            aria-label={CHAT.abrir}
            aria-expanded={false}
            className="group relative flex h-12 items-center justify-center gap-3 rounded-full border border-profundo bg-negro/90 pl-3 pr-5 shadow-[0_18px_50px_-14px_rgba(0,0,0,0.95)] backdrop-blur-md transition-colors hover:border-[var(--verde)]"
            style={{ "--verde": VERDE } as CSSProperties}
          >
            <IsotipoQ idGradiente="q-chat-boton" className="size-6" />
            <span className="font-plex text-xs font-medium uppercase tracking-[0.14em] text-blanco">
              {CHAT.lanzador}
            </span>
            <span
              aria-hidden
              className="-ml-1 size-2 motion-safe:animate-[parpadeo_1.6s_steps(2,end)_infinite]"
              style={{ background: VERDE }}
            />
            {sinLeer > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-blanco px-1.5 font-plex text-xs font-bold text-negro">
                {sinLeer}
                <span className="sr-only"> {CHAT.sinLeer}</span>
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {/* La ventana del chat. */}
      {abierto ? (
        <section
          role="dialog"
          aria-label={`${CHAT.titulo}: ${lineaEstado}`}
          className="fixed inset-0 z-[65] flex flex-col bg-negro pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:inset-auto md:bottom-6 md:right-6 md:h-[min(640px,calc(100svh-3rem))] md:w-[390px] md:overflow-hidden md:rounded-[16px] md:border md:border-profundo md:pb-0 md:pt-0 md:shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)]"
        >
          {/* Arriba: quién responde. */}
          <header className="flex items-center gap-3 border-b border-profundo px-4 py-3">
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-profundo">
              <IsotipoQ idGradiente="q-chat-cabecera" className="size-6" />
              <span
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-negro"
                style={{ background: estado === "cerrada" ? "#9C9CA3" : VERDE }}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-michroma text-sm uppercase tracking-marca text-blanco">{CHAT.titulo}</p>
              <p className="truncate font-plex text-xs text-acero" aria-live="polite">
                {lineaEstado}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={CHAT.cerrar}
              className="flex size-9 items-center justify-center border border-profundo font-plex text-sm text-blanco transition-colors hover:border-acero"
            >
              ✕
            </button>
          </header>

          {/* La charla. */}
          <div
            ref={lista}
            data-lenis-prevent
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-5"
          >
            <Burbuja autor="bot" texto={CHAT.bienvenida} />
            {mensajes.length === 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {CHAT.sugerencias.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => void enviar(sugerencia)}
                    className="border border-profundo px-3 py-2 text-left font-lectura text-[13px] text-blanco transition-colors hover:border-[var(--verde)]"
                    style={{ "--verde": VERDE } as CSSProperties}
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            ) : null}
            {mensajes.map((mensaje) => (
              <Burbuja key={mensaje.id} autor={mensaje.autor} texto={mensaje.texto} nombre={mensaje.nombre} />
            ))}
            {enviando && !conPersona && estado !== "espera-humano" ? (
              <span className="flex items-center gap-1 self-start px-1 py-2" role="status" aria-label={CHAT.escribiendo}>
                {[0, 1, 2].map((p) => (
                  <span
                    key={p}
                    className="size-1.5 rounded-full bg-acero motion-safe:animate-[latido_1s_var(--ease-vaiven)_infinite]"
                    style={{ animationDelay: `${p * 0.15}s` }}
                  />
                ))}
              </span>
            ) : null}
            {pedido ? <TarjetaPedido pedido={pedido} /> : null}
          </div>

          {/* Abajo: escribir. */}
          <form onSubmit={alEnviar} className="border-t border-profundo px-3 pb-3 pt-3">
            {error ? (
              <p role="alert" className="mb-2 px-1 font-lectura text-xs text-[#F26B5B]">
                {error}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <label htmlFor="chat-entrada" className="sr-only">
                {CHAT.marcador}
              </label>
              <textarea
                id="chat-entrada"
                ref={entrada}
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                onKeyDown={alTeclear}
                placeholder={CHAT.marcador}
                rows={1}
                maxLength={1200}
                className="max-h-32 min-h-11 flex-1 resize-none border border-profundo bg-negro px-3 py-2.5 font-lectura text-[15px] text-blanco placeholder:text-acero/70 focus:border-acero focus:outline-none [field-sizing:content]"
              />
              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                aria-label={CHAT.enviar}
                className="flex size-11 shrink-0 items-center justify-center bg-blanco font-plex text-base text-negro transition-colors hover:bg-acero disabled:opacity-40"
              >
                →
              </button>
            </div>
            <p className="mt-2 px-1 font-plex text-xs leading-snug text-acero/80">{CHAT.privacidad}</p>
          </form>
        </section>
      ) : null}
    </>
  );
}

function Burbuja({ autor, texto, nombre }: { autor: Mensaje["autor"]; texto: string; nombre?: string | null }) {
  if (autor === "sistema") {
    return (
      <p className="charla-burbuja flex items-center gap-2 self-center px-2 text-center font-plex text-xs uppercase tracking-etiqueta text-acero">
        <span aria-hidden className="size-1" style={{ background: VERDE }} />
        {texto}
      </p>
    );
  }
  const delVisitante = autor === "visitante";
  return (
    <div className={`charla-burbuja flex max-w-[86%] flex-col ${delVisitante ? "self-end items-end" : "self-start"}`}>
      {autor === "humano" ? (
        <span className="mb-1 flex items-center gap-2 font-plex text-xs uppercase tracking-etiqueta" style={{ color: VERDE }}>
          <span aria-hidden className="size-1.5" style={{ background: VERDE }} />
          {nombre} · {CHAT.equipo}
        </span>
      ) : null}
      <p
        className={`whitespace-pre-line rounded-[10px] px-3.5 py-2.5 font-lectura text-[14.5px] leading-relaxed ${
          delVisitante
            ? "rounded-br-[3px] bg-blanco text-negro"
            : autor === "humano"
              ? "rounded-bl-[3px] border text-blanco"
              : "rounded-bl-[3px] border border-profundo bg-profundo/30 text-blanco"
        }`}
        style={autor === "humano" ? { borderColor: VERDE } : undefined}
      >
        <ConLinks texto={texto} />
      </p>
    </div>
  );
}

/** Los links del texto, clickeables (se abren en otra pestaña; los del propio sitio, en la misma). */
function ConLinks({ texto }: { texto: string }) {
  const partes = texto.split(/(https?:\/\/[^\s)]+[^\s).,;:!?])/g);
  return (
    <>
      {partes.map((parte, i) => {
        if (i % 2 === 0) return parte;
        let propio = false;
        try {
          propio = new URL(parte).host === window.location.host;
        } catch {
          // Si no es una URL válida, va como texto.
          return parte;
        }
        return (
          <a
            key={i}
            href={parte}
            {...(propio ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className="break-all underline decoration-current/40 underline-offset-2 hover:decoration-current"
          >
            {parte.replace(/^https?:\/\//, "")}
          </a>
        );
      })}
    </>
  );
}

function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  return (
    <div className="charla-burbuja mt-1 border p-4" style={{ borderColor: VERDE }}>
      <p className="flex items-center gap-2 font-plex text-xs font-medium uppercase tracking-etiqueta" style={{ color: VERDE }}>
        <span aria-hidden className="size-1.5" style={{ background: VERDE }} />
        {CHAT.pedido.titulo}
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-lectura text-[13px]">
        <dt className="text-acero">{CHAT.pedido.nombre}</dt>
        <dd className="text-blanco">{pedido.nombre}</dd>
        <dt className="text-acero">{CHAT.pedido.necesita}</dt>
        <dd className="text-blanco">{CHAT.necesidades[pedido.necesidad]}</dd>
        <dt className="text-acero">{CHAT.pedido.contacto}</dt>
        <dd className="break-all text-blanco">{pedido.contacto}</dd>
      </dl>
    </div>
  );
}
