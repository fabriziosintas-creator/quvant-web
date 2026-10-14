/**
 * Las ilustraciones de los servicios 02 y 03: wireframes de línea sobre
 * negro. No son capturas de ningún sistema: son esquemas de cómo
 * trabajamos. El servicio 01 tiene su propia escena (NucleosQuvant).
 *
 * Cada pieza lleva un `data-pieza` para que ServiciosInteractivos la anime.
 * El SVG queda dibujado en su estado final: la animación es siempre un
 * gsap.from, así que sin animación (vista texto) se ve igual, completo.
 */

const LIENZO = "0 0 480 280";

/** Líneas internas que sugieren contenido dentro de un bloque. */
function LineasInternas({
  x,
  y,
  anchos,
  separacion = 12,
}: {
  x: number;
  y: number;
  anchos: number[];
  separacion?: number;
}) {
  return (
    <>
      {anchos.map((ancho, indice) => (
        <line
          key={indice}
          x1={x}
          y1={y + indice * separacion}
          x2={x + ancho}
          y2={y + indice * separacion}
          className="stroke-profundo"
          strokeWidth={2}
        />
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
          {/* La app, que crece una fase por vez. */}
          <g data-pieza="panel">
            <rect
              x={fase.centro - ANCHO / 2}
              y={BASE - fase.alto}
              width={ANCHO}
              height={fase.alto}
              className="fill-negro stroke-acero"
              strokeWidth={1.5}
            />
            <line
              x1={fase.centro - ANCHO / 2}
              y1={BASE - fase.alto + 16}
              x2={fase.centro + ANCHO / 2}
              y2={BASE - fase.alto + 16}
              className="stroke-acero"
              strokeWidth={1.5}
            />
            <LineasInternas
              x={fase.centro - 22}
              y={BASE - fase.alto + 32}
              anchos={[44, 30]}
              separacion={12}
            />
          </g>
          {/* El hito de la fase, sobre el riel. */}
          <rect
            data-pieza="nodo"
            x={fase.centro - 5}
            y={221}
            width={10}
            height={10}
            className="fill-blanco"
          />
        </g>
      ))}

      <line
        data-pieza="riel"
        x1={48}
        y1={226}
        x2={432}
        y2={226}
        className="stroke-profundo"
        strokeWidth={2}
      />
      {/* El punto de la marca: descansa en la última fase, o sea que el
          recorrido terminó. La animación lo trae desde la primera. */}
      <rect data-pieza="viajero" x={398} y={246} width={8} height={8} className="fill-blanco" />
    </svg>
  );
}

/** 03 · La web que estaba amontonada y se ordena. */
export function IlustracionWeb() {
  return (
    <svg viewBox={LIENZO} className="h-full w-full" aria-hidden>
      {/* Lo primero que se ve, con aire. */}
      <g data-pieza="bloque">
        <rect
          x={48}
          y={34}
          width={384}
          height={88}
          className="fill-negro stroke-blanco"
          strokeWidth={1.5}
        />
        <line x1={74} y1={70} x2={250} y2={70} className="stroke-blanco" strokeWidth={3} />
        <line x1={74} y1={90} x2={196} y2={90} className="stroke-acero" strokeWidth={2} />
      </g>

      {/* Lo que sigue, en una grilla pareja. */}
      {[48, 180, 312].map((x) => (
        <g key={x} data-pieza="bloque">
          <rect
            x={x}
            y={138}
            width={120}
            height={74}
            className="fill-negro stroke-acero"
            strokeWidth={1.5}
          />
          <LineasInternas x={x + 16} y={166} anchos={[60, 40]} />
        </g>
      ))}

      {/* El cierre. */}
      <g data-pieza="bloque">
        <rect
          x={48}
          y={230}
          width={384}
          height={16}
          className="fill-negro stroke-profundo"
          strokeWidth={1.5}
        />
      </g>
    </svg>
  );
}

export const ILUSTRACIONES = {
  app: IlustracionApp,
  web: IlustracionWeb,
} as const;
