/**
 * El grano de película de las fotos. Va encima de una foto con la clase
 * .foto-real (color real con un retoque leve, web más humana): las
 * pantallas van sin grano y en su color. Ver .foto-real y .grano en
 * globals.css.
 */
export function Grano() {
  return <span aria-hidden className="grano pointer-events-none absolute inset-0" />;
}
