"use client";

import { INTERRUPTOR_VISTA } from "@/datos/textos";
import { fijarVista, hayWebGL, useVista, type Vista } from "@/estado/vista";

/**
 * Interruptor VISTA 3D / VISTA TEXTO (estudio de referencia, 9.3): una
 * píldora chica en Plex Mono. Antes flotaba fija abajo al centro y en el
 * celular tapaba contenido y botones; ahora va en su lugar: arriba a la
 * derecha en la computadora (corto) y en el pie en el celular. Sin WebGL
 * no se ofrece: no hay nada que prender.
 */
export function InterruptorVista({ corto = false, className = "" }: { corto?: boolean; className?: string }) {
  const vista = useVista();

  if (vista === "decidiendo" || !hayWebGL()) return null;

  const opciones: { valor: Vista; texto: string }[] = [
    { valor: "3d", texto: corto ? INTERRUPTOR_VISTA.corto3d : INTERRUPTOR_VISTA.opcion3d },
    { valor: "texto", texto: corto ? INTERRUPTOR_VISTA.cortoTexto : INTERRUPTOR_VISTA.opcionTexto },
  ];

  return (
    <div
      role="group"
      aria-label={INTERRUPTOR_VISTA.etiqueta}
      title={INTERRUPTOR_VISTA.etiqueta}
      className={`flex rounded-full border border-profundo bg-profundo/50 p-0.5 ${className}`}
    >
      {opciones.map((opcion) => {
        const activa = vista === opcion.valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => fijarVista(opcion.valor)}
            className={`rounded-full px-3 py-1.5 font-plex text-[10px] font-medium uppercase tracking-etiqueta transition-colors ${
              activa ? "bg-blanco text-negro" : "text-acero hover:text-blanco"
            }`}
          >
            {opcion.texto}
          </button>
        );
      })}
    </div>
  );
}
