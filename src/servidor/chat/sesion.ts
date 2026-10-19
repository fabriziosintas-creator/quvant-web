import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NOSOTROS } from "@/datos/textos";

/**
 * La entrada al panel de mensajes: una clave compartida (PANEL_CLAVE) y
 * quién sos (para firmar las respuestas). La sesión es una cookie firmada
 * con HMAC que dura 14 días.
 *
 * En la computadora, sin PANEL_CLAVE, la clave es "quvant" para poder
 * probar. En producción, sin PANEL_CLAVE no se puede entrar.
 */

export const COOKIE_PANEL = "quvant_panel";
const DURACION_SEGUNDOS = 14 * 24 * 60 * 60;

export const EQUIPO: readonly string[] = NOSOTROS.equipo.map((persona) => persona.nombre);

export function claveDelPanel(): string | null {
  if (process.env.PANEL_CLAVE) return process.env.PANEL_CLAVE;
  return process.env.NODE_ENV === "production" ? null : "quvant";
}

const secreto = () => process.env.PANEL_SECRETO ?? claveDelPanel() ?? "";
const firma = (contenido: string) => createHmac("sha256", secreto()).update(contenido).digest("base64url");
const huella = (texto: string) => createHash("sha256").update(texto).digest();

export function claveCorrecta(intento: string) {
  const clave = claveDelPanel();
  if (!clave) return false;
  return timingSafeEqual(huella(intento), huella(clave));
}

export function crearSesion(nombre: string) {
  const vence = Math.floor(Date.now() / 1000) + DURACION_SEGUNDOS;
  const contenido = `${encodeURIComponent(nombre)}.${vence}`;
  return { valor: `${contenido}.${firma(contenido)}`, duracion: DURACION_SEGUNDOS };
}

/** Quién está en el panel, o null si la cookie falta, venció o no es nuestra. */
export function leerSesion(pedido: NextRequest): { nombre: string } | null {
  const valor = pedido.cookies.get(COOKIE_PANEL)?.value;
  if (!valor || !claveDelPanel()) return null;
  const [nombreCodificado, vence, recibida] = valor.split(".");
  if (!nombreCodificado || !vence || !recibida) return null;
  const esperada = firma(`${nombreCodificado}.${vence}`);
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(vence) < Date.now() / 1000) return null;
  const nombre = decodeURIComponent(nombreCodificado);
  return EQUIPO.includes(nombre) ? { nombre } : null;
}

export const ipDe = (pedido: NextRequest) =>
  pedido.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
