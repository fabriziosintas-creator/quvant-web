import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FUNCIONES_CLAVE } from "../../../../../medicion-sistema/catalogo";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { Embudo, MapaCalorAdopcion, MiniLinea } from "@/componentes/panel/nucleos/Graficos";
import { CartelEjemplo, Filtros, IndicadorGrande, ListaOrdenada, Numero, Semaforo, Tendencia, Vista } from "@/componentes/panel/nucleos/comunes";
import { Ciudad } from "@/componentes/panel/nucleos/tresd/Ciudad";
import { PANEL_ADMIN } from "@/datos/textos";
import { contarPasos, ordenarClientes, promedio, resumenNucleo, type OrdenRanking } from "@/nucleos/agregados";
import { analizarNucleo } from "@/servidor/nucleos/claude";
import { cargarPanorama, filtrosEnUrl, leerFiltrosNucleos } from "@/servidor/nucleos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.nucleos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const ORDENES: OrdenRanking[] = ["salud", "adopcion", "tendencia", "crecimiento"];

/** B.4.2 · Un núcleo: sus clientes, quién aprovecha el sistema y quién no. */
export default function PaginaNucleo({ params, searchParams }: PageProps<"/panel/nucleos/[nucleo]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params, searchParams }: { params: PageProps<"/panel/nucleos/[nucleo]">["params"]; searchParams: PageProps<"/panel/nucleos/[nucleo]">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/nucleos");
  const [{ nucleo: idNucleo }, parametros] = await Promise.all([params, searchParams]);
  const filtros = leerFiltrosNucleos(parametros);
  const p = await cargarPanorama(supabase, filtros);
  const nucleo = p.nucleos.find((n) => n.id === idNucleo);
  if (!nucleo) notFound();
  const sufijo = filtrosEnUrl(p.filtros);
  const ordenCrudo = Array.isArray(parametros.orden) ? parametros.orden[0] : parametros.orden;
  const orden: OrdenRanking = ORDENES.includes(ordenCrudo as OrdenRanking) ? (ordenCrudo as OrdenRanking) : "salud";
  const N = T.nucleo;

  const propios = p.clientes.filter((c) => c.nucleoId === nucleo.id);
  const resto = p.clientes.filter((c) => c.nucleoId !== nucleo.id);
  const r = resumenNucleo(nucleo, p.clientes);
  const saludResto = promedio(resto.map((c) => c.indicadores?.salud).filter((s): s is number => typeof s === "number"));
  const adopcionResto = promedio(resto.map((c) => c.indicadores?.adopcion).filter((a): a is number => typeof a === "number").map((a) => a * 100));
  const funciones = nucleo.plantilla ? FUNCIONES_CLAVE[nucleo.plantilla] : [];
  const ordenados = ordenarClientes(propios, orden);
  const analisis = nucleo.estado === "activo" && propios.length > 0 ? await analizarNucleo(nucleo, propios.map((c) => ({ nombre: c.nombre, indicadores: c.indicadores }))) : null;

  const href = (c: { id: string }) => `/panel/nucleos/${nucleo.id}/${c.id}${sufijo}`;

  const ranking = (
    <ListaOrdenada
      items={ordenados.map((c, i) => ({
        id: c.id,
        contenido: (
        <article className="grid gap-3 border border-profundo p-4 md:grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto_auto] md:items-center">
          <span className="font-plex text-xs tabular-nums text-acero">{i + 1}</span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link href={href(c)} className="truncate font-lectura text-[15px] font-semibold text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">{c.nombre}</Link>
            <p className="flex flex-wrap gap-1.5">
              {(c.indicadores?.funcionesClave ?? []).filter((f) => f.estado !== "usada").map((f) => (
                <span key={f.id} className={`border px-1.5 py-0.5 font-plex text-[10px] uppercase tracking-etiqueta ${f.estado === "dejo_de_usar" ? "border-blanco text-blanco" : "border-profundo text-acero"}`}>{f.nombre}</span>
              ))}
            </p>
          </div>
          <Semaforo valor={c.indicadores?.semaforo ?? "arranque"} />
          <span className="font-plex text-xs tabular-nums text-blanco">{c.indicadores ? `${Math.round(c.indicadores.adopcion * 100)} %` : "—"} <span className="text-acero">{N.ordenes.adopcion.toLowerCase()}</span></span>
          {c.indicadores ? <Tendencia valor={c.indicadores.tendencia} /> : <span />}
          <MiniLinea valores={(c.indicadores?.semanas ?? []).map((s) => s.acciones)} />
        </article>
        ),
      }))}
    />
  );

  return (
    <Vista nivel={1}>
      <div className="flex flex-col gap-3">
        <Link href={`/panel/nucleos${sufijo}`} className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">← {N.volver}</Link>
        <TituloPanel titulo={nucleo.nombre} bajada={T.medidoPorUso} />
      </div>
      {p.modoEjemplo ? <CartelEjemplo motivo={p.motivoEjemplo} /> : null}
      <Filtros base={`/panel/nucleos/${nucleo.id}`} filtros={p.filtros} />

      {nucleo.estado === "proximamente" ? (
        <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.general.proximamenteNota}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <IndicadorGrande etiqueta={T.general.tiles.clientes} valor={<Numero valor={r.clientes} />} />
            <IndicadorGrande etiqueta={T.general.tiles.acciones} valor={<Numero valor={r.acciones} />} />
            <IndicadorGrande etiqueta={T.general.tiles.salud} valor={r.salud === null ? "—" : <Numero valor={r.salud} />} detalle={saludResto !== null ? `${N.comparacion}: ${saludResto}` : undefined} />
            <IndicadorGrande etiqueta={N.ordenes.adopcion} valor={r.adopcion === null ? "—" : <><Numero valor={r.adopcion} /> %</>} detalle={adopcionResto !== null ? `${N.comparacion}: ${adopcionResto} %` : undefined} />
          </div>

          {analisis ? (
            <section className="flex flex-col gap-3 border border-profundo p-4 md:p-6">
              <h2 className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco"><span aria-hidden className="size-1.5 bg-blanco" />{N.quePasa}</h2>
              <p className="font-lectura text-[15px] leading-relaxed text-blanco">{analisis.resumen}</p>
              {analisis.patrones.length > 0 ? (
                <ul className="flex flex-col gap-1 font-lectura text-sm text-acero">{analisis.patrones.map((x, i) => <li key={i} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 shrink-0 bg-acero" />{x}</li>)}</ul>
              ) : null}
              <p className="font-plex text-[11px] text-acero">{T.claude.modelo}: {analisis.modelo}{analisis.ejemplo ? ` · ${T.claude.ejemplo}` : ""}</p>
            </section>
          ) : null}

          {propios.length === 0 ? (
            <p className="border border-profundo p-6 font-lectura text-sm text-acero">{N.sinClientes}</p>
          ) : (
            <>
              <Ciudad
                titulo={N.ciudad}
                nota={N.ciudadNota}
                lista={<div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={N.ordenar}>
                    <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{N.ordenar}</span>
                    {ORDENES.map((o) => (
                      <Link key={o} href={`/panel/nucleos/${nucleo.id}${sufijo ? `${sufijo}&` : "?"}orden=${o}`} aria-current={orden === o ? "true" : undefined} className={`inline-flex h-9 items-center border px-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta ${orden === o ? "border-blanco text-blanco" : "border-profundo text-acero hover:text-blanco"}`}>
                        {N.ordenes[o]}
                      </Link>
                    ))}
                  </div>
                  {ranking}
                </div>}
                edificios={ordenados.map((c) => ({ id: c.id, nombre: c.nombre, actividad: c.indicadores?.semanas[c.indicadores.semanas.length - 1]?.acciones ?? 0, sucursales: c.sucursalesContratadas, semaforo: c.indicadores?.semaforo ?? "arranque", href: href(c) }))}
              />

              {funciones.length > 0 ? (
                <Bloque titulo={N.mapaCalor} nota={N.mapaCalorNota}>
                  <MapaCalorAdopcion
                    funciones={funciones.map((f) => ({ id: f.id, nombre: f.nombre }))}
                    filas={ordenados.map((c) => ({ id: c.id, nombre: c.nombre, href: href(c), estados: Object.fromEntries((c.indicadores?.funcionesClave ?? []).map((f) => [f.id, f.estado])) }))}
                  />
                </Bloque>
              ) : null}

              <Bloque titulo={N.embudo}>
                <Embudo cuentas={contarPasos(propios)} total={propios.length} />
              </Bloque>
            </>
          )}
        </>
      )}
    </Vista>
  );
}
