import type { MetadataRoute } from "next";
import { SITIO } from "@/datos/sitio";

/**
 * Por ahora el sitio es una sola página; las subpáginas SEO del estudio
 * (sistemas por rubro, casos, preguntas frecuentes) se suman acá cuando
 * existan. /laboratorio-cromo es una herramienta interna y no se lista.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITIO.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
