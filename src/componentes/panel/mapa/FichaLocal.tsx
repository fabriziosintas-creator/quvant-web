"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { fecha } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import { borrarLocal, cambiarEstadoLocal, ubicarLocal } from "@/servidor/panel/locales";
import type { Admin, Local, Visita } from "@/servidor/panel/mapa";
import { encolar, esErrorDeRed } from "@/sinconexion/sincronizador";
import { FormularioVisita } from "./FormularioVisita";
import { Marcador, descripcionDe } from "./Marcador";
import { Historial } from "@/componentes/panel/bitacora/Historial";

const T = PANEL_ADMIN.mapa;

/**
 * Los dos botones de Google son solo links: abren la app o la web de
 * Google Maps, sin API ni clave. Con coordenadas si las hay; si no, por
 * nombre y dirección.
 */
const destinoDe = (local: Local) =>
  local.latitud !== null && local.longitud !== null ? `${local.latitud},${local.longitud}` : [local.nombre, local.direccion, local.ciudad].filter(Boolean).join(", ");
const urlComoLlegar = (local: Local) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinoDe(local))}`;
/** El link guardado del local (el que se pegó) es el mejor: abre la ficha de Google del lugar. */
const urlVerEnGoogle = (local: Local) => local.link_google_maps ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinoDe(local))}`;

/** La ficha de un local: qué pasó, qué sigue y los botones para actuar desde la calle. */
export function FichaLocal({
  local,
  visitas,
  admins,
  yo,
  nombreNicho,
  alCerrar,
  conVisita = false,
}: {
  local: Local;
  visitas: Visita[];
  admins: Admin[];
  yo: string;
  nombreNicho: (id: string | null) => string;
  alCerrar: () => void;
  /** Abrir con el formulario de visita desplegado. */
  conVisita?: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(conVisita);
  const [ubicando, setUbicando] = useState<"" | "buscando" | "error">("");
  const [, iniciar] = useTransition();
  const nombreDe = (id: string) => {
    const a = admins.find((x) => x.id === id);
    return a ? `${a.nombre}${a.apellido ? ` ${a.apellido}` : ""}` : "—";
  };

  const ubicarAca = () => {
    if (!("geolocation" in navigator)) return setUbicando("error");
    setUbicando("buscando");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const datos = new FormData();
        datos.set("id", local.id);
        datos.set("latitud", String(posicion.coords.latitude));
        datos.set("longitud", String(posicion.coords.longitude));
        iniciar(async () => {
          await ubicarLocal(datos);
          setUbicando("");
          router.refresh();
        });
      },
      () => setUbicando("error"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  // Sin señal, el cambio de estado queda en el teléfono y se manda solo al volver.
  const [estadoGuardado, setEstadoGuardado] = useState(false);
  const guardarEstado = async (datos: FormData) => {
    const titulo = PANEL_ADMIN.sinSenal.tituloEstado.replace("{n}", local.nombre);
    const aDatos = () => Object.fromEntries([...datos.entries()].map(([k, v]) => [k, String(v)]));
    if (navigator.onLine === false) return setEstadoGuardado(await encolar("estado", aDatos(), titulo));
    try {
      await cambiarEstadoLocal(datos);
      setEstadoGuardado(false);
    } catch (error) {
      if (!esErrorDeRed(error)) throw error;
      setEstadoGuardado(await encolar("estado", aDatos(), titulo));
    }
  };

  const confirmarBorrado =(evento: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(T.ficha.confirmarBorrar.replace("{nombre}", local.nombre))) evento.preventDefault();
  };

  return (
    <article aria-label={local.nombre} className="flex flex-col gap-5 border border-blanco/40 bg-negro p-4 md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex w-6 justify-center pt-1">
            <Marcador local={local} grande />
          </span>
          <div className="min-w-0">
            <h3 className="font-lectura text-lg font-semibold leading-snug text-blanco">{local.nombre}</h3>
            <p className="mt-1 font-plex text-xs text-acero">
              {[nombreNicho(local.nicho_id), local.rubro, [local.direccion, local.ciudad].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
              {descripcionDe(local)}
              {local.contacto ? ` · ${T.ficha.atendio.replace("{nombre}", local.contacto)}` : ""}
              {local.origen === "importado" ? ` · ${T.ficha.importado}` : ""}
              {local.es_prueba ? ` · ${T.ficha.prueba}` : ""}
            </p>
          </div>
        </div>
        <button type="button" onClick={alCerrar} className="shrink-0 font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
          {T.ficha.cerrar}
        </button>
      </header>

      <dl className="grid grid-cols-3 gap-3 font-plex text-xs">
        <div>
          <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{T.ficha.visitas}</dt>
          <dd className="mt-1 text-base tabular-nums text-blanco">{local.cantidad_visitas}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{T.ficha.ultimoFeedback}</dt>
          <dd className="mt-1 text-blanco">{local.ultimo_feedback ? T.feedback[local.ultimo_feedback] : "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-etiqueta text-acero">{T.ficha.proxima}</dt>
          <dd className="mt-1 tabular-nums text-blanco">{local.proxima_visita ? fecha(local.proxima_visita) : "—"}</dd>
        </div>
      </dl>

      {local.latitud === null ? (
        <p className="border border-profundo p-3 font-lectura text-sm text-acero">{local.ubicacion_pendiente ? T.ficha.ubicandoImportado : T.ficha.sinCoordenadas}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCargando((c) => !c)} aria-expanded={cargando} className="rounded-full inline-flex h-11 items-center bg-blanco px-5 font-lectura text-sm font-medium text-negro hover:bg-acero">
          {T.ficha.cargarVisita}
        </button>
        <a href={urlComoLlegar(local)} target="_blank" rel="noopener noreferrer" className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {T.ficha.comoLlegar}
        </a>
        <a href={urlVerEnGoogle(local)} target="_blank" rel="noopener noreferrer" className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {T.ficha.verEnGoogle}
        </a>
        <Link href={`/panel/comercial/nueva?local=${local.id}`} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {PANEL_ADMIN.comercial.crearDesde}
        </Link>
        {local.telefono ? (
          <a href={`tel:${local.telefono.replace(/[^\d+]/g, "")}`} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
            {T.ficha.llamar}
          </a>
        ) : null}
        <button type="button" onClick={ubicarAca} disabled={ubicando === "buscando"} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {ubicando === "buscando" ? T.local.ubicando : T.ficha.ubicarAca}
        </button>
      </div>
      {ubicando === "error" ? <p className="font-plex text-xs text-acero">{T.local.sinUbicacion}</p> : null}

      {cargando ? (
        <section aria-label={T.visita.titulo} className="border-t border-profundo pt-5">
          <FormularioVisita localId={local.id} nombreLocal={local.nombre} admins={admins} yo={yo} alGuardar={() => setCargando(false)} />
        </section>
      ) : null}

      {/* Estado, volver y próxima visita: lo que no sale de una visita. */}
      {estadoGuardado ? <p role="status" className="font-plex text-xs text-acero">{PANEL_ADMIN.sinSenal.guardado}</p> : null}
      <form action={guardarEstado} className="grid gap-3 border-t border-profundo pt-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="id" value={local.id} />
        <label>
          <span className={CLASE_ETIQUETA}>{T.ficha.estado}</span>
          <select name="estado" defaultValue={local.estado} className={CLASE_CAMPO}>
            {Object.entries(T.estados).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={CLASE_ETIQUETA}>{T.ficha.volver}</span>
          <select name="volver" defaultValue={local.volver ?? ""} className={CLASE_CAMPO}>
            <option value="">—</option>
            {Object.entries(T.volver).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={CLASE_ETIQUETA}>{T.ficha.proxima}</span>
          <input type="date" name="proxima" defaultValue={local.proxima_visita ?? ""} className={CLASE_CAMPO} />
        </label>
        <button type="submit" className="h-[46px] border border-profundo px-4 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
          {T.ficha.guardar}
        </button>
      </form>

      <section aria-label={T.ficha.historial} className="border-t border-profundo pt-5">
        <p className="mb-3 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{T.ficha.historial}</p>
        {visitas.length === 0 ? (
          <p className="font-lectura text-sm text-acero">{T.ficha.sinHistorial}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {visitas.map((v) => (
              <li key={v.id} className="flex flex-col gap-1 border-l border-profundo pl-3">
                <p className="font-plex text-xs text-blanco">
                  <span className="tabular-nums">{fecha(v.fecha)}</span> · {T.feedback[v.feedback]}
                  {v.volver ? ` · ${T.ficha.volver.toLowerCase()}: ${T.volver[v.volver].toLowerCase()}` : ""}
                  <span className="text-acero"> · {T.ficha.fue.replace("{nombre}", nombreDe(v.visitante_id))}</span>
                </p>
                {v.que_se_mostro ? <p className="font-plex text-xs text-acero">{T.ficha.mostramos.replace("{que}", v.que_se_mostro)}</p> : null}
                {v.nota ? <p className="font-lectura text-sm text-acero">{v.nota}</p> : null}
                {v.siguiente_paso ? <p className="font-lectura text-sm text-blanco">→ {v.siguiente_paso}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <form action={borrarLocal} onSubmit={confirmarBorrado} className="flex justify-end">
        <input type="hidden" name="id" value={local.id} />
        <button type="submit" className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
          {T.ficha.borrar}
        </button>
      </form>
      <Historial tabla="locales" registroId={local.id} />
    </article>
  );
}
