"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import type { CasoWeb } from "@/datos/casos";
import { WEBS } from "@/datos/textos";

const TelefonoCaso = dynamic(() => import("./TelefonoCaso"), { ssr: false });

// Sin WebGL o con movimiento reducido, nada de teléfono que gira: las dos
// pantallas lado a lado, que es el mismo contenido sin el truco.
let decidido: boolean | null = null;
const conviene3d = (): boolean => {
  if (decidido !== null) return decidido;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      decidido = false;
      return decidido;
    }
    const lienzo = document.createElement("canvas");
    decidido = Boolean(lienzo.getContext("webgl2") || lienzo.getContext("webgl"));
  } catch {
    decidido = false;
  }
  return decidido;
};
const enServidor = () => false;
const suscribir = () => () => {};

function MarcoCelular({
  src,
  alt,
  etiqueta,
}: {
  src: string;
  alt: string;
  etiqueta: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[150px] rounded-[22px] border border-profundo bg-negro p-1.5">
        <Image
          src={src}
          alt={alt}
          width={390}
          height={844}
          sizes="150px"
          className="w-full rounded-[16px]"
        />
      </div>
      <figcaption className="font-plex text-[10px] font-medium uppercase tracking-etiqueta text-acero">
        {etiqueta}
      </figcaption>
    </figure>
  );
}

/** La ventana del teléfono: 3D cuando se puede, dos capturas cuando no. */
export function TelefonoCasoDiferido({ caso }: { caso: CasoWeb }) {
  const con3d = useSyncExternalStore(suscribir, conviene3d, enServidor);

  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[8px] border border-profundo">
      <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
          {WEBS.etiquetaCelular}
        </span>
      </figcaption>
      {con3d ? (
        <div className="relative aspect-[4/5] flex-1" aria-hidden>
          <TelefonoCaso srcAntes={caso.celular.antes.src} srcDespues={caso.celular.despues.src} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-6">
          <MarcoCelular
            src={caso.celular.antes.src}
            alt={caso.celular.antes.alt}
            etiqueta={WEBS.etiquetaAntes}
          />
          <MarcoCelular
            src={caso.celular.despues.src}
            alt={caso.celular.despues.alt}
            etiqueta={WEBS.etiquetaDespues}
          />
        </div>
      )}
      <p className="border-t border-profundo px-4 py-2.5 font-plex text-[11px] text-acero">
        {WEBS.notaCelular}
      </p>
    </figure>
  );
}
