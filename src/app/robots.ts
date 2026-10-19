import type { MetadataRoute } from "next";
import { SITIO } from "@/datos/sitio";

/**
 * Todo abierto salvo lo interno: el laboratorio de cromos, el panel de
 * mensajes y la API del chat. Los bots de los buscadores con IA van
 * nombrados y permitidos a propósito (estudio de referencia, 9.2):
 * queremos que lean el sitio y lo citen.
 */
const BOTS_IA = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot"];
const INTERNO = ["/laboratorio-cromo", "/panel", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: INTERNO },
      ...BOTS_IA.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: INTERNO,
      })),
    ],
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
