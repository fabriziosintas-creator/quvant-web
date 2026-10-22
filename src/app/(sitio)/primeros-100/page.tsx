import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { Capitulo } from "@/componentes/canales/Capitulo";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO } from "@/componentes/cuenta/estilos";
import { BotonLugar } from "@/componentes/promo/BotonLugar";
import { Contador } from "@/componentes/promo/Contador";
import { GrillaSituaciones } from "@/componentes/promo/GrillaSituaciones";
import { InvitacionRegalo } from "@/componentes/promo/InvitacionRegalo";
import { MedirPromo } from "@/componentes/promo/MedirPromo";
import { IrAlVideo } from "@/componentes/promo/IrAlVideo";
import { VerEnVideo, VideoPromo } from "@/componentes/promo/VideoPromo";
import { DemoAumento, DemoSinInternet, DemoStock } from "@/componentes/promo/Demos";
import { ACENTO_CANAL, AURORA } from "@/datos/colores";
import { PROMO, PROMO_TEXTOS as T, VIDEO_PROMO } from "@/datos/promo";
import { obtenerEstadoPromo, promoAbierta } from "@/servidor/promo/estado";

/** Se indexa solo con la promo andando en la base (y con lugares). */
export async function generateMetadata(): Promise<Metadata> {
  const estado = await obtenerEstadoPromo();
  return {
    title: `${T.metaTitulo} | Quvant`,
    description: T.bajada,
    alternates: { canonical: PROMO.ruta },
    robots: promoAbierta(estado) ? undefined : { index: false, follow: false },
  };
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * La página de la promo "Primeros 100" (docs/promo-primeros-100.md):
 * qué es y cuántos lugares quedan, las tres situaciones para tocar, los
 * dos beneficios, cómo funciona, las bases y el cierre.
 *
 * Los números (lugares, tope, fecha) salen de la base, en caché un
 * minuto. Sin la promo en la base: en desarrollo, un contador de ejemplo
 * marcado como tal; en producción, sin números.
 */
export default async function PrimerosCien() {
  const estado = await obtenerEstadoPromo();
  const abierta = promoAbierta(estado);
  // Antes de abrirla desde el panel no tiene fecha de comienzo: "arranca muy pronto".
  const antes = Boolean(estado) && !estado?.desde;
  const cerrada = Boolean(estado?.desde) && !abierta;
  const ejemplo = !estado && process.env.NODE_ENV !== "production";
  const tope = estado?.tope ?? PROMO.tope;
  const fecha = (dia: string) => FECHA_LARGA.format(new Date(`${dia}T00:00:00Z`));
  const hasta = estado ? fecha(estado.hasta) : "31 de enero de 2027";
  const desde = estado?.desde ? fecha(estado.desde) : "[el día de lanzamiento]";
  const completar = (texto: string) => texto.replace("{tope}", String(tope)).replace("{hasta}", hasta).replace("{desde}", desde);
  const bases = T.bases.items.map(completar);
  const botonPrincipal = cerrada ? T.botones.espera : T.botones.quiero;

  // Cada situación con un color de la aurora (el mismo del fondo del sitio); la demostración de adentro lo hereda.
  const situaciones = [
    { id: "sin-internet" as const, textos: T.situaciones.sinInternet, Demo: DemoSinInternet, color: AURORA[0] },
    { id: "aumento" as const, textos: T.situaciones.aumento, Demo: DemoAumento, color: AURORA[2] },
    { id: "stock" as const, textos: T.situaciones.stock, Demo: DemoStock, color: AURORA[1] },
  ];

  return (
    <div className="relative" style={{ "--acento": ACENTO_CANAL.contacto } as CSSProperties}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{ background: "radial-gradient(ellipse 55% 65% at 12% 0%, color-mix(in srgb, var(--acento) 16%, transparent), transparent 70%)" }}
      />

      <MedirPromo />

      {/* Qué es y cuántos lugares quedan. */}
      <header className="contenedor relative pb-16 pt-28 md:pb-24 md:pt-40">
        <p className="flex items-center gap-3 font-lectura text-sm font-medium text-acero">
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          <span className="text-blanco">{T.etiqueta}</span>
        </p>
        <h1 className="mt-6 max-w-4xl titulo text-[clamp(2rem,6vw,4rem)] leading-[1.08] text-blanco">
          {antes ? T.antes.titulo : cerrada ? T.cerrada.titulo : T.titulo}
        </h1>
        <p className="mt-6 max-w-2xl font-lectura text-base leading-relaxed text-blanco md:text-lg">
          {antes ? T.antes.texto : cerrada ? T.cerrada.texto : T.bajada}
        </p>

        {(estado && !antes) || ejemplo ? (
          // El mismo nombre que el botón de la portada: la cápsula se convierte en el contador.
          <ViewTransition name="portal-promo" share="portal-promo" default="none">
            <div className="mt-12">
              <Contador dados={estado ? Math.min(estado.dados, tope) : PROMO.EJEMPLO_DADOS} tope={tope} ejemplo={ejemplo} />
              {/* La vigencia, a la vista (Ley 24.240, art. 7: fecha de comienzo y de fin). */}
              <p className="mt-4 font-lectura text-sm text-acero">{completar(T.contador.vigencia)}</p>
            </div>
          </ViewTransition>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          {antes ? (
            <Link href="/registro?origen=primeros-100" className={CLASE_BOTON}>
              <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
              {T.antes.boton}
            </Link>
          ) : (
            <BotonLugar className={CLASE_BOTON}>
              <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
              {botonPrincipal}
            </BotonLugar>
          )}
          <a href="#como-funciona" className={CLASE_BOTON_SECUNDARIO}>
            {T.botones.comoFunciona}
          </a>
        </div>
      </header>

      {/* El video, solo, justo debajo del contador (sin capítulos arriba), y la invitación a deslizar hasta él. */}
      {VIDEO_PROMO.archivo ? (
        <section className="contenedor relative pb-20 md:pb-28">
          <div className="max-w-4xl">
            <VideoPromo cta={{ texto: antes ? T.antes.boton : botonPrincipal, antes }} capitulos={false} />
          </div>
          <IrAlVideo />
        </section>
      ) : null}

      {/* Las tres situaciones, para tocar. */}
      <Capitulo id="situaciones" etiqueta={T.situaciones.etiqueta}>
        <p className="max-w-3xl titulo text-[clamp(1.75rem,4.2vw,3rem)] leading-[1.1] text-blanco">{T.situaciones.bajada}</p>
        <GrillaSituaciones>
          {situaciones.map(({ id, textos, Demo, color }, i) => (
            <article key={id} className="situacion" style={{ "--acento": color } as CSSProperties}>
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden className="situacion__numero font-michroma">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <VerEnVideo id={id} />
              </div>
              <div>
                <h3 className="titulo text-2xl leading-tight text-blanco md:text-[1.7rem]">{textos.titulo}</h3>
                <p className="mt-3 font-lectura text-[15px] leading-relaxed text-acero md:text-base">{textos.texto}</p>
              </div>
              {/* La demostración, encastrada abajo de la tarjeta y a todo su ancho (las tablas necesitan el lugar). */}
              <div className="situacion__demo -mx-5 -mb-5 flex-1 md:-mx-6 md:-mb-6">
                <Demo />
              </div>
            </article>
          ))}
        </GrillaSituaciones>
        <p className="mt-8 font-plex text-xs text-acero">{T.situaciones.nota}</p>
      </Capitulo>

      {/* La Q que gira y suelta su punto hacia lo que te regalamos. */}
      <InvitacionRegalo destino="beneficios" />

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
            {bases.map((item) => (
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
          <BotonLugar className={CLASE_BOTON}>
            <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
            {botonPrincipal}
          </BotonLugar>
        </div>
      </section>
    </div>
  );
}
