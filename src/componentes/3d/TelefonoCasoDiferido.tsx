"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
      <figcaption className="font-lectura text-sm text-acero">{etiqueta}</figcaption>
    </figure>
  );
}

/** La ventana del teléfono: 3D en vista 3D, dos capturas en vista texto.
 *  Las dos variantes comparten el mismo marco 4:5 para que nada salte al
 *  decidirse la vista (CLS, estudio 9.5).
 *
 *  El 3D se arma recién cuando la ventana se acerca a la pantalla (no
 *  carga three.js ni las texturas al abrir la página) y dibuja solo
 *  mientras se ve. */
export function TelefonoCasoDiferido({ caso }: { caso: CasoWeb }) {
  const vista = useVista();
  const marco = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [aLaVista, setALaVista] = useState(false);

  useEffect(() => {
    const elemento = marco.current;
    if (!elemento) return;
    const llegando = new IntersectionObserver(([e]) => e.isIntersecting && setCerca(true), {
      rootMargin: "600px 0px",
    });
    const viendo = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting));
    llegando.observe(elemento);
    viendo.observe(elemento);
    return () => {
      llegando.disconnect();
      viendo.disconnect();
    };
  }, [vista]);

  return (
    <figure className="pantalla flex h-full flex-col overflow-hidden">
      <figcaption className="flex items-center gap-3 px-4 py-2.5">
        <span aria-hidden className="size-1.5 bg-acero" />
        <span className="font-lectura text-sm font-medium text-acero">{WEBS.etiquetaCelular}</span>
      </figcaption>
      {vista === "3d" ? (
        <div ref={marco} className="relative aspect-[4/5] flex-1" aria-hidden>
          {cerca ? (
            <TelefonoCaso srcAntes={caso.celular.antes.src} srcDespues={caso.celular.despues.src} activo={aLaVista} />
          ) : null}
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
      <p className="border-t border-profundo px-4 py-2.5 font-plex text-xs text-acero">
        {WEBS.notaCelular}
      </p>
    </figure>
  );
}
