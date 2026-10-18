import type { ReactNode } from "react";
import type { IdCanal } from "@/datos/colores";

/**
 * Un glifo por canal, en el mismo trazo fino y de puntas cuadradas que los
 * del recorrido del tablero: una ventana (trabajos), tres piezas
 * (servicios), un núcleo con ramas (plataformas), dos fuerzas (nosotros)
 * y una burbuja de charla (contacto).
 */
const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

const GLIFOS: Record<IdCanal, ReactNode> = {
  trabajos: (
    <>
      <rect x="3" y="4" width="18" height="16" {...TRAZO} />
      <path d="M3 8.5h18" {...TRAZO} />
      <rect x="5" y="5.6" width="1.6" height="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  servicios: (
    <>
      <rect x="3" y="3" width="8" height="8" {...TRAZO} />
      <rect x="13" y="3" width="8" height="8" {...TRAZO} />
      <rect x="3" y="13" width="8" height="8" {...TRAZO} />
      <rect x="15" y="15" width="4" height="4" fill="currentColor" stroke="none" />
    </>
  ),
  plataformas: (
    <>
      <circle cx="12" cy="12" r="3.2" {...TRAZO} />
      <path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21" {...TRAZO} />
    </>
  ),
  nosotros: (
    <>
      <rect x="3" y="6" width="11" height="11" {...TRAZO} />
      <rect x="10" y="9" width="11" height="11" {...TRAZO} />
    </>
  ),
  contacto: (
    <>
      <path d="M3 4h18v12H9l-4 4v-4H3z" {...TRAZO} />
      <rect x="15" y="9" width="2" height="2" fill="currentColor" stroke="none" />
    </>
  ),
};

export function IconoCanal({ id, className }: { id: IdCanal; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      {GLIFOS[id]}
    </svg>
  );
}
