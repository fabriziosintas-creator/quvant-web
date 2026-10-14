"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { CasoWeb } from "@/datos/casos";
import { WEBS } from "@/datos/textos";
import { useVista } from "@/estado/vista";

const TelefonoCaso = dynamic(() => import("./TelefonoCaso"), { ssr: false });

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

/** La ventana del teléfono: 3D en vista 3D, dos capturas en vista texto.
 *  Las dos variantes comparten el mismo marco 4:5 para que nada salte al
 *  decidirse la vista (CLS, estudio 9.5). */
export function TelefonoCasoDiferido({ caso }: { caso: CasoWeb }) {
  const vista = useVista();

  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[8px] border border-profundo">
      <figcaption className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
          {WEBS.etiquetaCelular}
        </span>
      </figcaption>
      {vista === "3d" ? (
        <div className="relative aspect-[4/5] flex-1" aria-hidden>
          <TelefonoCaso srcAntes={caso.celular.antes.src} srcDespues={caso.celular.despues.src} />
        </div>
      ) : (
        <div className="grid aspect-[4/5] flex-1 grid-cols-2 content-center gap-4 p-6">
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
