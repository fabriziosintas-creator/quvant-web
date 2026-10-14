/**
 * Datos del sitio como publicación: una sola fuente para el canonical,
 * el Open Graph, el sitemap, el robots y el JSON-LD.
 */

export const SITIO = {
  /**
   * TODO: cambiar por el dominio propio cuando se compre (con https y sin
   * barra final, por ejemplo "https://quvant.com.ar"). Mientras tanto va la
   * URL de Vercel, que es donde el sitio vive de verdad: así la vista previa
   * al compartir el link y el sitemap apuntan a algo que existe.
   */
  url: "https://quvant-web.vercel.app",

  titulo: "Quvant | Desarrollo de software y sistemas de gestión en Argentina",
  descripcion:
    "Sistemas de gestión listos para cada rubro, aplicaciones a medida y páginas web. Entramos en tu rubro, entendemos cómo trabaja y construimos el sistema que todavía no tiene.",
} as const;
