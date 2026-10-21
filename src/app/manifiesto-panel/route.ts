/**
 * El manifiesto del panel (app instalable: "Agregar a la pantalla de
 * inicio"). Solo lo enlaza el layout del panel, así la web pública no
 * cambia. Abre directo en el mapa, que es lo que se usa en la calle.
 */
export function GET() {
  return Response.json(
    {
      name: "Quvant · Panel",
      short_name: "Quvant",
      description: "El panel interno de Quvant: el mapa de prospección, también sin señal.",
      id: "/panel/",
      start_url: "/panel/mapa",
      scope: "/panel/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0D0D0F",
      theme_color: "#0D0D0F",
      lang: "es-AR",
      icons: [
        { src: "/manifiesto-panel/icono/192", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/manifiesto-panel/icono/512", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/manifiesto-panel/icono/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
  );
}
