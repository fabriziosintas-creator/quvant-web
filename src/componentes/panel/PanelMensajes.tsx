"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Logotipo } from "@/componentes/marca/Logotipo";
import { CHAT, PANEL } from "@/datos/textos";
import type { Conversacion, Estado, Mensaje } from "@/servidor/chat/tipos";

/**
 * El panel de mensajes: la bandeja de las charlas del chat de la web.
 *
 * Se entra con la clave del equipo eligiendo quién sos. A la izquierda,
 * la bandeja (con filtros y lo que falta leer); a la derecha, la charla
 * elegida con su pedido, sus datos de contacto y las acciones: tomarla
 * (el asistente deja de responder), devolverla al asistente, cerrarla o
 * responder (que también la toma). Todo se actualiza solo cada pocos
 * segundos. En el celular, la bandeja y la charla se ven de a una.
 *
 * El link del aviso por WhatsApp trae ?c=<id> y abre esa charla directo.
 */

type Info = {
  sesion: { nombre: string } | null;
  equipo: string[];
  configurado: boolean;
  claveDePrueba: boolean;
  almacen?: "redis" | "archivo" | "memoria";
  ia?: string | null;
  avisos?: "callmebot" | "meta" | "ninguno";
};

type Detalle = { conversacion: Conversacion; mensajes: Mensaje[] };
type Filtro = keyof typeof PANEL.filtros;

const COLOR_ESTADO: Record<Estado, string> = {
  bot: "#9C9CA3",
  "espera-humano": "#F0A33A",
  humano: "#7BD389",
  cerrada: "#26262B",
};

const FILTRAR: Record<Filtro, (c: Conversacion) => boolean> = {
  todas: () => true,
  nuevas: (c) => c.noLeidos > 0,
  pedidos: (c) => c.pedido !== null,
  esperan: (c) => c.estado === "espera-humano",
  cerradas: (c) => c.estado === "cerrada",
};

const nombreDe = (c: Conversacion) => c.pedido?.nombre ?? `${PANEL.visitante} · ${c.id.slice(0, 4).toUpperCase()}`;

function hace(fecha: number) {
  const minutos = Math.round((Date.now() - fecha) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const hora = (fecha: number) =>
  new Date(fecha).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function enlacesDeContacto(contacto: string) {
  const enlaces: { texto: string; url: string }[] = [];
  const email = contacto.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0];
  if (email) enlaces.push({ texto: PANEL.acciones.email, url: `mailto:${email}` });
  const digitos = contacto.replace(/[^\d]/g, "");
  if (!email && digitos.length >= 8) enlaces.push({ texto: PANEL.acciones.whatsapp, url: `https://wa.me/${digitos}` });
  return enlaces;
}

const pedirJson = async <T,>(url: string, opciones?: RequestInit): Promise<T> => {
  const respuesta = await fetch(url, { cache: "no-store", ...opciones });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw Object.assign(new Error(datos.error ?? "Error"), { estado: respuesta.status });
  return datos as T;
};

export function PanelMensajes() {
  const [info, setInfo] = useState<Info | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  // El link del aviso por WhatsApp trae ?c=<id>: esa charla arranca abierta.
  const [elegida, setElegida] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("c"),
  );
  const [detalleTraido, setDetalle] = useState<Detalle | null>(null);
  // Solo vale el detalle de la charla elegida (al cambiar, hasta que llega el nuevo, no se muestra el anterior).
  const detalle = detalleTraido && detalleTraido.conversacion.id === elegida ? detalleTraido : null;

  const cargarInfo = useCallback(() => pedirJson<Info>("/api/panel/sesion").then(setInfo), []);
  useEffect(() => {
    void cargarInfo();
  }, [cargarInfo]);

  const adentro = Boolean(info?.sesion);

  // La bandeja, cada 5 s.
  useEffect(() => {
    if (!adentro) return;
    const traer = () =>
      pedirJson<{ conversaciones: Conversacion[] }>("/api/panel/conversaciones")
        .then((d) => setConversaciones(d.conversaciones))
        .catch((e: { estado?: number }) => e.estado === 401 && void cargarInfo());
    void traer();
    const intervalo = setInterval(traer, 5000);
    return () => clearInterval(intervalo);
  }, [adentro, cargarInfo]);

  // La charla elegida, cada 3 s.
  useEffect(() => {
    if (!adentro || !elegida) return;
    let vigente = true;
    const traer = () =>
      pedirJson<Detalle>(`/api/panel/conversaciones/${elegida}`)
        .then((d) => vigente && setDetalle(d))
        .catch(() => undefined);
    void traer();
    const intervalo = setInterval(traer, 3000);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [adentro, elegida]);

  // Al abrir una charla con mensajes sin leer, quedan leídos.
  const noLeidosElegida = detalle?.conversacion.noLeidos ?? 0;
  useEffect(() => {
    if (!elegida || noLeidosElegida === 0) return;
    void accion("leer");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando cambia la charla o llegan mensajes nuevos
  }, [elegida, noLeidosElegida]);

  const totalSinLeer = conversaciones.reduce((suma, c) => suma + c.noLeidos, 0);
  useEffect(() => {
    document.title = `${totalSinLeer > 0 ? `(${totalSinLeer}) ` : ""}${PANEL.titulo} · Quvant`;
  }, [totalSinLeer]);

  async function accion(nombre: "leer" | "tomar" | "devolver" | "cerrar" | "reabrir" | "responder", texto?: string) {
    if (!elegida) return;
    const d = await pedirJson<Detalle>(`/api/panel/conversaciones/${elegida}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: nombre, texto }),
    });
    setDetalle(d);
    setConversaciones((lista) => lista.map((c) => (c.id === d.conversacion.id ? d.conversacion : c)));
  }

  const salir = async () => {
    await fetch("/api/panel/sesion", { method: "DELETE" });
    setConversaciones([]);
    setElegida(null);
    void cargarInfo();
  };

  if (!info) return <div className="min-h-svh bg-negro" />;
  if (!info.sesion) return <Ingreso info={info} alEntrar={cargarInfo} />;

  const visibles = conversaciones.filter(FILTRAR[filtro]);
  const avisos = [
    info.almacen === "memoria" ? PANEL.avisos.memoria : null,
    info.almacen === "archivo" ? PANEL.avisos.archivo : null,
    info.ia ? null : PANEL.avisos.sinIA,
    info.avisos === "ninguno" ? PANEL.avisos.sinWhatsApp : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-svh flex-col bg-negro">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-profundo px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logotipo idGradiente="q-panel" className="text-[12px]" />
          <span className="hidden font-plex text-[11px] uppercase tracking-etiqueta text-acero sm:inline">
            {PANEL.titulo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {info.ia ? (
            <span className="hidden items-center gap-2 border border-profundo px-2.5 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero md:flex">
              <span aria-hidden className="size-1.5 bg-[#7BD389]" />
              {info.ia}
            </span>
          ) : null}
          <span className="font-plex text-xs text-blanco">{info.sesion.nombre}</span>
          <button
            type="button"
            onClick={salir}
            className="border border-profundo px-3 py-1.5 font-plex text-[10px] uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco"
          >
            {PANEL.salir}
          </button>
        </div>
      </header>

      {avisos.length > 0 ? (
        <ul className="shrink-0 border-b border-profundo bg-profundo/25 px-4 py-2 md:px-6">
          {avisos.map((aviso) => (
            <li key={aviso} className="flex items-start gap-2 py-0.5 font-lectura text-xs text-acero">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 bg-[#F0A33A]" />
              {aviso}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {/* La bandeja. */}
        <aside
          className={`flex min-h-0 w-full flex-col border-r border-profundo md:w-[360px] md:shrink-0 ${elegida ? "max-md:hidden" : ""}`}
        >
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-profundo p-3 [scrollbar-width:none]">
            {(Object.keys(PANEL.filtros) as Filtro[]).map((clave) => {
              const cantidad = conversaciones.filter(FILTRAR[clave]).length;
              const activo = clave === filtro;
              return (
                <button
                  key={clave}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltro(clave)}
                  className={`flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 font-plex text-[10px] font-medium uppercase tracking-etiqueta transition-colors ${
                    activo ? "border-blanco bg-blanco text-negro" : "border-profundo text-acero hover:text-blanco"
                  }`}
                >
                  {PANEL.filtros[clave]}
                  <span className={activo ? "text-negro/60" : "text-acero/60"}>{cantidad}</span>
                </button>
              );
            })}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {visibles.length === 0 ? (
              <li className="p-6 font-lectura text-sm text-acero">{PANEL.vacio}</li>
            ) : (
              visibles.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setElegida(c.id)}
                    aria-current={c.id === elegida ? "true" : undefined}
                    className={`flex w-full flex-col gap-1.5 border-b border-profundo px-4 py-3.5 text-left transition-colors ${
                      c.id === elegida ? "bg-profundo/50" : "hover:bg-profundo/25"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className={`truncate font-plex text-sm ${c.noLeidos ? "font-bold text-blanco" : "text-blanco"}`}>
                        {nombreDe(c)}
                      </span>
                      <span className="shrink-0 font-plex text-[10px] text-acero">{hace(c.actualizada)}</span>
                    </span>
                    <span className="truncate font-lectura text-[13px] text-acero">
                      {c.ultimo ? `${c.ultimo.autor === "visitante" ? "" : `${PANEL.autores[c.ultimo.autor]}: `}${c.ultimo.texto}` : "—"}
                    </span>
                    <span className="flex items-center gap-2">
                      <EtiquetaEstado conversacion={c} />
                      {c.pedido ? (
                        <span className="border border-[#7BD389]/60 px-1.5 py-0.5 font-plex text-[9px] uppercase tracking-etiqueta text-[#7BD389]">
                          {PANEL.pedido}
                        </span>
                      ) : null}
                      {c.noLeidos > 0 ? (
                        <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-blanco px-1.5 font-plex text-[10px] font-bold text-negro">
                          {c.noLeidos}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        {/* La charla elegida. */}
        <section className={`min-h-0 min-w-0 flex-1 flex-col ${elegida ? "flex" : "max-md:hidden md:flex"}`}>
          {detalle ? (
            <Charla
              detalle={detalle}
              yo={info.sesion.nombre}
              alVolver={() => setElegida(null)}
              alAccion={accion}
            />
          ) : (
            <p className="m-auto p-8 font-lectura text-sm text-acero">{PANEL.elegi}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function EtiquetaEstado({ conversacion }: { conversacion: Conversacion }) {
  const color = COLOR_ESTADO[conversacion.estado];
  return (
    <span className="flex items-center gap-1.5 font-plex text-[9px] uppercase tracking-etiqueta text-acero">
      <span aria-hidden className="size-1.5" style={{ background: color }} />
      {PANEL.estados[conversacion.estado].replace("{nombre}", conversacion.atiende ?? "")}
    </span>
  );
}

function Charla({
  detalle,
  yo,
  alVolver,
  alAccion,
}: {
  detalle: Detalle;
  yo: string;
  alVolver: () => void;
  alAccion: (accion: "tomar" | "devolver" | "cerrar" | "reabrir" | "responder", texto?: string) => Promise<void>;
}) {
  const { conversacion: c, mensajes } = detalle;
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const enlaces = useMemo(() => (c.pedido ? enlacesDeContacto(c.pedido.contacto) : []), [c.pedido]);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [mensajes.length, c.id]);

  const responder = async (evento?: FormEvent) => {
    evento?.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await alAccion("responder", texto);
      setTexto("");
    } finally {
      setEnviando(false);
    }
  };
  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      void responder();
    }
  };

  const boton = (etiqueta: string, accion: "tomar" | "devolver" | "cerrar" | "reabrir", marcado = false) => (
    <button
      type="button"
      onClick={() => void alAccion(accion)}
      className={`border px-3 py-1.5 font-plex text-[10px] font-medium uppercase tracking-etiqueta transition-colors ${
        marcado ? "border-blanco bg-blanco text-negro hover:bg-acero" : "border-profundo text-acero hover:text-blanco"
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <>
      <div className="shrink-0 border-b border-profundo px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={alVolver}
              className="border border-profundo px-2.5 py-1.5 font-plex text-[10px] uppercase tracking-etiqueta text-acero md:hidden"
            >
              ← {PANEL.acciones.volver}
            </button>
            <div className="min-w-0">
              <p className="truncate font-plex text-base font-bold text-blanco">{nombreDe(c)}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <EtiquetaEstado conversacion={c} />
                <span className="font-plex text-[10px] text-acero">
                  {hora(c.creada)}
                  {c.pagina ? ` · ${PANEL.desde} ${c.pagina}` : ""}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {enlaces.map((enlace) => (
              <a
                key={enlace.url}
                href={enlace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#7BD389]/70 px-3 py-1.5 font-plex text-[10px] font-medium uppercase tracking-etiqueta text-[#7BD389] transition-colors hover:bg-[#7BD389] hover:text-negro"
              >
                {enlace.texto} ↗
              </a>
            ))}
            {c.estado === "humano" && c.atiende === yo
              ? boton(PANEL.acciones.devolver, "devolver")
              : c.estado !== "cerrada"
                ? boton(PANEL.acciones.tomar, "tomar", c.estado === "espera-humano")
                : null}
            {c.estado === "cerrada" ? boton(PANEL.acciones.reabrir, "reabrir") : boton(PANEL.acciones.cerrar, "cerrar")}
          </div>
        </div>
      </div>

      <div ref={lista} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        {c.pedido ? (
          <div className="mb-5 border border-[#7BD389]/60 p-4">
            <p className="flex items-center gap-2 font-plex text-[10px] font-medium uppercase tracking-etiqueta text-[#7BD389]">
              <span aria-hidden className="size-1.5 bg-[#7BD389]" />
              {PANEL.pedido} · {hora(c.pedido.registrado)}
            </p>
            <dl className="mt-3 grid gap-x-4 gap-y-1.5 font-lectura text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-acero">{CHAT.pedido.nombre}</dt>
              <dd className="text-blanco">{c.pedido.nombre}</dd>
              {c.pedido.empresa || c.pedido.rubro ? (
                <>
                  <dt className="text-acero">Empresa / rubro</dt>
                  <dd className="text-blanco">{[c.pedido.empresa, c.pedido.rubro].filter(Boolean).join(" · ")}</dd>
                </>
              ) : null}
              <dt className="text-acero">{CHAT.pedido.necesita}</dt>
              <dd className="text-blanco">{CHAT.necesidades[c.pedido.necesidad]}</dd>
              <dt className="text-acero">Detalle</dt>
              <dd className="text-blanco">{c.pedido.detalle}</dd>
              <dt className="text-acero">Contacto</dt>
              <dd className="break-all text-blanco">
                {c.pedido.contacto} ({c.pedido.medio})
              </dd>
            </dl>
          </div>
        ) : null}

        <ol className="flex flex-col gap-3">
          {mensajes.map((m) => {
            if (m.autor === "sistema") {
              return (
                <li key={m.id} className="self-center px-2 text-center font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                  {m.texto}
                </li>
              );
            }
            const visitante = m.autor === "visitante";
            return (
              <li key={m.id} className={`flex max-w-[80%] flex-col ${visitante ? "self-start" : "self-end items-end"}`}>
                <span className="mb-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero">
                  {visitante ? nombreDe(c) : m.autor === "humano" ? m.nombre : PANEL.autores.bot} · {hora(m.fecha)}
                </span>
                <p
                  className={`whitespace-pre-line rounded-[12px] px-3.5 py-2.5 font-lectura text-[14.5px] leading-relaxed ${
                    visitante
                      ? "rounded-bl-[3px] bg-blanco text-negro"
                      : m.autor === "humano"
                        ? "rounded-br-[3px] border border-[#7BD389] text-blanco"
                        : "rounded-br-[3px] border border-profundo bg-profundo/30 text-blanco"
                  }`}
                >
                  {m.texto}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <form onSubmit={responder} className="shrink-0 border-t border-profundo px-4 py-3 md:px-6">
        <div className="flex items-end gap-2">
          <label htmlFor="panel-respuesta" className="sr-only">
            {PANEL.responder}
          </label>
          <textarea
            id="panel-respuesta"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alTeclear}
            placeholder={PANEL.responder}
            rows={1}
            className="max-h-40 min-h-11 flex-1 resize-none border border-profundo bg-negro px-3 py-2.5 font-lectura text-[15px] text-blanco placeholder:text-acero/70 focus:border-acero focus:outline-none [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="h-11 shrink-0 bg-blanco px-5 font-plex text-[11px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero disabled:opacity-40"
          >
            {PANEL.enviar}
          </button>
        </div>
        {!(c.estado === "humano" && c.atiende === yo) ? (
          <p className="mt-2 font-lectura text-xs text-acero">{PANEL.notaTomar}</p>
        ) : null}
      </form>
    </>
  );
}

function Ingreso({ info, alEntrar }: { info: Info; alEntrar: () => Promise<void> }) {
  const [nombre, setNombre] = useState(info.equipo[0] ?? "");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (evento: FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await pedirJson("/api/panel/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, clave }),
      });
      await alEntrar();
    } catch (falla) {
      setError(falla instanceof Error ? falla.message : "Error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-negro px-5">
      <form onSubmit={entrar} className="w-full max-w-sm border border-profundo p-7 md:p-9">
        <Logotipo idGradiente="q-ingreso" className="text-[14px]" />
        <h1 className="mt-8 font-plex text-2xl font-bold text-blanco">{PANEL.titulo}</h1>
        {!info.configurado ? (
          <p className="mt-6 font-lectura text-sm text-[#F26B5B]">{PANEL.ingreso.sinConfigurar}</p>
        ) : (
          <>
            <fieldset className="mt-7">
              <legend className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
                {PANEL.ingreso.quien}
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {info.equipo.map((persona) => (
                  <label
                    key={persona}
                    className={`cursor-pointer border px-3 py-2.5 text-center font-plex text-sm transition-colors ${
                      persona === nombre ? "border-blanco text-blanco" : "border-profundo text-acero hover:text-blanco"
                    }`}
                  >
                    <input
                      type="radio"
                      name="nombre"
                      value={persona}
                      checked={persona === nombre}
                      onChange={() => setNombre(persona)}
                      className="sr-only"
                    />
                    {persona}
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="panel-clave" className="mt-6 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
              {PANEL.ingreso.clave}
            </label>
            <input
              id="panel-clave"
              type="password"
              autoComplete="current-password"
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
              className="mt-2 h-11 w-full border border-profundo bg-negro px-3 font-plex text-sm text-blanco focus:border-acero focus:outline-none"
            />
            {error ? (
              <p role="alert" className="mt-3 font-lectura text-sm text-[#F26B5B]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={enviando || !clave}
              className="mt-6 h-12 w-full bg-blanco font-plex text-[12px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero disabled:opacity-40"
            >
              {PANEL.ingreso.entrar}
            </button>
            {info.claveDePrueba ? (
              <p className="mt-4 font-lectura text-xs text-acero">{PANEL.ingreso.claveDePrueba}</p>
            ) : null}
          </>
        )}
      </form>
    </main>
  );
}
