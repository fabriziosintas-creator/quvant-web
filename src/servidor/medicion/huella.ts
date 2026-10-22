import { createHmac } from "node:crypto";

/**
 * La huella del día de una visita: para contar a una persona una sola vez
 * por día (aunque entre desde otra pestaña o en incógnito) y para avisar
 * cuando una misma conexión entra muchas veces.
 *
 * Es un HMAC-SHA256 de la fecha (en Buenos Aires), la IP y el navegador,
 * con una clave que solo tiene el servidor. La IP nunca se guarda: solo
 * estos 32 caracteres, que no se pueden volver atrás, cambian cada día (no
 * dejan seguir a nadie de un día para otro) y la base borra a los 7 días.
 */

/** La IP de quien hace el pedido, según lo que pone Vercel adelante. */
export function ipDelPedido(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip")?.trim() || "";
}

/** El día en Buenos Aires (AAAA-MM-DD). */
export function diaEnBuenosAires(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(ahora);
}

/** La huella, o null si falta la IP o la clave (sin huella, la visita cuenta igual, por su navegador). */
export function huellaDelDia(ip: string, agente: string, dia: string, clave: string | undefined): string | null {
  if (!ip || !clave) return null;
  return createHmac("sha256", clave).update(`${dia}|${ip}|${agente}`).digest("hex").slice(0, 32);
}
