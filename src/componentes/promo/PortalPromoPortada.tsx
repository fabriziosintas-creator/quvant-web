import { obtenerEstadoPromo } from "@/servidor/promo/estado";
import { PortalPromo, type EstadoPortal } from "./PortalPromo";

/**
 * El botón de Primeros 100 con los números de la base (en caché un
 * minuto). Se ve desde antes de abrirla ("Arranca muy pronto"), con
 * lugares y con la promo llena (lista de espera). No se ve si la base
 * no tiene la promo o si está pausada desde el panel: pausada, la web
 * no la anuncia (Ley 24.240).
 */
export async function PortalPromoPortada() {
  const estado = await obtenerEstadoPromo();
  if (!estado) return null;
  let tipo: EstadoPortal;
  if (!estado.desde) tipo = "pronto";
  else if (estado.quedan <= 0) tipo = "llena";
  else if (estado.activa) tipo = "abierta";
  else return null;
  return <PortalPromo estado={tipo} quedan={estado.quedan} tope={estado.tope} />;
}
