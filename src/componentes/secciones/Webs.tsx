import Link from "next/link";
import { TelefonoCasoDiferido } from "@/componentes/3d/TelefonoCasoDiferido";
import { CASOS, CASO_PROXIMO, type CasoWeb } from "@/datos/casos";
import { TarjetaViva } from "@/componentes/estructura/TarjetaViva";
import { WEBS } from "@/datos/textos";
import { DeslizadorAntesDespues } from "./DeslizadorAntesDespues";

function EnlaceExterno({ url, texto }: { url: string; texto: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 border border-profundo px-5 py-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco transition-colors hover:border-acero"
    >
      <span
        aria-hidden
        className="inline-block size-1 bg-profundo transition-colors group-hover:bg-blanco"
      />
      {texto} ↗
    </a>
  );
}

function Caso({ caso }: { caso: CasoWeb }) {
  return (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <span className="border border-acero px-2.5 py-1 font-plex text-[10px] font-medium uppercase tracking-etiqueta text-blanco">
          {caso.etiqueta}
        </span>
        <span className="font-plex text-xs uppercase tracking-etiqueta text-acero">
          {caso.cliente}
        </span>
      </div>
      <h3 className="mt-5 max-w-3xl font-plex text-xl font-bold leading-snug text-blanco md:text-2xl">
        {caso.titulo}
      </h3>
      <p className="mt-3 max-w-2xl font-lectura text-[15px] leading-relaxed text-acero">
        {caso.descripcionCliente}
      </p>

      <div className="mt-8">
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
          <div className="border border-profundo p-7 md:p-8">
            <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
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

          <div className="flex flex-1 flex-col overflow-hidden rounded-[8px] border border-profundo">
            <p className="flex items-center gap-3 border-b border-profundo px-4 py-2.5">
              <span aria-hidden className="size-1.5 bg-acero" />
              <span className="font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero">
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
                <p className="font-plex text-base font-bold text-blanco">{caso.demo.titulo}</p>
                <p className="font-lectura text-[15px] leading-relaxed text-acero">{caso.demo.nota}</p>
                <div className="mt-2">
                  <EnlaceExterno url={caso.enlaces.demo.url} texto={caso.enlaces.demo.texto} />
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
          <p className="font-michroma text-lg uppercase tracking-marca text-blanco md:text-xl">
            {CASO_PROXIMO.titulo}
          </p>
          <p className="mt-3 font-lectura text-sm text-acero md:text-base">{CASO_PROXIMO.texto}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href={CASO_PROXIMO.accion.destino}
              transitionTypes={["canal-adelante"]}
              className="inline-flex h-11 items-center justify-center bg-blanco px-6 font-plex text-[12px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
            >
              {CASO_PROXIMO.accion.texto}
            </Link>
          </div>
        </TarjetaViva>
      </div>
    </>
  );
}
