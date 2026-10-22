import { NextResponse, type NextRequest } from "next/server";
import { IA_BLOQUEADAS_EXPRESION } from "@/datos/bots";
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
/**
 * Las herramientas que bajan sitios enteros para copiarlos (HTTrack,
 * SiteSucker, wget…) y los scripts de scraping más comunes: no reciben las
 * páginas. No frena a quien copia a mano desde un navegador (nada lo
 * frena), pero sí a las copias automáticas. La API queda afuera (la usa
 * Vercel Cron) y los buscadores y las vistas previas de redes no están en
 * la lista.
 */
const COPIADORAS =
  /httrack|sitesucker|webcopier|cyotek|webzip|teleport ?pro|offline ?explorer|webreaper|website ?(ripper|downloader|extractor)|getleft|wget|curl\/|scrapy|python-requests|python-urllib|aiohttp|httpx|go-http-client|libwww-perl|java\/\d|okhttp|node-fetch|axios\//i;

export async function proxy(pedido: NextRequest) {
  const { pathname, search } = pedido.nextUrl;
  const agente = pedido.headers.get("user-agent") ?? "";
  // Las herramientas de copia y las IA que entrenan modelos o leen la página a pedido desde un chat (datos/bots.ts).
  if (!pathname.startsWith("/api/") && (COPIADORAS.test(agente) || IA_BLOQUEADAS_EXPRESION.test(agente))) {
    return new NextResponse("Acceso no permitido.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
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
