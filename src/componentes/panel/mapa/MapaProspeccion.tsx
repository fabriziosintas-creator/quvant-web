"use client";

import { APIProvider, AdvancedMarker, ColorScheme, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fecha } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Admin, Local, Visita } from "@/servidor/panel/mapa";
import { FichaLocal } from "./FichaLocal";
import { Leyenda, Marcador, descripcionDe } from "./Marcador";

const T = PANEL_ADMIN.mapa;

/** Buenos Aires, por defecto. */
const CENTRO = { lat: -34.6037, lng: -58.3816 };

type Orden = keyof typeof T.lista.orden;

/** Carga la API de Google solo si hay clave; sin clave, los hijos siguen funcionando (lista y formularios). */
export function ProveedorMapas({ clave, children }: { clave: string; children: ReactNode }) {
  if (!clave) return <>{children}</>;
  return (
    <APIProvider apiKey={clave} language="es" region="AR">
      {children}
    </APIProvider>
  );
}

/** Encuadra todos los locales ubicados la primera vez, y viaja al elegido. */
function Camara({ ubicados, elegido }: { ubicados: Local[]; elegido: Local | null }) {
  const mapa = useMap();
  const encuadrado = useRef(false);
  useEffect(() => {
    if (!mapa || encuadrado.current || ubicados.length === 0) return;
    encuadrado.current = true;
    if (ubicados.length === 1) {
      mapa.setCenter({ lat: ubicados[0].latitud!, lng: ubicados[0].longitud! });
      mapa.setZoom(15);
      return;
    }
    const limites = new google.maps.LatLngBounds();
    for (const l of ubicados) limites.extend({ lat: l.latitud!, lng: l.longitud! });
    mapa.fitBounds(limites, 48);
  }, [mapa, ubicados]);
  useEffect(() => {
    if (!mapa || !elegido || elegido.latitud === null || elegido.longitud === null) return;
    mapa.panTo({ lat: elegido.latitud, lng: elegido.longitud });
    if ((mapa.getZoom() ?? 0) < 14) mapa.setZoom(15);
  }, [mapa, elegido]);
  return null;
}

/**
 * El mapa con un marcador por local y, al lado (abajo en el celular), la
 * lista ordenable y la ficha del elegido. Sin clave de Google, el mapa se
 * reemplaza por el aviso y todo lo demás sigue andando.
 */
export function MapaProspeccion({
  locales,
  visitas,
  admins,
  yo,
  hayClave,
  mapId,
  nombresNicho,
  ubicados: totalUbicados,
}: {
  locales: Local[];
  visitas: Record<string, Visita[]>;
  admins: Admin[];
  yo: string;
  hayClave: boolean;
  mapId: string;
  nombresNicho: Record<string, string>;
  ubicados: number;
}) {
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>("ultima");
  const elegido = useMemo(() => locales.find((l) => l.id === elegidoId) ?? null, [locales, elegidoId]);
  const ubicados = useMemo(() => locales.filter((l) => l.latitud !== null && l.longitud !== null), [locales]);
  const nombreNicho = useCallback((id: string | null) => (id ? (nombresNicho[id] ?? id) : ""), [nombresNicho]);

  // Para que la ficha se vea al elegir desde el mapa en el celular.
  const ficha = useRef<HTMLDivElement>(null);
  const elegir = (id: string) => {
    setElegidoId(id);
    requestAnimationFrame(() => ficha.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const ordenados = useMemo(() => {
    const lista = [...locales];
    const porFecha = (a: string | null, b: string | null, asc: boolean) => {
      if (a === b) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return asc ? a.localeCompare(b) : b.localeCompare(a);
    };
    lista.sort((a, b) => {
      if (orden === "visitas") return b.cantidad_visitas - a.cantidad_visitas || a.nombre.localeCompare(b.nombre);
      if (orden === "ultima") return porFecha(a.ultima_visita, b.ultima_visita, false) || a.nombre.localeCompare(b.nombre);
      if (orden === "proxima") return porFecha(a.proxima_visita, b.proxima_visita, true) || a.nombre.localeCompare(b.nombre);
      return a.nombre.localeCompare(b.nombre);
    });
    return lista;
  }, [locales, orden]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="flex flex-col gap-3">
        <div className="h-[52svh] min-h-80 overflow-hidden border border-profundo bg-negro lg:h-[72vh]">
          {hayClave ? (
            <Map
              defaultCenter={CENTRO}
              defaultZoom={11}
              mapId={mapId}
              colorScheme={ColorScheme.DARK}
              disableDefaultUI
              zoomControl
              gestureHandling="greedy"
              clickableIcons={false}
              style={{ width: "100%", height: "100%" }}
            >
              {ubicados.map((l) => (
                <AdvancedMarker key={l.id} position={{ lat: l.latitud!, lng: l.longitud! }} title={`${l.nombre} · ${descripcionDe(l)}`} onClick={() => elegir(l.id)} zIndex={l.id === elegidoId ? 2 : 1}>
                  <span className={`flex size-7 items-center justify-center ${l.id === elegidoId ? "bg-negro/70" : ""}`}>
                    <Marcador local={l} grande={l.id === elegidoId} />
                  </span>
                </AdvancedMarker>
              ))}
              <Camara ubicados={ubicados} elegido={elegido} />
            </Map>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <p className="max-w-md text-center font-lectura text-sm leading-relaxed text-acero">{T.sinClave}</p>
            </div>
          )}
        </div>
        <Leyenda />
      </div>

      <div className="flex flex-col gap-3 lg:h-[72vh] lg:overflow-y-auto lg:pr-1">
        <div ref={ficha}>{elegido ? <FichaLocal local={elegido} visitas={visitas[elegido.id] ?? []} admins={admins} yo={yo} nombreNicho={nombreNicho} alCerrar={() => setElegidoId(null)} /> : null}</div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-plex text-xs text-acero">{T.lista.mostrando.replace("{n}", String(locales.length)).replace("{ubicados}", String(totalUbicados))}</p>
          <label className="flex items-center gap-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
            {T.lista.ordenar}
            <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="h-9 border border-profundo bg-negro px-2 font-plex text-xs normal-case tracking-normal text-blanco focus:border-acero focus:outline-none">
              {Object.entries(T.lista.orden).map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {ordenados.length === 0 ? (
          <p className="border border-profundo p-5 font-lectura text-sm text-acero">{T.lista.vacio}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ordenados.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => elegir(l.id)}
                  aria-pressed={l.id === elegidoId}
                  aria-label={`${T.lista.abrir}: ${l.nombre}`}
                  className="flex w-full items-start gap-3 border border-profundo p-3 text-left transition-colors hover:border-acero aria-pressed:border-blanco"
                >
                  <span className="flex w-5 shrink-0 justify-center pt-1">
                    <Marcador local={l} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-lectura text-[15px] font-semibold text-blanco">{l.nombre}</span>
                    <span className="truncate font-plex text-xs text-acero">
                      {[nombreNicho(l.nicho_id) || l.rubro, l.ciudad].filter(Boolean).join(" · ")}
                      {l.latitud === null ? ` · ${T.lista.sinUbicar}` : ""}
                    </span>
                    <span className="flex flex-wrap gap-x-3 font-plex text-[11px] tabular-nums text-acero">
                      <span>
                        {l.cantidad_visitas} {T.ficha.visitas.toLowerCase()}
                      </span>
                      {l.ultima_visita ? <span>{fecha(l.ultima_visita)}</span> : <span>{T.sinVisitas}</span>}
                      {l.proxima_visita ? (
                        <span className="text-blanco">
                          → {fecha(l.proxima_visita)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
