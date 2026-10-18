import type { MetadataRoute } from "next";
import { SITIO } from "@/datos/sitio";
import { CANALES } from "@/datos/textos";

/**
 * La portada y la página de cada canal. /laboratorio-cromo es una
 * herramienta interna y no se lista.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITIO.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...CANALES.map((canal) => ({
      url: `${SITIO.url}${canal.ruta}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: canal.id === "trabajos" || canal.id === "servicios" ? 0.9 : 0.7,
    })),
  ];
}
