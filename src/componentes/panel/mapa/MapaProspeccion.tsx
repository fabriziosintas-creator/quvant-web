"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapaLibre, Marker } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fecha } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Admin, Local, Visita } from "@/servidor/panel/mapa";
import { estiloQuvant, paletaDeLaPagina } from "./estiloMapa";
import { FichaLocal } from "./FichaLocal";
import { cargarMapLibre } from "./maplibre";
import { Leyenda, Marcador, descripcionDe } from "./Marcador";

const T = PANEL_ADMIN.mapa;

/** Buenos Aires, por defecto ([lng, lat], como los pide MapLibre). */
const CENTRO: [number, number] = [-58.4173, -34.6118];

type Orden = keyof typeof T.lista.orden;

/**
 * El mapa propio (MapLibre + mosaicos de OpenFreeMap, estilo de Quvant)
 * con un marcador por local y, al lado (abajo en el celular), la lista
 * ordenable y la ficha del elegido. Se arrastra con un dedo y se acerca
 * con dos, como Google Maps. Sin clave ni costo: si el mapa no carga (sin
 * WebGL, sin conexión), la lista y la ficha siguen andando.
 */
export function MapaProspeccion({
  locales,
  visitas,
  admins,
  yo,
  nombresNicho,
  ubicados: totalUbicados,
  abrirId,
  abrirVisita = false,
}: {
  locales: Local[];
  visitas: Record<string, Visita[]>;
  admins: Admin[];
  yo: string;
  nombresNicho: Record<string, string>;
  ubicados: number;
  /** Un local para abrir apenas carga (el recién agregado o el repetido). */
  abrirId?: string | null;
  /** Abrir ese local con el formulario de visita ya desplegado ("nueva visita a…" del buscador). */
  abrirVisita?: boolean;
}) {
  const [elegidoId, setElegidoId] = useState<string | null>(abrirId ?? null);
  const [orden, setOrden] = useState<Orden>("ultima");
  const elegido = useMemo(() => locales.find((l) => l.id === elegidoId) ?? null, [locales, elegidoId]);
  const ubicados = useMemo(() => locales.filter((l) => l.latitud !== null && l.longitud !== null), [locales]);
  const nombreNicho = useCallback((id: string | null) => (id ? (nombresNicho[id] ?? id) : ""), [nombresNicho]);

  // Para que la ficha se vea al elegir desde el mapa en el celular.
  const ficha = useRef<HTMLDivElement>(null);
  const elegir = useCallback((id: string) => {
    setElegidoId(id);
    requestAnimationFrame(() => ficha.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }, []);
  // Si cambia el local a abrir (agregado o repetido desde el formulario), se elige.
  const [abrirAnterior, setAbrirAnterior] = useState(abrirId);
  if (abrirId !== abrirAnterior) {
    setAbrirAnterior(abrirId);
    if (abrirId) setElegidoId(abrirId);
  }

  // ── El mapa ──
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLibre | null>(null);
  const claseMarcador = useRef<typeof Marker | null>(null);
  const marcadores = useRef(new Map<string, Marker>());
  const [elementos, setElementos] = useState<Record<string, HTMLElement>>({});
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vivo = true;
    let creado: MapaLibre | null = null;
    (async () => {
      try {
        const maplibre = await cargarMapLibre();
        if (!vivo || !contenedor.current) return;
        creado = new maplibre.Map({
          container: contenedor.current,
          style: estiloQuvant(paletaDeLaPagina()),
          center: CENTRO,
          zoom: 11,
          minZoom: 3,
          maxZoom: 19,
          attributionControl: { compact: false },
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });
        creado.touchZoomRotate.disableRotation();
        creado.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        creado.addControl(new maplibre.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
        creado.on("load", () => vivo && setListo(true));
        claseMarcador.current = maplibre.Marker;
        mapa.current = creado;
      } catch (error) {
        console.error("[mapa]", error);
        if (vivo) setFallo(true);
      }
    })();
    const actuales = marcadores.current;
    return () => {
      vivo = false;
      actuales.forEach((m) => m.remove());
      actuales.clear();
      creado?.remove();
      mapa.current = null;
    };
  }, []);

  // Un marcador por local ubicado: el elemento lo pone MapLibre; lo de adentro, React (portal).
  useEffect(() => {
    const m = mapa.current;
    const ClaseMarcador = claseMarcador.current;
    if (!listo || !m || !ClaseMarcador) return;
    const quedan = new Set(ubicados.map((l) => l.id));
    const nuevos: Record<string, HTMLElement> = {};
    for (const [id, marcador] of marcadores.current) {
      if (!quedan.has(id)) {
        marcador.remove();
        marcadores.current.delete(id);
      }
    }
    for (const l of ubicados) {
      const existente = marcadores.current.get(l.id);
      if (existente) {
        existente.setLngLat([l.longitud!, l.latitud!]);
        nuevos[l.id] = existente.getElement();
        continue;
      }
      const elemento = document.createElement("div");
      const marcador = new ClaseMarcador({ element: elemento, anchor: "center" }).setLngLat([l.longitud!, l.latitud!]).addTo(m);
      marcadores.current.set(l.id, marcador);
      nuevos[l.id] = elemento;
    }
    setElementos(nuevos);
  }, [listo, ubicados]);

  // Encuadrar todos la primera vez; después, viajar al elegido.
  const encuadrado = useRef(false);
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m || encuadrado.current || ubicados.length === 0) return;
    encuadrado.current = true;
    if (ubicados.length === 1) return void m.jumpTo({ center: [ubicados[0].longitud!, ubicados[0].latitud!], zoom: 15 });
    const lngs = ubicados.map((l) => l.longitud!);
    const lats = ubicados.map((l) => l.latitud!);
    m.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 15, duration: 0 },
    );
  }, [listo, ubicados]);
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m || !elegido || elegido.latitud === null || elegido.longitud === null) return;
    m.easeTo({ center: [elegido.longitud, elegido.latitud], zoom: Math.max(m.getZoom(), 15) });
  }, [listo, elegido]);

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
        <div id="mapa" className="mapa-quvant relative scroll-mt-4 h-[60svh] min-h-80 overflow-hidden border border-profundo bg-negro lg:h-[72vh]">
          {/* Alto y ancho explícitos: MapLibre le pone position: relative al contenedor (pisaría un absolute inset-0 y el mapa quedaría con alto cero). */}
          <div ref={contenedor} className="h-full w-full" aria-label={T.titulo} role="region" />
          {fallo ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="max-w-md text-center font-lectura text-sm leading-relaxed text-acero">{T.sinMapa}</p>
            </div>
          ) : null}
        </div>
        <Leyenda />
      </div>

      {ubicados.map((l) =>
        elementos[l.id]
          ? createPortal(
              <button
                type="button"
                onClick={() => elegir(l.id)}
                title={`${l.nombre} · ${descripcionDe(l)}`}
                aria-label={`${l.nombre} · ${descripcionDe(l)}`}
                className={`flex size-8 cursor-pointer items-center justify-center ${l.id === elegidoId ? "bg-negro/70" : ""}`}
              >
                <Marcador local={l} grande={l.id === elegidoId} />
              </button>,
              elementos[l.id],
              l.id,
            )
          : null,
      )}

      <div className="flex flex-col gap-3 lg:h-[72vh] lg:overflow-y-auto lg:pr-1">
        <div ref={ficha}>{elegido ? <FichaLocal key={elegido.id} conVisita={abrirVisita && elegido.id === abrirId} local={elegido} visitas={visitas[elegido.id] ?? []} admins={admins} yo={yo} nombreNicho={nombreNicho} alCerrar={() => setElegidoId(null)} /> : null}</div>

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
                      {l.ubicacion_pendiente ? ` · ${T.lista.ubicando}` : l.latitud === null ? ` · ${T.lista.sinUbicar}` : ""}
                    </span>
                    <span className="flex flex-wrap gap-x-3 font-plex text-[11px] tabular-nums text-acero">
                      <span>
                        {l.cantidad_visitas} {T.ficha.visitas.toLowerCase()}
                      </span>
                      {l.ultima_visita ? <span>{fecha(l.ultima_visita)}</span> : <span>{T.sinVisitas}</span>}
                      {l.proxima_visita ? <span className="text-blanco">→ {fecha(l.proxima_visita)}</span> : null}
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
