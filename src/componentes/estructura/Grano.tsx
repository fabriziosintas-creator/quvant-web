/**
 * El grano de película de las fotos de ambiente. Va encima de una foto
 * con la clase .foto-bn (blanco y negro documental): la regla del sitio
 * desde el 19-oct-2026 es "las fotos en blanco y negro, las pantallas en
 * su color real". Ver .foto-bn y .grano en globals.css.
 */
export function Grano() {
  return <span aria-hidden className="grano pointer-events-none absolute inset-0" />;
}
