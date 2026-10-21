import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barras, Bloque, Indicador, PuntoRubro, TituloPanel } from "@/componentes/panel/Graficos";
import { Tablero, type TarjetaOportunidad } from "@/componentes/panel/comercial/Tablero";
import { ETAPAS, ETAPAS_ABIERTAS, MOTIVOS_PERDIDA, diasEnEtapa, embudoComercial, esEtapa, estancada, tiempoPorEtapa, valorAnual, valorPonderado, type Etapa } from "@/comercial/comercial";
import { ACENTO_NICHO, AURORA, COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import { aActividad, aOportunidad, cargarComercial, type FilaOportunidad } from "@/servidor/comercial/datos";
import { FaltaMigracion } from "@/servidor/objetivos/datos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.comercial;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };
const acentoDe = (n: string | null) => (n && n in ACENTO_NICHO ? ACENTO_NICHO[n as keyof typeof ACENTO_NICHO] : undefined);
type Parametros = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** 1. El seguimiento comercial: tablero por etapas, lista con filtros y el embudo. */
export default function Comercial({ searchParams }: PageProps<"/panel/comercial">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/comercial">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/comercial");
  const p = await searchParams;
  const vista = ["lista", "embudo"].includes(uno(p.vista)) ? uno(p.vista) : "tablero";
  let datos;
  try {
    datos = await cargarComercial(supabase);
  } catch (error) {
    if (error instanceof FaltaMigracion) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
    throw error;
  }
  const nichos = await cargarNichos(supabase);
  const ahora = new Date().toISOString();
  const hoy = diaBA(new Date());

  const pestanas = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label={T.titulo} className="flex gap-1">
        {(Object.keys(T.vistas) as Array<keyof typeof T.vistas>).map((v) => (
          <Link key={v} href={v === "tablero" ? "/panel/comercial" : `/panel/comercial?vista=${v}`} aria-current={vista === v ? "page" : undefined} className="h-10 border border-profundo px-4 font-plex text-xs uppercase leading-10 tracking-[0.14em] text-acero hover:text-blanco aria-[current=page]:border-blanco aria-[current=page]:text-blanco">
            {T.vistas[v]}
          </Link>
        ))}
      </nav>
      <Link href="/panel/comercial/nueva" className="inline-flex h-10 items-center bg-blanco px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
        + {T.nueva}
      </Link>
    </div>
  );

  if (vista === "lista") return <>{pestanas}<Lista filas={datos.filas} p={p} ahora={ahora} hoy={hoy} nichos={nichos} /></>;
  if (vista === "embudo") return <>{pestanas}<Embudo filas={datos.filas} actividades={datos.actividades.map(aActividad)} /></>;

  const tarjetas: TarjetaOportunidad[] = datos.filas
    .filter((f) => (ETAPAS_ABIERTAS as string[]).includes(f.etapa))
    .map((f) => {
      const o = aOportunidad(f);
      return {
        id: f.id,
        negocio: f.negocio,
        nicho: f.nicho_id,
        etapa: o.etapa,
        valorAnual: valorAnual(o),
        dias: diasEnEtapa(o, ahora),
        estancada: estancada(o, ahora),
        proximoPaso: f.proximo_paso,
        proximoFecha: f.proximo_paso_fecha,
        vencida: !!f.proximo_paso_fecha && f.proximo_paso_fecha < hoy,
        responsable: f.responsable,
      };
    });
  return (
    <>
      {pestanas}
      <Tablero tarjetas={tarjetas} ganadas={datos.filas.filter((f) => f.etapa === "ganado").length} perdidas={datos.filas.filter((f) => f.etapa === "perdido").length} />
    </>
  );
}

const CLASE_CONTROL = "h-10 w-full border border-profundo bg-negro px-3 font-plex text-base text-blanco focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA_FILTRO = "mb-1.5 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero";

function Lista({ filas, p, ahora, hoy, nichos }: { filas: FilaOportunidad[]; p: Parametros; ahora: string; hoy: string; nichos: Array<{ id: string; nombre: string }> }) {
  const L = T.lista;
  const F = L.filtros;
  const f = { etapa: uno(p.etapa), nicho: uno(p.nicho), responsable: uno(p.responsable), origen: uno(p.origen), sinPaso: uno(p.sinPaso) === "si", vencidas: uno(p.vencidas) === "si" };
  const visibles = filas.filter(
    (o) =>
      (!f.etapa || o.etapa === f.etapa) &&
      (!f.nicho || o.nicho_id === f.nicho) &&
      (!f.responsable || o.responsable === f.responsable) &&
      (!f.origen || o.origen === f.origen) &&
      (!f.sinPaso || (!o.proximo_paso && !o.proximo_paso_fecha)) &&
      (!f.vencidas || (!!o.proximo_paso_fecha && o.proximo_paso_fecha < hoy)),
  );
  const consulta = new URLSearchParams(Object.entries({ ...f, sinPaso: f.sinPaso ? "si" : "", vencidas: f.vencidas ? "si" : "" }).filter(([, v]) => v) as Array<[string, string]>).toString();
  const nombreNicho = (id: string | null) => nichos.find((n) => n.id === id)?.nombre ?? "—";
  const selector = (nombre: keyof typeof f, etiqueta: string, opciones: Array<[string, string]>) => (
    <label>
      <span className={CLASE_ETIQUETA_FILTRO}>{etiqueta}</span>
      <select name={nombre} defaultValue={String(f[nombre])} className={CLASE_CONTROL}>
        <option value="">{F.todos}</option>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <form method="get" className="grid grid-cols-2 gap-3 border border-profundo p-4 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto_auto] lg:items-end">
        <input type="hidden" name="vista" value="lista" />
        {selector("etapa", F.etapa, ETAPAS.map((e) => [e, T.etapas[e]]))}
        {selector("nicho", F.nicho, nichos.map((n) => [n.id, n.nombre]))}
        {selector("responsable", F.responsable, Object.entries(T.responsables))}
        {selector("origen", F.origen, Object.entries(T.origenes))}
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input type="checkbox" name="sinPaso" value="si" defaultChecked={f.sinPaso} className="size-4 accent-[#ECECEE]" />
          <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{F.sinPaso}</span>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input type="checkbox" name="vencidas" value="si" defaultChecked={f.vencidas} className="size-4 accent-[#ECECEE]" />
          <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{F.vencidas}</span>
        </label>
        <div className="col-span-2 flex items-end gap-3 md:col-span-4 lg:col-span-1">
          <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
            {F.aplicar}
          </button>
          <Link href="/panel/comercial?vista=lista" className="flex h-10 items-center font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
            {F.limpiar}
          </Link>
        </div>
      </form>
      <div className="flex justify-end">
        <a href={`/panel/comercial/exportar${consulta ? `?${consulta}` : ""}`} className="inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
          <span aria-hidden className="size-1.5 bg-blanco" />
          {L.exportar}
        </a>
      </div>
      {visibles.length === 0 ? (
        <p className="border border-profundo p-5 font-lectura text-sm text-acero">{L.vacio}</p>
      ) : (
        <div className="overflow-x-auto border border-profundo">
          <table className="w-full min-w-[52rem] border-collapse font-plex text-xs">
            <thead>
              <tr className="text-left text-acero">
                {[L.negocio, L.etapa, L.nicho, L.origen, L.responsable, L.valor, L.proximo, L.dias].map((c) => (
                  <th key={c} scope="col" className="whitespace-nowrap p-3 font-medium uppercase tracking-etiqueta">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((o) => {
                const op = aOportunidad(o);
                const vencida = !!o.proximo_paso_fecha && o.proximo_paso_fecha < hoy;
                return (
                  <tr key={o.id} className="border-t border-profundo transition-colors hover:bg-profundo/40">
                    <td className="p-3">
                      <Link href={`/panel/comercial/${o.id}`} className="font-lectura text-sm text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                        {o.negocio}
                      </Link>
                    </td>
                    <td className="p-3 text-blanco">{esEtapa(o.etapa) ? T.etapas[o.etapa] : o.etapa}</td>
                    <td className="p-3 text-acero">
                      <span className="flex items-center gap-2">
                        <PuntoRubro acento={acentoDe(o.nicho_id)} />
                        {nombreNicho(o.nicho_id)}
                      </span>
                    </td>
                    <td className="p-3 text-acero">{T.origenes[o.origen as keyof typeof T.origenes]}</td>
                    <td className="p-3 text-acero">{T.responsables[o.responsable as keyof typeof T.responsables]}</td>
                    <td className="p-3 tabular-nums text-blanco">{valorAnual(op) ? conUnidad(valorAnual(op), "ars") : "—"}</td>
                    <td className="p-3" style={{ color: vencida ? COLOR_ESTADO.atrasado : undefined }}>
                      {o.proximo_paso_fecha ? diaLargo(o.proximo_paso_fecha) : "—"} {o.proximo_paso ? `· ${o.proximo_paso}` : ""}
                    </td>
                    <td className="p-3 tabular-nums" style={{ color: estancada(op, ahora) ? COLOR_ESTADO.en_riesgo : undefined }}>
                      {diasEnEtapa(op, ahora)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Embudo({ filas, actividades }: { filas: FilaOportunidad[]; actividades: ReturnType<typeof aActividad>[] }) {
  const E = T.embudo;
  const ops = filas.map(aOportunidad);
  const pasos = embudoComercial(ops, actividades);
  const tiempos = tiempoPorEtapa(actividades, new Map(ops.map((o) => [o.id, o.creadoEn])));
  const perdidas = filas.filter((f) => f.etapa === "perdido");
  const pct = (n: number) => `${Math.round(n * 1000) / 10} %`.replace(".", ",");
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador etiqueta={E.pipeline} valor={conUnidad(valorPonderado(ops), "ars")} acento={AURORA[2]} detalle={E.pipelineNota} />
        <Indicador etiqueta={E.abiertas} valor={String(ops.filter((o) => o.etapa !== "ganado" && o.etapa !== "perdido").length)} acento={AURORA[1]} />
        <Indicador etiqueta={E.ganadas} valor={String(ops.filter((o) => o.etapa === "ganado").length)} acento={COLOR_ESTADO.cumplido} />
        <Indicador etiqueta={E.perdidas} valor={String(perdidas.length)} acento={COLOR_ESTADO.atrasado} />
      </div>
      <Bloque titulo={E.titulo} nota={E.nota}>
        <ol className="flex flex-col gap-2">
          {pasos.map((paso, i) => {
            const max = Math.max(1, pasos[0].llegaron);
            return (
              <li key={paso.etapa} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 font-plex text-xs sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,14rem)]">
                <span className="text-blanco">{T.etapas[paso.etapa as Etapa]}</span>
                <span className="h-6 bg-profundo/50">
                  <span className="barra-crece block h-full" style={{ width: `${(paso.llegaron / max) * 100}%`, background: paso.etapa === "ganado" ? COLOR_ESTADO.cumplido : AURORA[i % AURORA.length], animationDelay: `${i * 80}ms` }} />
                </span>
                <span className="text-right tabular-nums text-acero">
                  {E.llegaron.replace("{n}", String(paso.llegaron))}
                  {paso.tasa ? ` · ${pct(paso.tasa.p)} (${pct(paso.tasa.bajo)} a ${pct(paso.tasa.alto)})` : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </Bloque>
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.keys(tiempos).length === 0 ? (
          <p className="border border-profundo p-5 font-plex text-sm text-acero">{E.sinTiempo}</p>
        ) : (
          <Barras titulo={E.tiempo} filas={ETAPAS_ABIERTAS.filter((e) => tiempos[e] !== undefined).map((e, i) => ({ id: e, etiqueta: T.etapas[e], valor: tiempos[e]!, acento: AURORA[i % AURORA.length] }))} formato={(v) => `${String(v).replace(".", ",")} d`} />
        )}
        {perdidas.length === 0 ? (
          <p className="border border-profundo p-5 font-plex text-sm text-acero">{E.sinMotivos}</p>
        ) : (
          <Barras titulo={E.motivos} filas={MOTIVOS_PERDIDA.map((m) => ({ id: m, etiqueta: T.motivos[m], valor: perdidas.filter((f) => f.motivo_perdida === m).length, acento: COLOR_ESTADO.atrasado }))} />
        )}
      </div>
    </div>
  );
}
