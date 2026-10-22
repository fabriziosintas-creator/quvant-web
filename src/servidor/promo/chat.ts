import "server-only";
import { SITIO } from "@/datos/sitio";
import { PROMO } from "@/datos/promo";
import { obtenerEstadoPromo, promoAbierta } from "./estado";

/**
 * Lo que el asistente del chat sabe de "Primeros 100", como un bloque
 * aparte de las instrucciones (que van en caché): cambia con los lugares
 * que quedan. Sin promo abierta, no dice nada.
 */
export async function contextoPromo(): Promise<string | null> {
  const estado = await obtenerEstadoPromo();
  if (!promoAbierta(estado) || !estado) return null;
  return `Promoción vigente "Primeros 100" (datos de hoy, no los cambies):
- Arrancó el ${(estado.desde ?? "").split("-").reverse().join("/")}. Las primeras ${estado.tope} personas que se registran en la web y confirman su email eligen un beneficio: 50 % de descuento sobre el presupuesto de desarrollo de una web o una app (cualquier rubro), o 2 meses sin cargo del sistema de gestión (solo Industria y comercio, y Gimnasios y fitness).
- Quedan ${estado.quedan} lugares. Vale hasta el ${estado.hasta.split("-").reverse().join("/")} o hasta completar los lugares.
- El 50 % no incluye dominio, hosting, mantenimiento mensual ni carga de contenidos. Los 2 meses no piden tarjeta ni tienen débito automático.
- Se reserva en ${SITIO.url}${PROMO.ruta} (ahí están las bases y condiciones).
Mencionala una sola vez por conversación y solo si viene al caso (preguntan por precios, por el sistema o por hacer una web o app). No insistas, no inventes condiciones y, ante dudas sobre las bases, mandá al link.`;
}
