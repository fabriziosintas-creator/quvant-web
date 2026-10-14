import { SITIO } from "@/datos/sitio";
import { MARCA, PLATAFORMAS } from "@/datos/textos";

/**
 * Datos estructurados de la portada (estudio de referencia, 9.2):
 * Organization + WebSite + SoftwareApplication para Quvant y HackFit.
 * Sin precios, sin reseñas y sin redes mientras contacto.ts tenga TODOs:
 * acá solo va lo que es verdad hoy.
 */

const gimnasios = PLATAFORMAS.rubros.items.find((rubro) => rubro.id === "gimnasios");
const hackfit = gimnasios?.productos.find((producto) => producto.nombre === "HackFit");

const ID_ORGANIZACION = `${SITIO.url}/#organizacion`;

const GRAFO = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ID_ORGANIZACION,
      name: MARCA.nombre,
      url: `${SITIO.url}/`,
      logo: `${SITIO.url}/icon.svg`,
      slogan: MARCA.bajada,
      description: SITIO.descripcion,
      areaServed: { "@type": "Country", name: "Argentina" },
      // TODO: sumar sameAs (Instagram, LinkedIn) cuando contacto.ts tenga los datos reales.
    },
    {
      "@type": "WebSite",
      name: MARCA.nombre,
      url: `${SITIO.url}/`,
      inLanguage: "es-AR",
      publisher: { "@id": ID_ORGANIZACION },
    },
    {
      "@type": "SoftwareApplication",
      name: MARCA.nombre,
      description: PLATAFORMAS.bajada,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es-AR",
      provider: { "@id": ID_ORGANIZACION },
    },
    ...(hackfit
      ? [
          {
            "@type": "SoftwareApplication",
            name: `${hackfit.nombre} ${hackfit.firma}`.trim(),
            description: hackfit.rol,
            applicationCategory: "HealthApplication",
            inLanguage: "es-AR",
            provider: { "@id": ID_ORGANIZACION },
          },
        ]
      : []),
  ],
};

export function DatosEstructurados() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(GRAFO) }}
    />
  );
}
