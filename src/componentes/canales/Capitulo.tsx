import type { ReactNode } from "react";

type Props = {
  /** El id del capítulo en CANALES (el riel lo usa para saltar y marcar dónde estás). */
  id: string;
  etiqueta: string;
  children: ReactNode;
  /** Para los bloques que ya traen su propio contenedor (el recorrido fijo, por ejemplo). */
  sinContenedor?: boolean;
};

/**
 * Un capítulo de una página de canal: una franja con su etiqueta (que es
 * el h2, chico, en Michroma) y el contenido. Cada capítulo es una idea:
 * el riel de capítulos (RielCapitulos) lo lista y marca cuál se está viendo.
 */
export function Capitulo({ id, etiqueta, children, sinContenedor = false }: Props) {
  const titulo = (
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
