import type { ReactNode } from "react";
import { PLATAFORMAS } from "@/datos/textos";
import { SelectorRubros } from "./SelectorRubros";

/**
 * Maquetas simuladas de pantallas del sistema, dibujadas en HTML puro
 * (nada de capturas pesadas ni imágenes de stock). Son decorativas: la
 * frase real de cada función va al lado, en texto.
 */

function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
        {etiqueta}
      </span>
      <span className="font-plex text-[11px] text-blanco">{valor}</span>
    </div>
  );
}

function MaquetaMargen() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <FilaDato etiqueta="Costo" valor="$ 1.240" />
      <FilaDato etiqueta="Venta" valor="$ 1.890" />
      <div className="mt-1 flex items-center gap-3">
        <div className="flex h-1 flex-1">
          <span className="w-[34%] bg-blanco" />
          <span className="flex-1 bg-profundo" />
        </div>
        <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
          Margen 34%
        </span>
      </div>
    </div>
  );
}

function MaquetaOffline() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="flex items-center gap-2">
        <span className="size-1.5 bg-acero" />
        <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
          Sin conexión
        </span>
      </div>
      <div className="border border-profundo px-3 py-2">
        <FilaDato etiqueta="Venta #0482" valor="$ 23.600" />
      </div>
      <p className="font-plex text-[10px] uppercase tracking-etiqueta text-blanco">Guardada</p>
    </div>
  );
}

function MaquetaTablero() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <p className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">
        Para atender hoy
      </p>
      {["Presupuesto #112", "Entrega · Ruta 2", "Servicio técnico #31"].map((item) => (
        <div key={item} className="flex items-center gap-2.5">
          <span className="size-1 bg-blanco" />
          <span className="font-plex text-[11px] text-blanco">{item}</span>
        </div>
      ))}
    </div>
  );
}

function MaquetaStock() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <FilaDato etiqueta="Casa central" valor="128 u." />
      <FilaDato etiqueta="Depósito norte" valor="309 u." />
      <div className="mt-1 border-t border-profundo pt-2.5">
        <FilaDato etiqueta="Conteo con cámara" valor="Listo" />
      </div>
    </div>
  );
}

function MaquetaCompras() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="border border-profundo px-3 py-2">
        <FilaDato etiqueta="Tornillo M8" valor="Quedan 6" />
      </div>
      <FilaDato etiqueta="Stock mínimo" valor="20 u." />
      <p className="font-plex text-[10px] uppercase tracking-etiqueta text-blanco">
        Sugerido: comprar 24 u.
      </p>
    </div>
  );
}

const MAQUETAS: Record<string, ReactNode> = {
  margen: <MaquetaMargen />,
  offline: <MaquetaOffline />,
  tablero: <MaquetaTablero />,
  stock: <MaquetaStock />,
  compras: <MaquetaCompras />,
};

/** La "ventana" del estudio: borde profundo, esquinas de 8 px, como una pantalla. */
function Ventana({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-[8px] border border-profundo">
      <div className="flex items-center gap-3 border-b border-profundo px-4 py-2">
        <span className="size-1.5 bg-acero" />
        <span className="truncate font-plex text-[10px] font-medium uppercase tracking-etiqueta text-acero">
          {titulo}
        </span>
      </div>
      <div className="h-32 px-4 py-3">{children}</div>
    </div>
  );
}

/** Sección 03 · Plataformas: el núcleo, lo que hace hoy, los rubros con
 *  sus productos (Yunque, Forja, HackFit y los que vienen) y las
 *  integraciones que todavía no están, dichas como lo que son. */
export function Plataformas() {
  return (
    <section id="plataformas" className="border-t border-profundo">
      <div className="contenedor py-24 md:py-32">
        <p className="font-michroma text-xs uppercase tracking-etiqueta text-acero">
          {PLATAFORMAS.numero} · {PLATAFORMAS.etiqueta}
        </p>
        <h2 className="mt-6 max-w-3xl font-plex text-3xl font-bold leading-tight text-blanco md:text-5xl">
          {PLATAFORMAS.titulo}
        </h2>
        <p className="mt-6 max-w-2xl font-plex text-sm leading-relaxed text-acero md:text-base">
          {PLATAFORMAS.bajada}
        </p>

        {/* El núcleo común */}
        <div className="mt-12 md:mt-16">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.nucleo.etiqueta}
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {PLATAFORMAS.nucleo.modulos.map((modulo) => (
              <li
                key={modulo}
                className="flex items-center gap-2.5 border border-profundo px-4 py-2.5 font-plex text-xs font-medium uppercase tracking-etiqueta text-blanco"
              >
                <span aria-hidden className="size-1 bg-acero" />
                {modulo}
              </li>
            ))}
          </ul>
        </div>

        {/* Lo que hace hoy */}
        <div className="mt-20 md:mt-28">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.hoy.etiqueta}
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {PLATAFORMAS.hoy.destacadas.map((funcion) => (
              <article key={funcion.id}>
                <Ventana titulo={funcion.titulo}>{MAQUETAS[funcion.id]}</Ventana>
                <h3 className="mt-4 font-plex text-base font-bold text-blanco">
                  {funcion.titulo}
                </h3>
                <p className="mt-1.5 font-plex text-sm leading-relaxed text-acero">
                  {funcion.texto}
                </p>
              </article>
            ))}
            <article className="border border-profundo p-6 md:p-7">
              <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
                {PLATAFORMAS.hoy.etiquetaResto}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {PLATAFORMAS.hoy.resto.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 bg-profundo" />
                    <span className="font-plex text-sm leading-snug text-acero">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        {/* Rubros y productos */}
        <div className="mt-20 md:mt-28">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.rubros.etiqueta}
          </p>
          <SelectorRubros />
        </div>

        {/* Integraciones en camino: lo que todavía no está, dicho como tal. */}
        <div className="mt-20 border border-profundo p-7 md:mt-28 md:p-9">
          <p className="font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
            {PLATAFORMAS.integraciones.etiqueta}
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {PLATAFORMAS.integraciones.items.map((item) => (
              <li
                key={item}
                className="border border-profundo px-4 py-2.5 font-plex text-xs uppercase tracking-etiqueta text-acero"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 font-plex text-sm text-acero">{PLATAFORMAS.integraciones.nota}</p>
        </div>
      </div>
    </section>
  );
}
