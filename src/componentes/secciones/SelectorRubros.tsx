"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { NICHOS } from "@/datos/nucleo";
import { Grano } from "@/componentes/estructura/Grano";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { VideoForja } from "@/componentes/secciones/VideoForja";
import { ACENTO_NICHO } from "@/datos/colores";
import { PLATAFORMAS } from "@/datos/textos";

type Rubro = (typeof PLATAFORMAS.rubros.items)[number];
type IdRubro = Rubro["id"];
type Estado = Rubro["estado"];

function ChipEstado({ estado }: { estado: Estado }) {
  const disponible = estado === "disponible";
  return (
    <span
      className={`shrink-0 border px-2 py-1 font-plex text-xs font-medium uppercase tracking-etiqueta ${
        disponible ? "border-[var(--acento)] text-blanco" : "border-profundo text-acero"
      }`}
    >
      {PLATAFORMAS.estados[estado]}
    </span>
  );
}

/** La foto de ambiente del rubro, en blanco y negro documental (como todas las fotos del sitio). */
function FotoRubro({ id }: { id: string }) {
  const foto = NICHOS.find((n) => n.id === id)?.foto;
  if (!foto) return null;
  return (
    <div className="relative mb-6 aspect-[21/9] overflow-hidden rounded-[10px] border border-profundo bg-negro">
      <Image
        src={foto.src}
        alt={foto.alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="foto-bn object-cover"
      />
      <Grano />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,15,0.05),rgba(13,13,15,0.7))]"
      />
    </div>
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

  // "#rubro-gimnasios" (desde la cuenta: "Mirá la plantilla de tu rubro")
  // abre ese rubro y lleva hasta los rubros.
  useEffect(() => {
    const id = window.location.hash.match(/^#rubro-([a-z]+)$/)?.[1];
    const rubro = rubros.find((item) => item.id === id);
    if (!rubro) return;
    queueMicrotask(() => setActivo(rubro.id));
    document.getElementById("rubros")?.scrollIntoView({ block: "start" });
  }, [rubros]);

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
      <div
        role="tablist"
        aria-label={PLATAFORMAS.rubros.etiqueta}
        aria-orientation="vertical"
        className="min-w-0"
      >
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
              aria-controls={
                item.id === "industria" ? `panel-${item.id} panel-industria-recorrido` : `panel-${item.id}`
              }
              tabIndex={seleccionado ? 0 : -1}
              onClick={() => setActivo(item.id)}
              onKeyDown={(evento) => alTeclear(evento, indice)}
              className="group flex w-full items-center justify-between gap-4 border-b border-profundo py-4 text-left first:border-t md:py-5"
            >
              {/* El nombre baja de renglón en vez de cortarse ("INDUSTRI…", "GIMNASIOS Y FIT…"). */}
              <span className="flex min-w-0 items-baseline gap-3 sm:gap-4">
                <span className="font-plex text-xs text-acero">0{indice + 1}</span>
                <span
                  className={`min-w-0 font-michroma text-sm uppercase leading-snug tracking-[0.12em] transition-colors group-hover:text-blanco sm:text-base sm:tracking-marca lg:text-lg ${
                    seleccionado ? "text-blanco" : "text-acero"
                  }`}
                >
                  {item.nombre}
                </span>
                {seleccionado ? (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 translate-y-[-2px] bg-[var(--acento)]"
                  />
                ) : null}
              </span>
              <ChipEstado estado={item.estado} />
            </button>
          );
        })}
      </div>

      {/* Todos los paneles existen en el HTML del servidor (el texto de cada
          producto es indexable); solo el activo se muestra. */}
      <div className="min-w-0">
        {rubros.map((item) => (
          <div
            key={item.id}
            role="tabpanel"
            id={`panel-${item.id}`}
            aria-labelledby={`pestania-${item.id}`}
            hidden={item.id !== activo}
          >
            <FotoRubro id={item.id} />
            <p className="font-lectura text-[15px] leading-relaxed text-acero">{item.descripcion}</p>

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
                        <p className="mt-1.5 font-plex text-xs uppercase tracking-etiqueta text-acero">
                          {producto.firma}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-lectura text-[15px] leading-relaxed text-acero">{producto.rol}</p>
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

            {/* Al registro con este rubro ya elegido (y anotado de dónde vino). */}
            <div className="mt-6 flex flex-col gap-3 border-t border-profundo pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-lectura text-sm leading-relaxed text-acero">{PLATAFORMAS.rubros.registrarmeNota}</p>
              <Link
                href={`/registro?nicho=${item.id}&origen=plataformas-rubros`}
                style={{ "--acento": ACENTO_NICHO[item.id] } as CSSProperties}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 border border-[var(--acento)] px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:bg-profundo/60"
              >
                <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
                {PLATAFORMAS.rubros.registrarme}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* El recorrido de Forja va en su propia fila, a todo el ancho: la
          interfaz grabada necesita lugar para leerse. Es parte de Industria
          (la pestaña lo declara en aria-controls) y solo corre con ella elegida. */}
      <div id="panel-industria-recorrido" className="min-w-0 lg:col-span-2" hidden={activo !== "industria"}>
        <VideoForja activo={activo === "industria"} />
      </div>
    </div>
  );
}
