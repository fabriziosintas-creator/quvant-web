/**
 * Datos del sitio como publicación: una sola fuente para el canonical,
 * el Open Graph, el sitemap, el robots y el JSON-LD.
 */

export const SITIO = {
  /**
   * El dominio propio (comprado en nic.ar el 20-oct-2026 y delegado a
   * Vercel). Con https y sin barra final. "www" es el principal: el apex
   * quvant.com.ar redirige acá.
   */
  url: "https://www.quvant.com.ar",

  titulo: "Quvant | Desarrollo de software y sistemas de gestión en Argentina",
  descripcion:
    "Sistemas de gestión listos para cada rubro, aplicaciones a medida y páginas web. Entramos en tu rubro, entendemos cómo trabaja y construimos el sistema que todavía no tiene.",
} as const;
