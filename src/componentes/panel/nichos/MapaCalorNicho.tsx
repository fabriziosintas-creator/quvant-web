"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import type { GeoJSONSourceSpecification, Map as MapaLibre } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { estiloQuvant, paletaDeLaPagina } from "@/componentes/panel/mapa/estiloMapa";
import { PANEL_ADMIN } from "@/datos/textos";
import { linkRecorrido, recorridoCercano } from "@/nichos/estadistica";
import type { ProspectoNicho, VisitaNicho } from "@/nichos/tipos";

/**
 * La calle del nicho: el mapa propio (MapLibre + OpenFreeMap, estilo
 * Quvant) con una capa de calor de las visitas, pesada por el feedback
 * (bueno pesa más), y los prospectos como puntos del color del nicho. Al
 * lado, las próximas visitas sugeridas y el recorrido del día.
 */

const P = PANEL_ADMIN.nichos.prospeccion;
const PESO = { bueno: 1, regular: 0.5, malo: 0.2 } as const;
/** Días desde una fecha hasta hoy (null si nunca). */
const diasDesde = (hoy: string, d: string | null) => (d ? Math.round((Date.parse(hoy) - Date.parse(d)) / 86_400_000) : null);

export function MapaCalorNicho({ prospectos, visitas, acento, hoy }: { prospectos: ProspectoNicho[]; visitas: VisitaNicho[]; acento: string; hoy: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  const [recorrido, setRecorrido] = useState<{ estado: "" | "buscando" | "listo"; link?: string; paradas?: ProspectoNicho[]; sinUbicacion?: boolean }>({ estado: "" });

  const ubicados = useMemo(() => prospectos.filter((p) => p.latitud !== null && p.longitud !== null), [prospectos]);
  const dias = (d: string | null) => diasDesde(hoy, d);
  // Interesados y "volver: sí" primero; después, los que llevan más días sin visita.
  const sugeridos = useMemo(
    () =>
      [...prospectos]
        .filter((p) => p.estado !== "cliente" && p.estado !== "descartado" && p.volver !== "no")
        .sort((a, b) => {
          const prioridad = (p: ProspectoNicho) => (p.estado === "interesado" ? 0 : p.volver === "si" ? 1 : 2);
          return prioridad(a) - prioridad(b) || (diasDesde(hoy, b.ultimaVisita) ?? 9999) - (diasDesde(hoy, a.ultimaVisita) ?? 9999);
        })
        .slice(0, 10),
    [prospectos, hoy],
  );

  useEffect(() => {
    let vivo = true;
    let mapa: MapaLibre | null = null;
    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (!vivo || !contenedor.current) return;
        mapa = new maplibre.Map({ container: contenedor.current, style: estiloQuvant(paletaDeLaPagina()), center: [-58.4173, -34.6118], zoom: 10, attributionControl: { compact: false }, dragRotate: false, touchPitch: false });
        mapa.touchZoomRotate.disableRotation();
        mapa.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        mapa.on("load", () => {
          if (!mapa) return;
          const calor: GeoJSONSourceSpecification = {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: visitas.filter((v) => v.latitud !== null && v.longitud !== null).map((v) => ({ type: "Feature", properties: { peso: PESO[v.feedback] }, geometry: { type: "Point", coordinates: [v.longitud!, v.latitud!] } })),
            },
          };
          const puntos: GeoJSONSourceSpecification = {
            type: "geojson",
            data: { type: "FeatureCollection", features: ubicados.map((p) => ({ type: "Feature", properties: { nombre: p.nombre, caliente: p.estado === "interesado" || p.volver === "si" ? 1 : 0 }, geometry: { type: "Point", coordinates: [p.longitud!, p.latitud!] } })) },
          };
          mapa.addSource("calor", calor);
          mapa.addSource("prospectos", puntos);
          mapa.addLayer({
            id: "calor",
            type: "heatmap",
            source: "calor",
            paint: {
              "heatmap-weight": ["get", "peso"],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 15, 2],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 14, 15, 36],
              "heatmap-opacity": 0.75,
              // Del negro al color del nicho, sin colores de otro tipo.
              "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(13,13,15,0)", 0.3, "#26262B", 1, acento],
            },
          });
          mapa.addLayer({
            id: "prospectos",
            type: "circle",
            source: "prospectos",
            paint: { "circle-radius": ["case", ["==", ["get", "caliente"], 1], 6, 4], "circle-color": ["case", ["==", ["get", "caliente"], 1], acento, "#0D0D0F"], "circle-stroke-color": acento, "circle-stroke-width": 1.5 },
          });
          if (ubicados.length > 1) {
            const lngs = ubicados.map((p) => p.longitud!);
            const lats = ubicados.map((p) => p.latitud!);
            mapa.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 40, maxZoom: 14, duration: 0 });
          } else if (ubicados.length === 1) mapa.jumpTo({ center: [ubicados[0].longitud!, ubicados[0].latitud!], zoom: 14 });
        });
      } catch (error) {
        console.error("[nicho] mapa:", error);
        if (vivo) setFallo(true);
      }
    })();
    return () => {
      vivo = false;
      mapa?.remove();
    };
  }, [visitas, ubicados, acento]);

  const armarRecorrido = () => {
    const conCoordenadas = sugeridos.filter((p) => p.latitud !== null && p.longitud !== null) as Array<ProspectoNicho & { latitud: number; longitud: number }>;
    if (conCoordenadas.length === 0) return;
    const centro = { latitud: conCoordenadas.reduce((s, p) => s + p.latitud, 0) / conCoordenadas.length, longitud: conCoordenadas.reduce((s, p) => s + p.longitud, 0) / conCoordenadas.length };
    const armar = (origen: { latitud: number; longitud: number }, sinUbicacion: boolean) => {
      const paradas = recorridoCercano(origen, conCoordenadas, 8);
      setRecorrido({ estado: "listo", paradas, link: linkRecorrido(paradas) ?? undefined, sinUbicacion });
    };
    if (!("geolocation" in navigator)) return armar(centro, true);
    setRecorrido({ estado: "buscando" });
    navigator.geolocation.getCurrentPosition(
      (pos) => armar({ latitud: pos.coords.latitude, longitud: pos.coords.longitude }, false),
      () => armar(centro, true),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (prospectos.length === 0) return <p className="border border-profundo p-5 font-plex text-sm text-acero">{P.vacio}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="mapa-quvant relative h-[50svh] min-h-72 overflow-hidden border border-profundo bg-negro lg:h-[440px]">
        <div ref={contenedor} className="h-full w-full" role="region" aria-label={P.titulo} />
        {fallo ? <p className="absolute inset-0 flex items-center justify-center p-6 text-center font-plex text-sm text-acero">{PANEL_ADMIN.mapa.sinMapa}</p> : null}
      </div>
      <div className="flex flex-col gap-3">
        <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{P.sugeridos}</p>
        <p className="font-plex text-[11px] text-acero/80">{P.sugeridosNota}</p>
        <ol className="flex flex-col gap-1.5">
          {sugeridos.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b border-profundo py-2 font-plex text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="size-1.5 shrink-0" style={{ background: p.estado === "interesado" || p.volver === "si" ? acento : "#9C9CA3" }} />
                <span className="truncate text-blanco">{p.nombre}</span>
              </span>
              <span className="shrink-0 text-acero">{p.ultimaVisita ? P.hace.replace("{n}", String(dias(p.ultimaVisita))) : P.sinVisita}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={armarRecorrido} disabled={recorrido.estado === "buscando"} className="inline-flex h-11 items-center justify-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
          {recorrido.estado === "buscando" ? P.ubicando : P.recorrido}
        </button>
        <p className="font-plex text-[11px] text-acero/80">{P.recorridoNota}</p>
        {recorrido.estado === "listo" && recorrido.link ? (
          <div className="flex flex-col gap-2 border border-profundo p-3" aria-live="polite">
            {recorrido.sinUbicacion ? <p className="font-plex text-[11px] text-acero">{P.sinUbicacion}</p> : null}
            <ol className="flex list-decimal flex-col gap-1 pl-5 font-plex text-xs text-blanco">
              {recorrido.paradas?.map((p) => <li key={p.id}>{p.nombre}</li>)}
            </ol>
            <a href={recorrido.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-fit items-center bg-blanco px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
              {P.abrir}
            </a>
          </div>
        ) : null}
        <Link href="/panel/mapa" className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
          {P.verMapa} →
        </Link>
      </div>
    </div>
  );
}
