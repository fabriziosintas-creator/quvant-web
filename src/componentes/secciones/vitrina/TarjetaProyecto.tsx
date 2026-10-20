"use client";

import Image from "next/image";
import { ViewTransition, useState, type CSSProperties, type Ref } from "react";
import { TarjetaInclinada } from "@/componentes/estructura/TarjetaInclinada";
import { TIPOS, type Proyecto } from "@/datos/portfolio";
import { WEBS } from "@/datos/textos";
import { direccionCorta, dosDigitos, duracionRecorrido, esLarga } from "./comun";

type Props = {
  proyecto: Proyecto;
  numero: number;
  /** En el carrusel del celular: la que quedó centrada se recorre sola. */
  alFrente: boolean;
  /**
   * Con el visor abierto la pantalla suelta su nombre de transición: así
   * el visor puede tomarlo y la tarjeta "se agranda" hasta él.
   */
  visorAbierto: boolean;
  botonRef: Ref<HTMLButtonElement>;
  onAbrir: () => void;
};

/**
 * Una tarjeta del portfolio: la web dentro de una ventana de navegador.
 * Al pasar el mouse la captura baja sola (si la página es larga), asoma la
 * versión de celular por la esquina y se enciende un brillo del color del
 * proyecto donde está el puntero. Al tocarla se abre el visor.
 */
export function TarjetaProyecto({ proyecto, numero, alFrente, visorAbierto, botonRef, onAbrir }: Props) {
  const vista = proyecto.vistas[0];
  const larga = esLarga(vista.escritorio[0]);
  // La captura larga pesa: se pide recién cuando alguien se acerca.
  const [despierta, setDespierta] = useState(false);
  const [lista, setLista] = useState(false);
  const despertar = () => setDespierta(true);
  const celular = proyecto.formato === "celular";

  const pantalla = (
    <span className="pantalla-web relative block aspect-[16/10] overflow-hidden bg-negro">
      {celular ? (
        <>
          {/* El fondo: la misma pantalla, grande y desenfocada. */}
          <Image
            src={vista.portadaCelular.src}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 84vw"
            className="scale-125 object-cover opacity-35 blur-2xl"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="relative block h-[88%] overflow-hidden rounded-[16px] border border-profundo bg-negro shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] transition-transform duration-(--duracion-lenta) ease-quvant group-hover:-translate-y-2 aspect-[600/1298]">
              <Image
                src={vista.portadaCelular.src}
                alt=""
                fill
                sizes="(min-width: 768px) 12vw, 36vw"
                className="object-cover object-top"
              />
            </span>
          </span>
        </>
      ) : (
        <>
          <Image
            src={vista.portada.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 84vw"
            className="object-cover object-top"
          />
          {larga && (despierta || alFrente) ? (
            <Image
              src={vista.escritorio[0].src}
              alt=""
              width={vista.escritorio[0].ancho}
              height={vista.escritorio[0].alto}
              sizes="(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 84vw"
              onLoad={() => setLista(true)}
              className={`desliz-web absolute inset-x-0 top-0 h-auto w-full transition-opacity duration-(--duracion-media) ${
                lista ? "opacity-100" : "opacity-0"
              }`}
              style={{ "--recorrido": duracionRecorrido(vista.escritorio[0]) } as CSSProperties}
            />
          ) : null}
          {/* La versión de celular, asomando por la esquina. */}
          <span className="telefono-web absolute bottom-0 right-[5%] block w-[22%] overflow-hidden rounded-2xl border border-profundo bg-negro shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)] aspect-[600/1298]">
            <Image src={vista.portadaCelular.src} alt="" fill sizes="(min-width: 768px) 11vw, 20vw" className="object-cover object-top" />
          </span>
        </>
      )}
      {/* Un velo abajo para que el pie se lea siempre. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(13,13,15,0.55))]" />
    </span>
  );

  return (
    <TarjetaInclinada className="h-full">
      <button
        ref={botonRef}
        type="button"
        onClick={onAbrir}
        onPointerEnter={despertar}
        onFocus={despertar}
        aria-haspopup="dialog"
        aria-label={`${WEBS.vitrina.entrar}: ${proyecto.nombre}, ${TIPOS[proyecto.tipo].singular.toLowerCase()} · ${proyecto.rubro}`}
        data-cursor-texto={WEBS.vitrina.entrar}
        data-al-frente={alFrente ? "si" : "no"}
        className="ficha-web group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-profundo bg-negro text-left transition-colors duration-(--duracion-rapida) hover:border-[var(--acento)] focus-visible:border-[var(--acento)] data-[al-frente=si]:border-[var(--acento)]"
      >
        {/* El brillo del color del proyecto, donde está el puntero. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-(--duracion-rapida)"
          style={{
            opacity: "var(--cerca, 0)",
            background:
              "radial-gradient(380px circle at var(--puntero-x, 50%) var(--puntero-y, 50%), color-mix(in srgb, var(--acento) 16%, transparent), transparent 65%)",
          }}
        />

        {/* La barra del navegador. */}
        <span className="relative flex items-center gap-3 border-b border-profundo px-3.5 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-1.5 bg-[var(--acento)]" />
            <span className="size-1.5 bg-profundo" />
            <span className="size-1.5 bg-profundo" />
          </span>
          <span className="min-w-0 flex-1 truncate text-center font-plex text-xs text-acero">
            {direccionCorta(vista.url)}
          </span>
          <span className="font-plex text-xs text-acero">{dosDigitos(numero)}</span>
        </span>

        {visorAbierto ? (
          pantalla
        ) : (
          <ViewTransition name={`pantalla-${proyecto.id}`} share="morph-web" default="none">
            {pantalla}
          </ViewTransition>
        )}

        {/* El pie: nombre, rubro y tipo. Lo demás está en el visor. */}
        <span className="relative flex flex-1 items-end justify-between gap-4 px-4 pb-4 pt-3.5 md:px-5 md:pb-5">
          <span className="min-w-0">
            <span className="block truncate titulo text-base text-blanco md:text-lg">
              {proyecto.nombre}
            </span>
            <span className="mt-1 flex items-center gap-2 font-plex text-xs text-acero">
              <span
                aria-hidden
                className={`size-1.5 shrink-0 bg-[var(--acento)] ${
                  proyecto.estado === "En línea" ? "motion-safe:animate-[parpadeo_2.9s_ease-in-out_infinite]" : ""
                }`}
              />
              <span className="truncate">
                {proyecto.rubro} · {proyecto.estado}
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-2xl bg-profundo/35 px-2 py-1 font-lectura text-sm font-medium text-acero transition-colors group-hover:border-[var(--acento)] group-hover:text-blanco">
            {TIPOS[proyecto.tipo].singular}
          </span>
        </span>
      </button>
    </TarjetaInclinada>
  );
}
