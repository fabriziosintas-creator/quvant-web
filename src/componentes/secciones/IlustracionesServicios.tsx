/**
 * Las ilustraciones de los servicios 02 y 03: maquetas sólidas en los
 * grises del manual (profundo, acero sobre negro), con esquinas suaves y
 * sin líneas de 1 px (web más humana, en lugar de los wireframes de
 * línea). No son capturas de ningún sistema: son esquemas de cómo
 * trabajamos. El servicio 01 tiene su propia escena (NucleosQuvant).
 *
 * Cada pieza lleva un `data-pieza` para que ServiciosInteractivos la anime.
 * El SVG queda dibujado en su estado final: la animación es siempre un
 * gsap.from, así que sin animación (vista texto) se ve igual, completo.
 */

const LIENZO = "0 0 480 280";

/** Barras sólidas que sugieren texto dentro de un bloque. */
function Renglones({
  x,
  y,
  anchos,
  separacion = 12,
  alto = 5,
}: {
  x: number;
  y: number;
  anchos: number[];
  separacion?: number;
  alto?: number;
}) {
  return (
    <>
      {anchos.map((ancho, indice) => (
        <rect key={indice} x={x} y={y + indice * separacion} width={ancho} height={alto} rx={alto / 2} className="fill-acero/35" />
      ))}
    </>
  );
}

/** 02 · Las fases: cada una suma una parte usable y se prueba. */
export function IlustracionApp() {
  const fases = [
    { centro: 78, alto: 60 },
    { centro: 186, alto: 100 },
    { centro: 294, alto: 140 },
    { centro: 402, alto: 180 },
  ];
  const BASE = 214;
  const ANCHO = 72;

  return (
    <svg viewBox={LIENZO} className="h-full w-full" aria-hidden>
      {fases.map((fase) => (
        <g key={fase.centro}>
          {/* La app, que crece una fase por vez: un bloque sólido con su barra de arriba. */}
          <g data-pieza="panel">
            <rect x={fase.centro - ANCHO / 2} y={BASE - fase.alto} width={ANCHO} height={fase.alto} rx={6} className="fill-profundo" />
            <rect x={fase.centro - ANCHO / 2} y={BASE - fase.alto} width={ANCHO} height={14} rx={6} className="fill-acero/25" />
            <rect x={fase.centro - ANCHO / 2} y={BASE - fase.alto + 8} width={ANCHO} height={6} className="fill-acero/25" />
            <Renglones x={fase.centro - 24} y={BASE - fase.alto + 28} anchos={[48, 32]} separacion={13} />
          </g>
          {/* El hito de la fase, sobre el riel. */}
          <rect data-pieza="nodo" x={fase.centro - 5} y={221} width={10} height={10} rx={1} className="fill-blanco" />
        </g>
      ))}

      <rect data-pieza="riel" x={48} y={225} width={384} height={2} rx={1} className="fill-profundo" />
      {/* El punto de la marca: descansa en la última fase, o sea que el
          recorrido terminó. La animación lo trae desde la primera. */}
      <rect data-pieza="viajero" x={398} y={246} width={8} height={8} rx={1} className="fill-blanco" />
    </svg>
  );
}

/** 03 · La web que estaba amontonada y se ordena. */
export function IlustracionWeb() {
  return (
    <svg viewBox={LIENZO} className="h-full w-full" aria-hidden>
      {/* Lo primero que se ve, con aire. */}
      <g data-pieza="bloque">
        <rect x={48} y={34} width={384} height={88} rx={8} className="fill-profundo" />
        <rect x={74} y={62} width={176} height={8} rx={4} className="fill-blanco" />
        <rect x={74} y={84} width={122} height={6} rx={3} className="fill-acero/60" />
        <rect x={74} y={100} width={44} height={10} rx={5} className="fill-acero/35" />
      </g>

      {/* Lo que sigue, en una grilla pareja. */}
      {[48, 180, 312].map((x) => (
        <g key={x} data-pieza="bloque">
          <rect x={x} y={138} width={120} height={74} rx={6} className="fill-profundo" />
          <rect x={x + 16} y={152} width={28} height={16} rx={3} className="fill-acero/25" />
          <Renglones x={x + 16} y={180} anchos={[60, 40]} />
        </g>
      ))}

      {/* El cierre. */}
      <g data-pieza="bloque">
        <rect x={48} y={230} width={384} height={16} rx={4} className="fill-profundo/70" />
      </g>
    </svg>
  );
}

export const ILUSTRACIONES = {
  app: IlustracionApp,
  web: IlustracionWeb,
} as const;
