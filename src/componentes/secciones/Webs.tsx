import Link from "next/link";
import { TelefonoCasoDiferido } from "@/componentes/3d/TelefonoCasoDiferido";
import { CASOS, CASO_PROXIMO, type CasoWeb } from "@/datos/casos";
import { Foto } from "@/componentes/estructura/Foto";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { WEBS } from "@/datos/textos";
import { DeslizadorAntesDespues } from "./DeslizadorAntesDespues";

function EnlaceExterno({ url, texto, medir, nicho }: { url: string; texto: string; medir?: "demo" | "contacto"; nicho?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-medir={medir}
      data-nicho={nicho}
      className="group inline-flex items-center gap-3 rounded-2xl bg-profundo/35 px-5 py-3 font-lectura text-sm font-medium text-blanco transition-colors hover:border-acero"
    >
      <span
        aria-hidden
        className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
      />
      {texto} ↗
    </a>
  );
}

function Momento({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="flex items-center gap-3 font-lectura text-sm font-medium text-acero">
        <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
        {titulo}
      </p>
      <p className="mt-3 max-w-2xl font-lectura text-[15px] leading-relaxed text-blanco md:text-base">{texto}</p>
    </div>
  );
}

function Caso({ caso }: { caso: CasoWeb }) {
  return (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <span className="border border-acero px-2.5 py-1 font-lectura text-sm font-medium text-blanco">
          {caso.etiqueta}
        </span>
        <span className="font-lectura text-sm text-acero">
          {caso.cliente}
        </span>
      </div>
      <h3 className="mt-5 max-w-3xl titulo text-xl leading-snug text-blanco md:text-2xl">
        {caso.titulo}
      </h3>
      {/* La historia en tres momentos: quiénes son, lo que vimos y lo que propusimos (el deslizador). */}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Momento titulo={WEBS.historia.quienes} texto={caso.historia.quienes} />
        <Momento titulo={WEBS.historia.vimos} texto={caso.historia.vimos} />
      </div>
      {/* Las fotos del local, solo con permiso de Ferremix (src/datos/fotos.ts). */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Foto id="ferremix-local" sizes="(min-width: 640px) 50vw, 100vw" proporcion="aspect-[4/3]" />
        <Foto id="ferremix-mostrador" sizes="(min-width: 640px) 50vw, 100vw" proporcion="aspect-[4/3]" />
      </div>
      <div className="mt-10">
        <Momento titulo={WEBS.historia.propusimos} texto={caso.historia.propusimos} />
      </div>

      <div className="mt-6">
        <DeslizadorAntesDespues
          antes={caso.escritorio.antes}
          despues={caso.escritorio.despues}
          etiquetaAntes={WEBS.etiquetaAntes}
          etiquetaDespues={WEBS.etiquetaDespues}
          ayuda={WEBS.ayudaDeslizador}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TelefonoCasoDiferido caso={caso} />

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-profundo/35 p-7 md:p-8">
            <p className="font-lectura text-sm font-medium text-acero">
              {WEBS.etiquetaQueCambio}
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {caso.puntos.map((punto) => (
                <li key={punto} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 bg-blanco" />
                  <span className="font-plex text-sm leading-snug text-blanco">{punto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-profundo">
            <p className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
              <span aria-hidden className="size-1.5 bg-acero" />
              <span className="font-lectura text-sm font-medium text-acero">
                {WEBS.etiquetaDemo}
              </span>
            </p>
            {caso.demo.embebible ? (
              <div className="aspect-[16/10]">
                <iframe
                  src={caso.enlaces.demo.url}
                  title={caso.demo.titulo}
                  loading="lazy"
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-center gap-4 p-7 md:p-8">
                <p className="titulo text-base text-blanco">{caso.demo.titulo}</p>
                <p className="font-lectura text-[15px] leading-relaxed text-blanco">{caso.demo.nota}</p>
                <div className="mt-2">
                  <EnlaceExterno url={caso.enlaces.demo.url} texto={caso.enlaces.demo.texto} medir="demo" nicho="industria" />
                </div>
              </div>
            )}
          </div>

          <div>
            <EnlaceExterno url={caso.enlaces.propuesta.url} texto={caso.enlaces.propuesta.texto} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** El capítulo "Un caso de cerca" del canal Trabajos: la propuesta de
 *  Ferremix (deslizador, teléfono 3D y la demo paso a paso) y el lugar
 *  reservado para el próximo caso. */
export function CasoFerremix() {
  return (
    <>
      {CASOS.map((caso) => (
        <Caso key={caso.id} caso={caso} />
      ))}

      {/* El hueco honesto para el caso que viene. */}
      <div className="mt-16">
        <TarjetaViva
          className="border border-dashed border-profundo p-10 text-center md:p-14"
          data-revelar
        >
          <p className="titulo text-xl text-blanco md:text-2xl">{CASO_PROXIMO.titulo}</p>
          <p className="mt-3 font-lectura text-sm text-acero md:text-base">{CASO_PROXIMO.texto}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href={CASO_PROXIMO.accion.destino}
              transitionTypes={["canal-adelante"]}
              className="rounded-full inline-flex h-11 items-center justify-center bg-blanco px-6 font-lectura text-sm font-medium text-negro transition-colors hover:bg-acero"
            >
              {CASO_PROXIMO.accion.texto}
            </Link>
          </div>
        </TarjetaViva>
      </div>
    </>
  );
}
