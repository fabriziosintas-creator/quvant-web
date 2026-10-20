import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/supabase/proxy";

/** Las páginas que piden sesión: sin cookie de Supabase, directo a /ingresar. */
const CON_SESION = ["/cuenta", "/panel"];

/**
 * Corre antes de cada página (Next 16 llama "proxy" a lo que antes era
 * middleware): renueva la sesión de Supabase y, si alguien entra a una
 * página con sesión sin haber ingresado, lo manda a /ingresar sin dibujar
 * nada. Es el camino rápido: cada página vuelve a verificar la sesión (y,
 * en /panel, que sea admin) en el servidor; el proxy solo no alcanza.
 */
export async function proxy(pedido: NextRequest) {
  const { pathname, search } = pedido.nextUrl;
  const pideSesion = CON_SESION.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
  const tieneCookie = pedido.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (pideSesion && !tieneCookie) {
    const destino = new URL("/ingresar", pedido.url);
    destino.searchParams.set("siguiente", `${pathname}${search}`);
    return NextResponse.redirect(destino);
  }
  return actualizarSesion(pedido);
}

export const config = {
  matcher: [
    // Todo menos los archivos estáticos (imágenes, video, audio, fuentes).
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|mp3|wav|woff2?|ttf|txt|xml)$).*)",
  ],
};
