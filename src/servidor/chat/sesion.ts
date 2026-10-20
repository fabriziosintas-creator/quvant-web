import type { NextRequest } from "next/server";

/**
 * La IP de quien escribe en el chat, para el límite de mensajes. (La
 * entrada al panel con clave compartida, PANEL_CLAVE, ya no existe: la
 * bandeja está en /panel/mensajes y se entra con la cuenta de admin.)
 */
export const ipDe = (pedido: NextRequest) =>
  pedido.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
