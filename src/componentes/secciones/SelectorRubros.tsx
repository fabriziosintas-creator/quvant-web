"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { DepositoForjaDiferido } from "@/componentes/3d/DepositoForjaDiferido";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { PLATAFORMAS } from "@/datos/textos";

type Rubro = (typeof PLATAFORMAS.rubros.items)[number];
type IdRubro = Rubro["id"];
type Estado = Rubro["estado"];

function ChipEstado({ estado }: { estado: Estado }) {
  const disponible = estado === "disponible";
  return (
    <span
      className={`shrink-0 border px-2 py-1 font-plex text-[10px] font-medium uppercase tracking-etiqueta ${
        disponible ? "border-acero text-blanco" : "border-profundo text-acero"
      }`}
    >
      {PLATAFORMAS.estados[estado]}
    </span>
  );
}

/**
 * Selector de rubros: lista de titulares en Michroma a la izquierda y el
 * panel con los productos del rubro elegido a la derecha (apilado en el
 * celular). Pestañas accesibles: flechas para moverse, foco visible.
 */
export function SelectorRubros() {
  const rubros = PLATAFORMAS.rubros.items;
  const [activo, setActivo] = useState<IdRubro>(rubros[0].id);
  const botones = useRef<Array<HTMLButtonElement | null>>([]);

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const ultimo = rubros.length - 1;
    let destino: number | null = null;
    if (evento.key === "ArrowDown" || evento.key === "ArrowRight") destino = indice === ultimo ? 0 : indice + 1;
    if (evento.key === "ArrowUp" || evento.key === "ArrowLeft") destino = indice === 0 ? ultimo : indice - 1;
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = ultimo;
    if (destino === null) return;
    evento.preventDefault();
    setActivo(rubros[destino].id);
    botones.current[destino]?.focus();
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
      <div role="tablist" aria-label={PLATAFORMAS.rubros.etiqueta} aria-orientation="vertical">
        {rubros.map((item, indice) => {
          const seleccionado = item.id === activo;
          return (
            <button
              key={item.id}
              ref={(elemento) => {
                botones.current[indice] = elemento;
              }}
              type="button"
              role="tab"
              id={`pestania-${item.id}`}
              aria-selected={seleccionado}
              aria-controls={`panel-${item.id}`}
              tabIndex={seleccionado ? 0 : -1}
              onClick={() => setActivo(item.id)}
              onKeyDown={(evento) => alTeclear(evento, indice)}
              className="group flex w-full items-center justify-between gap-4 border-b border-profundo py-4 text-left first:border-t md:py-5"
            >
              <span className="flex min-w-0 items-baseline gap-4">
                <span className="font-plex text-xs text-acero">0{indice + 1}</span>
                <span
                  className={`truncate font-michroma text-base uppercase tracking-marca transition-colors group-hover:text-blanco md:text-xl ${
                    seleccionado ? "text-blanco" : "text-acero"
                  }`}
                >
                  {item.nombre}
                </span>
                {seleccionado ? (
                  <span aria-hidden className="size-1.5 shrink-0 translate-y-[-2px] bg-blanco" />
                ) : null}
              </span>
              <ChipEstado estado={item.estado} />
            </button>
          );
        })}
      </div>

      {/* Todos los paneles existen en el HTML del servidor (el texto de cada
          producto es indexable); solo el activo se muestra. */}
      <div>
        {rubros.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`panel-${item.id}`}
            aria-labelledby={`pestania-${item.id}`}
            hidden={item.id !== activo}
          >
            <p className="font-plex text-sm leading-relaxed text-acero">{item.descripcion}</p>

            {item.productos.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {item.productos.map((producto) => (
                  <TarjetaViva key={producto.nombre} className="border border-profundo p-6">
                    <article className="flex flex-col gap-3">
                    <div>
                      <h4 className="font-michroma text-base uppercase tracking-marca text-blanco md:text-lg">
                        {producto.nombre}
                      </h4>
                      {producto.firma ? (
                        <p className="mt-1.5 font-plex text-[11px] uppercase tracking-etiqueta text-acero">
                          {producto.firma}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-plex text-sm leading-relaxed text-acero">{producto.rol}</p>
                    </article>
                  </TarjetaViva>
                ))}
              </div>
            ) : (
              <div className="mt-6 border border-profundo p-8 text-center md:p-12">
                <p className="font-michroma text-xl uppercase tracking-marca text-blanco md:text-2xl">
                  {PLATAFORMAS.estados[item.estado]}
                </p>
                <p className="mt-3 font-plex text-sm text-acero">{PLATAFORMAS.rubros.notaVacio}</p>
              </div>
            )}

            {item.id === "industria" ? (
              <div className="mt-6">
                {/* El lienzo 3D solo corre cuando este panel está a la vista. */}
                <DepositoForjaDiferido activo={activo === "industria"} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
