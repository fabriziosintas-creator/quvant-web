import { NextResponse, type NextRequest } from "next/server";
import { crearAviso } from "@/servidor/avisos/crear";
import { diaEnBuenosAires } from "@/servidor/medicion/huella";

/**
 * Lo llama la guardia de dominio (componentes/estructura/guardiaDominio.ts)
 * cuando el sitio se abre desde otro dominio: una copia publicada en otro
 * lado o abierta desde un archivo. Deja un aviso "Copia del sitio" en el
 * panel (y por WhatsApp, si está configurado), uno por dominio por día.
 *
 * Llega con navigator.sendBeacon desde la copia (otro origen, texto plano:
 * sin CORS). Para que nadie llene el panel de avisos falsos: el dominio
 * tiene que tener forma de dominio y coincidir con el origen del pedido
 * cuando el navegador lo manda.
 */

const DOMINIO = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)*[a-z0-9-]{1,63}$/i;
const PROPIOS = /(^|\.)quvant\.com\.ar$/i;

export async function POST(pedido: NextRequest) {
  let datos: { host?: unknown; url?: unknown };
  try {
    datos = JSON.parse(await pedido.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const host = typeof datos.host === "string" ? datos.host.toLowerCase().slice(0, 253) : "";
  const url = typeof datos.url === "string" ? datos.url.slice(0, 300) : "";
  const local = host === "archivo-local";
  if (!local && (!DOMINIO.test(host) || PROPIOS.test(host))) return new NextResponse(null, { status: 204 });

  // El origen que pone el navegador (no se puede falsear desde una página) tiene que ser el de la copia.
  const origen = pedido.headers.get("origin");
  if (origen && origen !== "null") {
    try {
      if (new URL(origen).hostname.toLowerCase() !== host) return new NextResponse(null, { status: 204 });
    } catch {
      return new NextResponse(null, { status: 204 });
    }
  }

  await crearAviso({
    tipo: "copia_detectada",
    titulo: local ? "Alguien abrió una copia del sitio guardada en su computadora" : `Una copia del sitio se abrió en ${host}`,
    texto: `${local ? "La abrió desde un archivo local" : `Dirección: ${url || host}`}. La persona fue llevada a quvant.com.ar. Si es un dominio público, conviene pedir que la bajen (ver docs/proteccion-del-sitio.md).`,
    enlace: "/panel",
    clave: `copia:${host}:${diaEnBuenosAires()}`,
  });
  return new NextResponse(null, { status: 204 });
}
