import type { ReactNode } from "react";

type Props = {
  /** El id del capítulo en CANALES (el riel lo usa para saltar y marcar dónde estás). */
  id: string;
  etiqueta: string;
  children: ReactNode;
  /** Para los bloques que ya traen su propio contenedor (el recorrido fijo, por ejemplo). */
  sinContenedor?: boolean;
  /** El título grande, con este degradé en las letras (un capítulo que es el corazón de la página). */
  degrade?: string;
};

/**
 * Un capítulo de una página de canal: una franja con su etiqueta (que es
 * el h2, chico) y el contenido. Cada capítulo es una idea: el riel de
 * capítulos (RielCapitulos) lo lista y marca cuál se está viendo. Con
 * `degrade`, el h2 va grande y con las letras en degradé.
 */
export function Capitulo({ id, etiqueta, children, sinContenedor = false, degrade }: Props) {
  const titulo = degrade ? (
    <h2
      id={`${id}-titulo`}
      data-revelar
      className="w-fit titulo text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.02] bg-clip-text text-transparent"
      style={{ backgroundImage: degrade }}
    >
      {etiqueta}
    </h2>
  ) : (
    <h2
      id={`${id}-titulo`}
      data-revelar
      className="flex items-center gap-3 font-lectura text-sm font-medium text-acero"
    >
      <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
      {etiqueta}
    </h2>
  );

  return (
    <section
      id={id}
      data-capitulo={id}
      aria-labelledby={`${id}-titulo`}
      className="scroll-mt-32 md:scroll-mt-36"
    >
      {sinContenedor ? (
        <>
          <div className="sr-only">{titulo}</div>
          {children}
        </>
      ) : (
        <div className="contenedor py-20 md:py-32">
          {titulo}
          <div className="mt-8 md:mt-10">{children}</div>
        </div>
      )}
    </section>
  );
}
