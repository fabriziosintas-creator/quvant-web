import type { MetadataRoute } from "next";
import { SITIO } from "@/datos/sitio";

/**
 * Todo abierto salvo el laboratorio interno de cromos. Los bots de los
 * buscadores con IA van nombrados y permitidos a propósito (estudio de
 * referencia, 9.2): queremos que lean el sitio y lo citen.
 */
const BOTS_IA = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/laboratorio-cromo" },
      ...BOTS_IA.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: "/laboratorio-cromo",
      })),
    ],
    sitemap: `${SITIO.url}/sitemap.xml`,
  };
}
