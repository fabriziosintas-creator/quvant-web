"use client";

import { INTERRUPTOR_VISTA } from "@/datos/textos";
import { fijarVista, hayWebGL, useVista, type Vista } from "@/estado/vista";

/**
 * Interruptor VISTA 3D / VISTA TEXTO (estudio de referencia, 9.3): píldora
 * chica, fija abajo al centro, en Plex Mono sobre fondo profundo. Sin WebGL
 * no se ofrece: no hay nada que prender.
 */
export function InterruptorVista() {
  const vista = useVista();

  if (vista === "decidiendo" || !hayWebGL()) return null;

  const opciones: { valor: Vista; texto: string }[] = [
    { valor: "3d", texto: INTERRUPTOR_VISTA.opcion3d },
    { valor: "texto", texto: INTERRUPTOR_VISTA.opcionTexto },
  ];

  return (
    <div
      role="group"
      aria-label={INTERRUPTOR_VISTA.etiqueta}
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 rounded-full border border-profundo bg-profundo/80 p-1 backdrop-blur-sm"
    >
      {opciones.map((opcion) => {
        const activa = vista === opcion.valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => fijarVista(opcion.valor)}
            className={`rounded-full px-3.5 py-1.5 font-plex text-[10px] font-medium uppercase tracking-etiqueta transition-colors ${
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
