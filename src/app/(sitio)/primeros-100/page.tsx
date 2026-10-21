import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { Contador } from "@/componentes/promo/Contador";
import { DemoAumento, DemoSinInternet, DemoStock } from "@/componentes/promo/Demos";
import { ACENTO_CANAL } from "@/datos/colores";
import { PROMO, PROMO_TEXTOS as T } from "@/datos/promo";

export const metadata: Metadata = {
  title: `${T.metaTitulo} | Quvant`,
  // Ejemplo: no se indexa hasta que la promo esté lista para publicarse.
  robots: { index: false, follow: false },
};

/**
 * La página de la promo "Primeros 100" (docs/promo-primeros-100.md):
 * qué es y cuántos lugares quedan, las tres situaciones para tocar, los
 * dos beneficios, cómo funciona, las bases y el cierre.
 *
 * EJEMPLO: el contador usa un número de muestra (PROMO.EJEMPLO_DADOS).
 */
export default function PrimerosCien() {
  const situaciones = [
    { id: "sin-internet", textos: T.situaciones.sinInternet, Demo: DemoSinInternet },
    { id: "aumento", textos: T.situaciones.aumento, Demo: DemoAumento },
    { id: "stock", textos: T.situaciones.stock, Demo: DemoStock },
  ];

  return (
    <div className="relative" style={{ "--acento": ACENTO_CANAL.contacto } as CSSProperties}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{ background: "radial-gradient(ellipse 55% 65% at 12% 0%, color-mix(in srgb, var(--acento) 16%, transparent), transparent 70%)" }}
      />

      {/* Qué es y cuántos lugares quedan. */}
      <header className="contenedor relative pb-16 pt-28 md:pb-24 md:pt-40">
        <p className="flex items-center gap-3 font-lectura text-sm font-medium text-acero">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          <span className="text-blanco">{T.etiqueta}</span>
        </p>
        <h1 className="mt-6 max-w-4xl titulo text-[clamp(2rem,6vw,4rem)] leading-[1.08] text-blanco">{T.titulo}</h1>
        <p className="mt-6 max-w-2xl font-lectura text-base leading-relaxed text-blanco md:text-lg">{T.bajada}</p>

        <div className="mt-12">
          <Contador dados={PROMO.EJEMPLO_DADOS} tope={PROMO.tope} ejemplo />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={PROMO.registro} className={CLASE_BOTON}>
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {T.botones.quiero}
          </Link>
          <a href="#como-funciona" className={CLASE_BOTON_SECUNDARIO}>
            {T.botones.comoFunciona}
          </a>
        </div>
      </header>

      {/* Las tres situaciones, para tocar. */}
      <Capitulo id="situaciones" etiqueta={T.situaciones.etiqueta}>
        <p className="max-w-2xl font-lectura text-base leading-relaxed text-blanco md:text-lg">{T.situaciones.bajada}</p>
        <div className="mt-10 grid gap-12 lg:grid-cols-3 lg:gap-6">
          {situaciones.map(({ id, textos, Demo }) => (
            <article key={id} className="flex flex-col gap-5">
              <div>
                <h3 className="titulo text-2xl text-blanco">{textos.titulo}</h3>
                <p className="mt-3 font-lectura text-[15px] leading-relaxed text-acero md:text-base">{textos.texto}</p>
              </div>
              <div className="flex-1">
                <Demo />
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 font-plex text-xs text-acero">{T.situaciones.nota}</p>
      </Capitulo>

      {/* Los dos beneficios. */}
      <Capitulo id="beneficios" etiqueta={T.beneficios.etiqueta}>
        <div className="grid gap-4 md:grid-cols-2">
          {[T.beneficios.web, T.beneficios.sistema].map((b) => (
            <article key={b.titulo} className="flex flex-col gap-5 rounded-2xl bg-profundo/35 p-6 md:p-8">
              <div>
                <h3 className="titulo text-2xl text-blanco md:text-3xl">{b.titulo}</h3>
                <p className="mt-2 font-lectura text-sm font-medium text-[var(--acento)]">{b.para}</p>
              </div>
              <p className="font-lectura text-base leading-relaxed text-blanco">{b.texto}</p>
              <div>
                <p className="font-lectura text-sm font-medium text-acero">{T.beneficios.incluyeTitulo}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {b.incluye.map((item) => (
                    <li key={item} className="flex items-center gap-3 font-lectura text-[15px] text-blanco">
                      <span aria-hidden className="size-1.5 shrink-0 bg-blanco" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-auto font-lectura text-sm leading-relaxed text-acero">
                {b.noIncluye} {b.condicion}
              </p>
            </article>
          ))}
        </div>
      </Capitulo>

      {/* Cómo funciona y las bases. */}
      <Capitulo id="como-funciona" etiqueta={T.comoFunciona.etiqueta}>
        <ol className="grid gap-8 md:grid-cols-3">
          {T.comoFunciona.pasos.map((paso) => (
            <li key={paso.titulo} className="flex flex-col gap-3">
              <span aria-hidden className="size-2.5 bg-[var(--acento)]" />
              <h3 className="titulo text-xl text-blanco">{paso.titulo}</h3>
              <p className="font-lectura text-[15px] leading-relaxed text-acero md:text-base">{paso.texto}</p>
            </li>
          ))}
        </ol>

        <details className="group mt-14 rounded-2xl bg-profundo/35 p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-lectura text-base font-medium text-blanco">
            {T.bases.titulo}
            <span aria-hidden className="text-acero transition-transform duration-(--duracion-rapida) group-open:rotate-45">
              +
            </span>
          </summary>
          <ul className="mt-5 flex flex-col gap-3">
            {T.bases.items.map((item) => (
              <li key={item.slice(0, 30)} className="flex gap-3 font-lectura text-sm leading-relaxed text-acero">
                <span aria-hidden className="mt-2 size-1 shrink-0 bg-acero" />
                {item}
              </li>
            ))}
          </ul>
        </details>
      </Capitulo>

      {/* El cierre. */}
      <section className="contenedor pb-28 pt-8 md:pb-40">
        <div className="flex flex-col items-start gap-6 rounded-2xl bg-profundo/35 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <p className="titulo text-3xl text-blanco md:text-4xl">{T.cierre.titulo}</p>
            <p className="mt-3 font-lectura text-base text-acero">{T.cierre.texto}</p>
          </div>
          <Link href={PROMO.registro} className={CLASE_BOTON}>
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {T.botones.quiero}
          </Link>
        </div>
      </section>
    </div>
  );
}
