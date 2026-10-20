import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/supabase/proxy";

/**
 * Corre antes de cada página (Next 16 llama "proxy" a lo que antes era
 * middleware). Por ahora solo renueva la sesión de Supabase; la protección
 * de /cuenta y /panel se suma con el registro y el panel, y se vuelve a
 * verificar en el servidor de cada página (el proxy solo no alcanza).
 */
export async function proxy(pedido: NextRequest) {
  return actualizarSesion(pedido);
}

export const config = {
  matcher: [
    // Todo menos los archivos estáticos (imágenes, video, audio, fuentes).
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mp3|wav|woff2?|ttf|txt|xml)$).*)",
  ],
};
