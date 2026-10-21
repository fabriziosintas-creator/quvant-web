"use client";

import { sincronizarOperacion } from "@/servidor/panel/sincronizar";
import { borrarOperacion, guardarOperacion, hayAlmacen, leerCola } from "./almacen";
import { aplicarRespuesta, nuevaOperacion, paraMandar, sinRepetidas, type Operacion, type Respuesta, type TipoOperacion } from "./cola";

/**
 * Lo que corre en el navegador: guardar en la cola lo que no se pudo
 * mandar y mandarla sola cuando vuelve la señal (al volver la conexión,
 * al abrir el panel, cada minuto y cuando avisa el service worker).
 * Avisa con eventos del navegador para que el indicador del encabezado
 * muestre cuántas quedan y cuántas se mandaron.
 */

export const EVENTO_COLA = "quvant:cola";
export type DetalleCola = { pendientes: number; rechazadas: Operacion[]; sinSesion: boolean; enviadas?: Operacion[] };

let corriendo = false;
let sinSesion = false;

const claveNueva = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16).padStart(12, "0")}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`.slice(0, 36));

export async function avisarEstado(enviadas?: Operacion[]) {
  const cola = await leerCola().catch(() => []);
  const detalle: DetalleCola = { pendientes: cola.filter((o) => o.estado === "pendiente").length, rechazadas: cola.filter((o) => o.estado === "rechazada"), sinSesion, enviadas };
  window.dispatchEvent(new CustomEvent<DetalleCola>(EVENTO_COLA, { detail: detalle }));
}

/** Guarda una operación en el teléfono y pide al service worker que avise al volver la señal. */
export async function encolar(tipo: TipoOperacion, datos: Record<string, string>, titulo: string): Promise<boolean> {
  if (!hayAlmacen()) return false;
  const clave = datos.clave_cliente && /^[0-9a-f-]{36}$/.test(datos.clave_cliente) ? datos.clave_cliente : claveNueva();
  await guardarOperacion(nuevaOperacion(clave, tipo, datos, titulo, new Date().toISOString()));
  try {
    const registro = await navigator.serviceWorker?.ready;
    await (registro as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } })?.sync?.register("quvant-cola");
  } catch {
    // Sin Background Sync: se manda al volver la conexión o al abrir el panel.
  }
  await avisarEstado();
  return true;
}

/** ¿Este error es de red (sin señal) y no del servidor? */
export const esErrorDeRed = (error: unknown) => error instanceof TypeError || (error instanceof Error && /fetch|network|Failed to fetch|Load failed/i.test(error.message));

/** Manda lo pendiente, en orden. Devuelve lo que se mandó. */
export async function procesarCola(forzar = false): Promise<Operacion[]> {
  if (corriendo || !hayAlmacen() || (typeof navigator !== "undefined" && navigator.onLine === false)) return [];
  corriendo = true;
  const enviadas: Operacion[] = [];
  try {
    const cola = sinRepetidas(await leerCola());
    for (const op of paraMandar(cola, new Date().toISOString(), forzar)) {
      let r: Respuesta;
      try {
        r = await sincronizarOperacion(op.tipo, op.datos);
      } catch (error) {
        r = esErrorDeRed(error) ? { resultado: "sin_red" } : { resultado: "rechazada", motivo: error instanceof Error ? error.message.slice(0, 200) : "Error" };
      }
      sinSesion = r.resultado === "sin_sesion";
      const siguiente = aplicarRespuesta(op, r, new Date().toISOString());
      if (siguiente) await guardarOperacion(siguiente);
      else {
        await borrarOperacion(op.clave);
        enviadas.push(op);
      }
      // Sin red o sin sesión, las demás van a fallar igual: se corta acá.
      if (r.resultado === "sin_red" || r.resultado === "sin_sesion") break;
    }
  } finally {
    corriendo = false;
    await avisarEstado(enviadas.length ? enviadas : undefined);
  }
  return enviadas;
}

/** Volver a intentar una rechazada (después de revisar) o descartarla. */
export async function reintentar(op: Operacion) {
  await guardarOperacion({ ...op, estado: "pendiente", motivo: null, ultimoIntento: null });
  await procesarCola(true);
}
export async function descartar(op: Operacion) {
  await borrarOperacion(op.clave);
  await avisarEstado();
}

const aDatos = (formulario: FormData) => Object.fromEntries([...formulario.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));

/**
 * Envuelve una acción de formulario del mapa: le agrega la clave única y,
 * si no hay señal (o el envío falla por la red), la guarda en el teléfono y
 * contesta "guardado en el teléfono" en vez de un error.
 */
export function conCola<E extends { estado: string; mensaje?: string }>(tipo: TipoOperacion, accion: (previo: E, datos: FormData) => Promise<E>, titulo: (datos: FormData) => string, guardado: E) {
  return async (previo: E, datos: FormData): Promise<E> => {
    if (!datos.get("clave_cliente")) datos.set("clave_cliente", claveNueva());
    if (typeof navigator !== "undefined" && navigator.onLine === false && (await encolar(tipo, aDatos(datos), titulo(datos)))) return guardado;
    try {
      return await accion(previo, datos);
    } catch (error) {
      if (esErrorDeRed(error) && (await encolar(tipo, aDatos(datos), titulo(datos)))) return guardado;
      throw error;
    }
  };
}
