import { IsotipoQ } from "./IsotipoQ";
import { MARCA } from "@/datos/textos";

type Props = {
  /** "cromo" sobre negro (principal). "negativo" todo en negro para fondos claros. */
  variante?: "cromo" | "negativo";
  /** Id del degradado del isotipo: distinto en cada instancia de una misma página. */
  idGradiente?: string;
  className?: string;
};

/**
 * Firma horizontal del manual: isotipo + QUVANT en Michroma.
 * Todo el conjunto escala con el font-size del contenedor (la Q mide en em),
 * así que el tamaño se controla con una clase de texto en `className`.
 */
export function Logotipo({ variante = "cromo", idGradiente = "q-logo", className }: Props) {
  return (
    <span className={`inline-flex items-center gap-[0.65em] ${className ?? ""}`}>
      <IsotipoQ
        variante={variante}
        idGradiente={idGradiente}
        className="h-[1.6em] w-[1.6em] shrink-0"
      />
      {/* El tracking agrega espacio después de la T final; el margen negativo lo compensa. */}
      <span
        className={`font-michroma leading-none tracking-marca -me-[0.18em] ${
          variante === "negativo" ? "text-negro" : "text-blanco"
        }`}
      >
        {MARCA.logotipo}
      </span>
    </span>
  );
}
