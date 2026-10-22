import { AURORA } from "@/datos/colores";

/**
 * El color de fondo de todo el sitio: los tres colores de la aurora (los
 * de la portada y el pie), muy suaves y quietos, fijos detrás de todo. Así
 * el sitio se siente uno solo sin competir con el color propio de cada
 * sección; la aurora en movimiento y más intensa queda para la portada y
 * el pie (AuroraFondo), y el registro le suma el color del rubro.
 *
 * Sin animación ni filter: blur: no le cuesta nada a un celular. Va detrás
 * del contenido (z-index -1; el fondo negro lo pinta el lienzo, ver body).
 */
export function AmbienteFondo() {
  const [turquesa, azul, ambar] = AURORA;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background: [
          `radial-gradient(60vmax 55vmax at 6% 8%, ${turquesa}12, ${turquesa}07 40%, transparent 70%)`,
          `radial-gradient(55vmax 60vmax at 98% 42%, ${azul}12, ${azul}07 40%, transparent 70%)`,
          `radial-gradient(60vmax 50vmax at 45% 108%, ${ambar}0f, ${ambar}06 40%, transparent 70%)`,
        ].join(", "),
      }}
    />
  );
}
