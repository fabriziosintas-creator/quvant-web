import type { SVGProps } from "react";

/**
 * Isotipo Q de Quvant, redibujado según el manual de identidad.
 * Lienzo de 105 × 105 con el eje Y hacia abajo:
 *  - Aro: círculo de centro (44, 44), radio 31, trazo 10.
 *  - Cola: recta a 45° de (63, 63) a (80, 80), trazo 10, extremos planos.
 *  - Punto: cuadrado separado, esquina en (86, 86), lado 11.
 * El degradado de cromo corre a lo largo de (8, 20) → (97, 85).
 */

const PARADAS_CROMO = [
  ["0", "#FFFFFF"],
  ["0.1667", "#D9DCE0"],
  ["0.3333", "#3A3D42"],
  ["0.5", "#F2F4F6"],
  ["0.6667", "#6C7076"],
  ["0.8333", "#FFFFFF"],
  ["1", "#9DA1A7"],
] as const;

const NEGRO_QUVANT = "#0D0D0F";

type Props = {
  /** "cromo" sobre negro (principal). "negativo" en negro plano para fondos claros. */
  variante?: "cromo" | "negativo";
  /** Id del degradado: tiene que ser distinto en cada instancia de una misma página. */
  idGradiente?: string;
  /** Si se pasa, el SVG deja de ser decorativo y se anuncia con este nombre. */
  titulo?: string;
} & Omit<SVGProps<SVGSVGElement>, "viewBox">;

export function IsotipoQ({
  variante = "cromo",
  idGradiente = "q-cromo",
  titulo,
  ...resto
}: Props) {
  const pintura = variante === "cromo" ? `url(#${idGradiente})` : NEGRO_QUVANT;

  return (
    <svg
      viewBox="0 0 105 105"
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      {...resto}
    >
      {titulo ? <title>{titulo}</title> : null}
      {variante === "cromo" ? (
        <defs>
          <linearGradient
            id={idGradiente}
            gradientUnits="userSpaceOnUse"
            x1="8"
            y1="20"
            x2="97"
            y2="85"
          >
            {PARADAS_CROMO.map(([posicion, color]) => (
              <stop key={posicion} offset={posicion} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
      ) : null}
      <circle cx="44" cy="44" r="31" fill="none" stroke={pintura} strokeWidth="10" />
      <line x1="63" y1="63" x2="80" y2="80" stroke={pintura} strokeWidth="10" strokeLinecap="butt" />
      <rect x="86" y="86" width="11" height="11" fill={pintura} />
    </svg>
  );
}
