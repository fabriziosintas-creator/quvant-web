import { PLATAFORMAS } from "@/datos/textos";

/**
 * La cinta de rubros de la portada: los nombres en Michroma, separados por
 * el punto cuadrado, desplazándose despacio y sin fin. Es movimiento puro
 * de CSS (ver .cinta en globals.css): se frena con el puntero encima y no
 * se mueve con prefers-reduced-motion ni en vista texto.
 *
 * Es decorativa (los rubros se listan de verdad en Plataformas), por eso
 * va oculta para los lectores de pantalla. Dos copias seguidas, cada una
 * con su separador adentro, para que el bucle no tenga costura.
 */
export function CintaRubros() {
  const nombres = PLATAFORMAS.rubros.items.map((rubro) => rubro.nombre);
  const copia = (clave: string) =>
    nombres.map((nombre) => (
      <span key={`${clave}-${nombre}`} className="flex items-center">
        <span className="px-6 font-michroma text-[13px] uppercase tracking-marca text-acero md:px-8 md:text-sm">
          {nombre}
        </span>
        <span className="size-1.5 bg-profundo" />
      </span>
    ));

  return (
    <div
      aria-hidden
      className="cinta mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
    >
      <div className="cinta-pista flex w-max whitespace-nowrap">
        {copia("a")}
        {copia("b")}
      </div>
    </div>
  );
}
