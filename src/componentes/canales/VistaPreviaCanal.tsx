"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { IdCanal } from "@/datos/colores";
import { COLOR_RECORRIDO, OBJETIVO_VISUAL } from "@/datos/objetivo";
import { PROYECTOS } from "@/datos/portfolio";
import { OBJETIVO } from "@/datos/textos";

/**
 * Lo que se ve "en vivo" en el monitor de cada canal, en la portada. Son
 * vistas chicas hechas con material real del sitio (capturas del
 * portfolio, las fotos del recorrido, el tablero, el spot). Solo se mueven
 * cuando el canal está al frente (`vivo`); si no, quedan en su primer cuadro.
 */

/** Pasa por 0..cantidad-1 cada `ms` mientras esté vivo. */
function useCiclo(cantidad: number, ms: number, vivo: boolean) {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    if (!vivo) return;
    const intervalo = setInterval(() => setIndice((i) => (i + 1) % cantidad), ms);
    return () => clearInterval(intervalo);
  }, [cantidad, ms, vivo]);
  return indice;
}

const VITRINA = PROYECTOS.filter((p) => p.formato === "escritorio").slice(0, 4);

/** Quieta, alcanza con la imagen del cuadro actual: las demás se piden recién al moverse. */
const cargar = (vivo: boolean, i: number, indice: number) => vivo || i === indice;

function Trabajos({ vivo }: { vivo: boolean }) {
  const indice = useCiclo(VITRINA.length, 2200, vivo);
  const actual = VITRINA[indice];
  return (
    <>
      {VITRINA.map((proyecto, i) => cargar(vivo, i, indice) && (
        <Image
          key={proyecto.id}
          src={proyecto.vistas[0].portada.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className={`object-cover object-top transition-opacity duration-(--duracion-lenta) ${i === indice ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <span className="absolute bottom-0 right-[6%] block w-[20%] overflow-hidden rounded-[10px] border border-profundo bg-negro shadow-[0_18px_40px_-10px_rgba(0,0,0,0.9)] aspect-[600/1298] translate-y-[18%]">
        {VITRINA.map((proyecto, i) => cargar(vivo, i, indice) && (
          <Image
            key={proyecto.id}
            src={proyecto.vistas[0].portadaCelular.src}
            alt=""
            fill
            sizes="10vw"
            className={`object-cover object-top transition-opacity duration-(--duracion-lenta) ${i === indice ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </span>
      <Etiqueta color={actual.color}>{actual.nombre}</Etiqueta>
    </>
  );
}

function Servicios({ vivo }: { vivo: boolean }) {
  const etapas = OBJETIVO.etapas;
  const indice = useCiclo(etapas.length, 1900, vivo);
  return (
    <>
      {/* Igual que en el recorrido: blanco y negro, y un solo color. */}
      {etapas.map((etapa, i) => cargar(vivo, i, indice) && (
        <Image
          key={etapa.id}
          src={OBJETIVO_VISUAL[etapa.id].foto.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className={`foto-bn object-cover transition-opacity duration-(--duracion-lenta) ${i === indice ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {/* Las cuatro etapas en una línea, como en el recorrido. */}
      <span className="absolute inset-x-5 bottom-5 flex items-center">
        {etapas.map((etapa, i) => (
          <span key={etapa.id} className="flex flex-1 items-center last:flex-none">
            <span
              className="flex size-6 items-center justify-center rounded-full border bg-negro/80 font-plex text-xs transition-colors duration-(--duracion-media)"
              style={{
                borderColor: i <= indice ? COLOR_RECORRIDO : "#26262B",
                color: i <= indice ? COLOR_RECORRIDO : "#9C9CA3",
              }}
            >
              {i + 1}
            </span>
            {i < etapas.length - 1 ? (
              <span className="mx-1 h-px flex-1 bg-blanco/25">
                <span
                  className="block h-full origin-left transition-transform duration-(--duracion-lenta)"
                  style={{ transform: `scaleX(${i < indice ? 1 : 0})`, background: COLOR_RECORRIDO }}
                />
              </span>
            ) : null}
          </span>
        ))}
      </span>
      <Etiqueta color={COLOR_RECORRIDO}>{etapas[indice].nombre}</Etiqueta>
    </>
  );
}

function Plataformas({ vivo }: { vivo: boolean }) {
  return (
    <>
      <Image
        src="/sistema/tablero.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 40vw, 90vw"
        className={`object-cover object-left-top ${vivo ? "motion-safe:animate-[deriva_16s_var(--ease-vaiven)_infinite_alternate]" : ""}`}
      />
      <Etiqueta color="#4FD1C5">Funcionando hoy</Etiqueta>
    </>
  );
}

function Nosotros() {
  return (
    <>
      <Image src="/spot/spot-poster.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
      {/* El play va en una esquina: al centro tapaba la firma del póster. */}
      <span className="absolute bottom-5 right-5">
        <span className="flex items-center gap-3 border border-blanco/30 bg-negro/70 px-4 py-2.5 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco backdrop-blur-sm">
          <svg aria-hidden viewBox="0 0 12 12" className="size-2.5 fill-current">
            <path d="M3 1.5 10.5 6 3 10.5Z" />
          </svg>
          0:42
        </span>
      </span>
      <span className="absolute bottom-5 left-5 flex items-center gap-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco">
        <span aria-hidden className="size-1.5 bg-[#F0A33A]" />
        Michel + Fabrizio
      </span>
    </>
  );
}

const CHARLA = [
  { tuyo: true, texto: "Necesito un sistema para mis tres sucursales." },
  { tuyo: false, texto: "Contanos cómo lo hacen hoy." },
  { tuyo: true, texto: "Cada una con su Excel…" },
  { tuyo: false, texto: "Empezamos por un solo stock, en vivo." },
] as const;

function Contacto({ vivo }: { vivo: boolean }) {
  const visibles = useCiclo(CHARLA.length + 1, 1300, vivo);
  const mostrados = vivo ? visibles : CHARLA.length;
  return (
    <span className="absolute inset-0 flex flex-col justify-end gap-2 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(123,211,137,0.14),transparent_70%)] p-5">
      {CHARLA.slice(0, mostrados).map((mensaje, i) => (
        <span
          key={`${i}-${mensaje.texto}`}
          className={`charla-burbuja max-w-[78%] rounded-[10px] px-3 py-2 font-lectura text-xs leading-snug ${
            mensaje.tuyo
              ? "self-start rounded-bl-[2px] border border-profundo bg-negro text-blanco"
              : "self-end rounded-br-[2px] bg-[#7BD389] text-negro"
          }`}
        >
          {mensaje.texto}
        </span>
      ))}
    </span>
  );
}

function Etiqueta({ color, children }: { color: string; children: string }) {
  return (
    <span className="absolute left-4 top-4 flex items-center gap-2 bg-negro/75 px-2.5 py-1.5 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco backdrop-blur-sm">
      <span aria-hidden className="size-1.5" style={{ background: color }} />
      {children}
    </span>
  );
}

export function VistaPreviaCanal({ id, vivo }: { id: IdCanal; vivo: boolean }) {
  switch (id) {
    case "trabajos":
      return <Trabajos vivo={vivo} />;
    case "servicios":
      return <Servicios vivo={vivo} />;
    case "plataformas":
      return <Plataformas vivo={vivo} />;
    case "nosotros":
      return <Nosotros />;
    case "contacto":
      return <Contacto vivo={vivo} />;
  }
}
