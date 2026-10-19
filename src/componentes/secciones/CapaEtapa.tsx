import type { ReactNode } from "react";
import type { IdEtapa } from "@/datos/objetivo";

/**
 * La capa gráfica de la marca sobre la foto de cada etapa de "Cómo
 * trabajamos": líneas finas y el punto cuadrado, en el color del
 * recorrido (--acento). Cuando la etapa pasa al frente, los trazos se
 * dibujan (clase .trazo-etapa, ver globals.css).
 *
 * Coordenadas en un lienzo de 160 × 100 que cubre la foto igual que ella
 * (slice): en el celular se recorta arriba y abajo, como la foto. Con las
 * fotos de la sesión, si algo queda corrido, se ajustan acá los números.
 */

const TRAZO = {
  fill: "none",
  stroke: "var(--acento)",
  strokeWidth: 1.25,
  vectorEffect: "non-scaling-stroke" as const,
  strokeLinecap: "square" as const,
  pathLength: 1,
  className: "trazo-etapa",
};

/** Un punto cuadrado de la marca (los rellenos no se dibujan: aparecen). */
const Punto = ({ x, y, lado = 1.6 }: { x: number; y: number; lado?: number }) => (
  <rect className="punto-etapa" x={x - lado / 2} y={y - lado / 2} width={lado} height={lado} fill="var(--acento)" />
);

/** Las ondas que "escuchan" un punto. */
const Escucha = ({ x, y, demora = 0 }: { x: number; y: number; demora?: number }) => (
  <g>
    {[0, 0.8, 1.6].map((retraso) => (
      <circle
        key={retraso}
        className="onda-etapa"
        cx={x}
        cy={y}
        r={7}
        fill="none"
        stroke="var(--acento)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        style={{ animationDelay: `${demora + retraso}s` }}
      />
    ))}
    <circle {...TRAZO} cx={x} cy={y} r={3.2} style={{ animationDelay: `${demora}s` }} />
    <Punto x={x} y={y} />
  </g>
);

const CAPAS: Record<IdEtapa, ReactNode> = {
  escuchar: (
    <>
      <Escucha x={58} y={58} />
      <Escucha x={112} y={64} demora={0.4} />
      <path {...TRAZO} d="M61.2 58 L108.8 64" style={{ animationDelay: "0.5s" }} />
    </>
  ),
  sonar: (
    <>
      {/* La red: nodos unidos, como el mapa de sucursales de Forja. */}
      <path {...TRAZO} d="M22 70 L52 38 L92 52 L128 26 L146 60" style={{ animationDelay: "0.1s" }} />
      <path {...TRAZO} d="M52 38 L74 78 L92 52 M74 78 L128 74 L146 60" style={{ animationDelay: "0.45s" }} />
      {[
        [22, 70],
        [52, 38],
        [92, 52],
        [128, 26],
        [146, 60],
        [74, 78],
        [128, 74],
      ].map(([x, y]) => (
        <Punto key={`${x}-${y}`} x={x} y={y} lado={2} />
      ))}
    </>
  ),
  bajar: (
    <>
      {/* Las ideas sueltas bajan a tres fases ordenadas. */}
      <path {...TRAZO} d="M118 20 C118 44 40 40 40 66" style={{ animationDelay: "0.1s" }} />
      <path {...TRAZO} d="M126 24 C126 48 82 44 82 66" style={{ animationDelay: "0.25s" }} />
      <path {...TRAZO} d="M134 28 C134 50 124 46 124 66" style={{ animationDelay: "0.4s" }} />
      <rect {...TRAZO} x={22} y={68} width={36} height={14} style={{ animationDelay: "0.7s" }} />
      <rect {...TRAZO} x={64} y={68} width={36} height={14} style={{ animationDelay: "0.85s" }} />
      <rect {...TRAZO} x={106} y={68} width={36} height={14} style={{ animationDelay: "1s" }} />
      {[40, 82, 124].map((x) => (
        <Punto key={x} x={x} y={75} lado={2} />
      ))}
    </>
  ),
  construir: (
    <>
      {/* La pantalla funcionando: el tablero en una tablet. */}
      <rect {...TRAZO} x={94} y={30} width={50} height={36} rx={2} style={{ animationDelay: "0.1s" }} />
      <path {...TRAZO} d="M100 58 L100 50 M107 58 L107 44 M114 58 L114 47 M121 58 L121 40 M128 58 L128 43 M135 58 L135 37" style={{ animationDelay: "0.5s" }} />
      <path {...TRAZO} d="M98 36 L118 36" style={{ animationDelay: "0.4s" }} />
      <g className="latido-etapa">
        <Punto x={140} y={34} lado={2.6} />
      </g>
    </>
  ),
};

export function CapaEtapa({ id, activa }: { id: IdEtapa; activa: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      data-activa={activa ? "si" : "no"}
      className="capa-etapa pointer-events-none absolute inset-0 h-full w-full"
    >
      {CAPAS[id]}
    </svg>
  );
}
