import type { MapOptions } from "maplibre-gl";

/**
 * El estilo del mapa de prospección, en la paleta de Quvant y nada más:
 *  · fondo y agua en negro (la costa se marca con una línea profunda);
 *  · manzanas (las zonas edificadas y los edificios) y calles en profundo;
 *  · avenidas y nombres (calles, barrios, ciudades) en acero.
 * Los mosaicos vectoriales son de OpenFreeMap (sin clave, sin límite de
 * vistas) con el esquema de OpenMapTiles. Las letras del mapa son Noto
 * Sans, las que sirve OpenFreeMap: el mapa dibuja los nombres con sus
 * propias tipografías (no puede usar las de la página).
 *
 * Los colores no se repiten acá: salen de los tokens de globals.css.
 */

export type Paleta = { negro: string; blanco: string; acero: string; profundo: string };

type Estilo = Exclude<MapOptions["style"], string | undefined>;

export const FUENTE_MOSAICOS = "https://tiles.openfreemap.org/planet";

/** Los tokens de color de la página (--color-negro, etc.), leídos en el navegador. */
export function paletaDeLaPagina(): Paleta {
  const css = getComputedStyle(document.documentElement);
  const token = (nombre: string, respaldo: string) => css.getPropertyValue(`--color-${nombre}`).trim() || respaldo;
  return { negro: token("negro", "#0d0d0f"), blanco: token("blanco", "#ececee"), acero: token("acero", "#9c9ca3"), profundo: token("profundo", "#26262b") };
}

// En la Argentina el nombre principal ya está en castellano; name:es a veces viene mal cargado ("Avenida9dejulio").
const NOMBRE: ["coalesce", ["get", string], ["get", string]] = ["coalesce", ["get", "name"], ["get", "name:es"]];
const MENORES = ["minor", "service", "tertiary", "secondary", "track"];
const AVENIDAS = ["primary", "trunk", "motorway"];

/** Ancho de una línea según el zoom: [zoom, ancho] de punta a punta. */
const ancho = (...pares: Array<[number, number]>): ["interpolate", ["exponential", number], ["zoom"], ...number[]] => ["interpolate", ["exponential", 1.5], ["zoom"], ...pares.flat()];

export function estiloQuvant(p: Paleta): Estilo {
  return {
    version: 8,
    name: "Quvant",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { openmaptiles: { type: "vector", url: FUENTE_MOSAICOS } },
    layers: [
      { id: "fondo", type: "background", paint: { "background-color": p.negro } },

      // Las manzanas: zonas edificadas apenas marcadas de lejos; los edificios, de cerca.
      {
        id: "zonas",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["residential", "commercial", "industrial", "retail", "neighbourhood", "suburb", "quarter"]]],
        paint: { "fill-color": p.profundo, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 15, 0.45] },
      },
      {
        id: "verdes",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        paint: { "fill-color": p.profundo, "fill-opacity": 0.2 },
      },
      {
        id: "edificios",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: { "fill-color": p.profundo, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, 0.85] },
      },

      // El agua, negra como el fondo; el borde la hace legible (la costa del Río de la Plata).
      { id: "agua", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": p.negro } },
      { id: "costa", type: "line", source: "openmaptiles", "source-layer": "water", paint: { "line-color": p.profundo, "line-width": 1 } },
      { id: "rios", type: "line", source: "openmaptiles", "source-layer": "waterway", paint: { "line-color": p.profundo, "line-width": ancho([10, 0.5], [16, 2]) } },

      // Calles y avenidas.
      {
        id: "calles",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", MENORES]],
        minzoom: 11,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.profundo, "line-width": ancho([12, 0.5], [15, 3], [18, 14]) },
      },
      {
        id: "vias",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["rail", "transit"]]],
        minzoom: 12,
        paint: { "line-color": p.profundo, "line-width": 1.2, "line-dasharray": [3, 3] },
      },
      {
        id: "avenidas",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", AVENIDAS]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.acero,
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.35, 14, 0.7],
          "line-width": ancho([8, 0.4], [13, 1.4], [18, 10]),
        },
      },

      // Nombres: calles, alturas, barrios y ciudades.
      {
        id: "nombres-calles",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 13,
        layout: {
          "symbol-placement": "line",
          "text-field": NOMBRE,
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 18, 13],
          "text-max-angle": 30,
        },
        paint: { "text-color": p.acero, "text-halo-color": p.negro, "text-halo-width": 1.5 },
      },
      {
        id: "alturas",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "housenumber",
        minzoom: 17,
        layout: { "text-field": ["get", "housenumber"], "text-font": ["Noto Sans Regular"], "text-size": 10 },
        paint: { "text-color": p.acero, "text-opacity": 0.7, "text-halo-color": p.negro, "text-halo-width": 1 },
      },
      {
        id: "barrios",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["suburb", "neighbourhood", "quarter"]]],
        minzoom: 11,
        maxzoom: 17,
        layout: {
          "text-field": NOMBRE,
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 15, 12],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.18,
          "text-max-width": 8,
        },
        paint: { "text-color": p.acero, "text-halo-color": p.negro, "text-halo-width": 1.5 },
      },
      {
        id: "ciudades",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        maxzoom: 14,
        layout: {
          "text-field": NOMBRE,
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 12, 15],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.2,
        },
        paint: { "text-color": p.acero, "text-halo-color": p.negro, "text-halo-width": 2 },
      },
    ],
  };
}
