import React from "react";

/**
 * El recurso gráfico del manual, vivo: la grilla de puntos cuadrados y uno
 * que salta. En reposo la grilla está casi en el negro del fondo (la
 * tarjeta se sigue viendo limpia); al pasar el puntero se enciende en
 * acero alrededor de él y un punto blanco salta de nodo en nodo, nunca
 * entre medio.
 *
 * No escucha nada: lee las variables que deja TarjetaInclinada
 * (--puntero-x/y, --salto-x/y y --cerca), que heredan por CSS.
 */

const PASO = 18;
const LADO_PUNTO = 2;
/** Apenas por encima del negro: en reposo no compite con el texto. */
const CASI_NEGRO = "#16161A";

const grilla = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PASO}" height="${PASO}"><rect width="${LADO_PUNTO}" height="${LADO_PUNTO}" fill="${color}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

// El halo es una máscara (alfa), no un color: la paleta no se toca.
const HALO =
  "radial-gradient(circle 130px at var(--puntero-x, 50%) var(--puntero-y, 50%), #000 0%, rgba(0,0,0,0.4) 55%, transparent 78%)";

export function GrillaYSalto() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute inset-0" style={{ backgroundImage: grilla(CASI_NEGRO) }} />

      <span
        className="absolute inset-0 transition-opacity duration-300 motion-reduce:hidden"
        style={{
          backgroundImage: grilla("#9C9CA3"),
          opacity: "var(--cerca, 0)",
          maskImage: HALO,
          WebkitMaskImage: HALO,
        }}
      />

      {/* El que salta: se para en el nodo más cercano al puntero. */}
      <span
        className="absolute size-[5px] bg-blanco motion-reduce:hidden"
        style={{
          left: "var(--salto-x, -20px)",
          top: "var(--salto-y, -20px)",
          // El punto de la grilla mide 2 px: esto centra el blanco encima.
          marginLeft: -(5 - LADO_PUNTO) / 2,
          marginTop: -(5 - LADO_PUNTO) / 2,
          opacity: "var(--cerca, 0)",
          transition:
            "left 130ms cubic-bezier(0.2, 0.9, 0.2, 1), top 130ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 220ms linear",
        }}
      />
    </span>
  );
}

export const PASO_GRILLA = PASO;
