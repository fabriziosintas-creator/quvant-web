/**
 * Las tres ilustraciones de los servicios: wireframes de línea sobre negro,
 * en el mismo idioma gráfico que el depósito de Forja. No son capturas de
 * ningún sistema: son esquemas de cómo trabajamos.
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

/** 01 · El núcleo común y la plantilla del rubro que encaja encima. */
export function IlustracionSistemas() {
  const modulos = [
    { x: 48, y: 142 },
    { x: 192, y: 142 },
    { x: 336, y: 142 },
    { x: 48, y: 206 },
    { x: 192, y: 206 },
    { x: 336, y: 206 },
  ];

  return (
    <svg viewBox={LIENZO} className="h-full w-full" aria-hidden>
      {/* La plantilla del rubro: lo que cambia de un cliente a otro. */}
      <g data-pieza="plantilla">
        <rect
          x={130}
          y={26}
          width={220}
          height={68}
          className="fill-negro stroke-blanco"
          strokeWidth={1.5}
        />
        <line x1={148} y1={50} x2={248} y2={50} className="stroke-blanco" strokeWidth={2} />
        <line x1={148} y1={68} x2={300} y2={68} className="stroke-acero" strokeWidth={2} />
        <rect x={320} y={44} width={10} height={10} className="fill-blanco" />
      </g>

      {/* Los puntos de encastre con el núcleo. */}
      {[180, 240, 300].map((x) => (
        <line
          key={x}
          data-pieza="union"
          x1={x}
          y1={94}
          x2={x}
          y2={142}
          className="stroke-acero"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
      ))}

      {/* El núcleo común: los módulos que ya funcionan en todos los rubros. */}
      {modulos.map((modulo) => (
        <g key={`${modulo.x}-${modulo.y}`} data-pieza="modulo">
          <rect
            x={modulo.x}
            y={modulo.y}
            width={96}
            height={44}
            className="fill-negro stroke-acero"
            strokeWidth={1.5}
          />
          <LineasInternas x={modulo.x + 14} y={modulo.y + 17} anchos={[44, 28]} />
        </g>
      ))}
    </svg>
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
  sistemas: IlustracionSistemas,
  app: IlustracionApp,
  web: IlustracionWeb,
} as const;
