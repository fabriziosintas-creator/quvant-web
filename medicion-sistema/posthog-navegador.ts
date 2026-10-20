/**
 * PostHog en el navegador del sistema, con la privacidad de la sección 3:
 * sin autocapture, sin grabación de sesiones, sin encuestas ni mapas de
 * calor, sin cookies (persistencia en localStorage), sin pageviews
 * automáticos (pantalla_vista es nuestro) y sin IP. Solo sale lo que pasa
 * por medir().
 *
 * Se inicia una sola vez, en el layout de las rutas del sistema (nunca en
 * la web pública). api_host apunta al proxy propio (ver proxy-next.md).
 */
import posthog, { type PostHogConfig } from "posthog-js";
import { almacenEnStorage } from "./cola";
import { Medicion, type Contexto } from "./medir";

export type ConfigNavegador = {
  /** La Project API key (phc_…). Es pública. */
  clave: string;
  /** La ruta del proxy propio, por ejemplo "/_q/m". */
  rutaProxy: string;
  /** Dónde está el proyecto: "https://us.posthog.com" o "https://eu.posthog.com" (para los links de la UI). */
  uiHost: string;
};

const CONFIG_PRIVADA: Partial<PostHogConfig> = {
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_web_experiments: true,
  capture_heatmaps: false,
  capture_dead_clicks: false,
  capture_performance: false,
  persistence: "localStorage",
  ip: false,
  // Las propiedades automáticas del navegador que no hacen falta: se sacan antes de salir.
  sanitize_properties: (propiedades) => {
    for (const clave of ["$current_url", "$pathname", "$referrer", "$referring_domain", "$host", "$initial_referrer", "$initial_referring_domain", "$screen_name", "title"]) {
      delete propiedades[clave];
    }
    return propiedades;
  },
};

let medicion: Medicion | null = null;

/** Inicia PostHog y devuelve la medición. Llamarlo una vez; las siguientes devuelven la misma. */
export function iniciarMedicionNavegador(config: ConfigNavegador, contexto: Contexto): Medicion {
  if (medicion) {
    medicion.fijarContexto(contexto);
    return medicion;
  }
  if (!posthog.__loaded) {
    posthog.init(config.clave, { ...CONFIG_PRIVADA, api_host: config.rutaProxy, ui_host: config.uiHost });
  }
  const almacen = typeof localStorage !== "undefined" ? almacenEnStorage(localStorage) : undefined;
  medicion = new Medicion({
    almacen,
    enviador: async ({ nombre, propiedades, hora, distinctId }) => {
      // posthog-js manda los eventos del distinct_id que tenga identificado: lo fijamos sin propiedades de persona.
      if (posthog.get_distinct_id() !== distinctId) posthog.identify(distinctId);
      posthog.capture(nombre, { ...propiedades, timestamp: hora.toISOString() }, { timestamp: hora });
    },
  });
  medicion.fijarContexto(contexto);
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => void medicion?.vaciarCola());
    void medicion.vaciarCola();
  }
  return medicion;
}

/**
 * Grupos (apagado): el plan gratuito de PostHog no incluye analítica por
 * grupos y alcanza con organizacion_id en cada evento. Si más adelante se
 * activa, llamar a esto al fijar el contexto.
 */
export function registrarOrganizacionComoGrupo(organizacionId: string, plantilla: string) {
  posthog.group("organizacion", organizacionId, { plantilla });
}

export const laMedicion = () => medicion;
