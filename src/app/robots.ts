import type { MetadataRoute } from "next";
import { IA_BLOQUEADAS, IA_BUSCADORES } from "@/datos/bots";
import { SITIO } from "@/datos/sitio";

/**
 * Todo abierto salvo lo interno: el laboratorio de cromos, el panel, la
 * API del chat y las páginas de cuenta (el registro sí se indexa).
 *
 * IA (datos/bots.ts): los buscadores con IA van nombrados y permitidos (que
 * lean el sitio y lo citen: estudio de referencia, 9.2); los que entrenan
 * modelos o leen la página a pedido desde un chat ("copiame esta web"), no.
 * Como algunos no respetan robots.txt, el proxy además les cierra la puerta.
 */
const INTERNO = ["/laboratorio-cromo", "/panel", "/api/", "/cuenta", "/ingresar", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: INTERNO },
      ...IA_BUSCADORES.map((bot) => ({ userAgent: bot, allow: "/", disallow: INTERNO })),
      ...IA_BLOQUEADAS.map((bot) => ({ userAgent: bot, disallow: "/" })),
    ],
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
