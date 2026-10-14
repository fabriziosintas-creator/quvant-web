/**
 * Datos del sitio como publicación: una sola fuente para el canonical,
 * el Open Graph, el sitemap, el robots y el JSON-LD.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  TODO: poner el dominio real antes de publicar. El valor    │
 * │  de abajo es un EJEMPLO y no existe.                        │
 * └─────────────────────────────────────────────────────────────┘
 */

export const SITIO = {
  /** TODO: dominio real, con https y sin barra final. Ejemplo: "https://quvant.com.ar". */
  url: "https://www.tudominio.com",

  titulo: "Quvant | Desarrollo de software y sistemas de gestión en Argentina",
  descripcion:
    "Sistemas de gestión listos para cada rubro, aplicaciones a medida y páginas web. Entramos en tu rubro, entendemos cómo trabaja y construimos el sistema que todavía no tiene.",
} as const;
