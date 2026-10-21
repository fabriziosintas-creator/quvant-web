import type { MetadataRoute } from "next";
import { PROMO } from "@/datos/promo";
import { SITIO } from "@/datos/sitio";
import { obtenerEstadoPromo, promoAbierta } from "@/servidor/promo/estado";
import { CANALES } from "@/datos/textos";

/**
 * La portada y la página de cada canal. /laboratorio-cromo es una
 * herramienta interna y no se lista. "Primeros 100", solo mientras la
 * promo esté abierta.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const promo = promoAbierta(await obtenerEstadoPromo());
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
    ...(promo ? [{ url: `${SITIO.url}${PROMO.ruta}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 }] : []),
  ];
}
