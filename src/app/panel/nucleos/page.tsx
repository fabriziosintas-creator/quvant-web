import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { numero } from "@/componentes/panel/formato";
import { LineasActividad } from "@/componentes/panel/nucleos/Graficos";
import { AccionesAlerta, BotonActualizar } from "@/componentes/panel/nucleos/Interactivos";
import { CartelEjemplo, Filtros, IndicadorGrande, Numero, Semaforo, Vista } from "@/componentes/panel/nucleos/comunes";
import { Constelacion } from "@/componentes/panel/nucleos/tresd/Constelacion";
import { PANEL_ADMIN } from "@/datos/textos";
import { alertasOrdenadas, resumenNucleo, semanasDelPanorama, serieDe, tilesGenerales } from "@/nucleos/agregados";
import { cargarPanorama, filtrosEnUrl, leerFiltrosNucleos } from "@/servidor/nucleos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.nucleos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** B.4.1 · Todo Quvant: cómo se usa el sistema en total, núcleo por núcleo. */
export default function Nucleos({ searchParams }: PageProps<"/panel/nucleos">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/nucleos">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/nucleos");
  const filtros = leerFiltrosNucleos(await searchParams);
  const p = await cargarPanorama(supabase, filtros);
  const sufijo = filtrosEnUrl(p.filtros);
  const tiles = tilesGenerales(p.clientes);
  const semanas = semanasDelPanorama(p.clientes);
  const resumenes = p.nucleos.map((n) => resumenNucleo(n, p.clientes));
  const activos = resumenes.filter((r) => r.nucleo.estado === "activo");
  const alertas = alertasOrdenadas(p.clientes);
  const G = T.general;

  const lista = (
    <ul className="grid gap-3 sm:grid-cols-2">
      {resumenes.map((r) => (
        <li key={r.nucleo.id} className="flex flex-col gap-3 border border-profundo p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-michroma text-sm uppercase tracking-marca text-blanco">{r.nucleo.nombre}</h3>
            {r.nucleo.estado === "proximamente" ? <span className="border border-profundo px-2 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{G.proximamente}</span> : null}
          </div>
          {r.nucleo.estado === "proximamente" ? (
            <p className="font-lectura text-sm text-acero">{G.proximamenteNota}</p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3 font-plex text-xs">
                <div><dt className="text-[10px] uppercase tracking-etiqueta text-acero">{G.tiles.clientes}</dt><dd className="text-base tabular-nums text-blanco">{r.clientes}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-etiqueta text-acero">{G.tiles.acciones}</dt><dd className="text-base tabular-nums text-blanco">{numero(r.acciones)}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-etiqueta text-acero">{G.tiles.salud}</dt><dd className="text-base tabular-nums text-blanco">{r.salud ?? "—"}</dd></div>
              </dl>
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {(["verde", "amarillo", "rojo", "arranque"] as const).map((s) => (r.semaforos[s] ? <span key={s} className="flex items-center gap-1.5 font-plex text-xs text-acero"><Semaforo valor={s} conTexto={false} tamano="sm" />{r.semaforos[s]} {T.semaforo[s].toLowerCase()}</span> : null))}
              </p>
              <Link href={`/panel/nucleos/${r.nucleo.id}${sufijo}`} className="inline-flex h-9 w-fit items-center gap-2 border border-profundo px-3 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-blanco hover:border-acero">
                {G.verNucleo} →
              </Link>
            </>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <Vista nivel={0}>
      {p.modoEjemplo ? <CartelEjemplo motivo={p.motivoEjemplo} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Filtros base="/panel/nucleos" filtros={p.filtros} />
        <BotonActualizar />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <IndicadorGrande etiqueta={G.tiles.clientes} valor={<Numero valor={tiles.clientes} />} />
        <IndicadorGrande etiqueta={G.tiles.usuarios} valor={<Numero valor={tiles.usuarios} />} />
        <IndicadorGrande etiqueta={G.tiles.acciones} valor={<Numero valor={tiles.acciones} />} />
        <IndicadorGrande etiqueta={G.tiles.salud} valor={tiles.salud === null ? "—" : <Numero valor={tiles.salud} />} detalle={T.medidoPorUso} />
        <IndicadorGrande etiqueta={G.tiles.alertas} valor={<Numero valor={tiles.alertas} />} />
      </div>

      <Constelacion
        titulo={G.constelacion}
        nota={G.constelacionNota}
        lista={lista}
        nodos={resumenes.map((r) => ({ id: r.nucleo.id, nombre: r.nucleo.nombre, clientes: r.clientes, actividad: r.actividad, salud: r.salud, proximamente: r.nucleo.estado === "proximamente", href: `/panel/nucleos/${r.nucleo.id}${sufijo}` }))}
      />

      <Bloque titulo={G.actividad}>
        {semanas.length === 0 ? (
          <p className="font-plex text-sm text-acero">{T.nucleo.sinClientes}</p>
        ) : (
          <LineasActividad
            semanas={semanas}
            series={activos.map((r) => ({ id: r.nucleo.id, nombre: r.nucleo.nombre, valores: serieDe(p.clientes.filter((c) => c.nucleoId === r.nucleo.id), semanas) }))}
          />
        )}
      </Bloque>

      <Bloque titulo={G.alertasHoy}>
        {alertas.length === 0 ? (
          <p className="font-plex text-sm text-acero">{G.sinAlertas}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alertas.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 border border-profundo p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-plex text-xs">
                    <span aria-hidden className={`size-2 ${a.gravedad === "roja" ? "bg-blanco" : "border border-blanco"}`} />
                    <span className="text-blanco">{T.alertas.tipos[a.tipo]}</span>
                    {a.funcionClave ? <span className="text-acero">· {String(a.detalle.funcion ?? a.funcionClave)}</span> : null}
                    {typeof a.detalle.porcentaje === "number" ? <span className="text-acero">· {a.detalle.porcentaje} %</span> : null}
                  </p>
                  <Link href={`/panel/nucleos/${a.cliente.nucleoId}/${a.cliente.id}${sufijo}`} className="font-lectura text-[15px] text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                    {a.cliente.nombre}
                  </Link>
                </div>
                {p.modoEjemplo ? <span className="font-plex text-[11px] text-acero">{T.ejemplo.cartel}</span> : <AccionesAlerta alerta={a} />}
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </Vista>
  );
}
