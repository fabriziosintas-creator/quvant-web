import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bloque, TituloPanel } from "@/componentes/panel/Graficos";
import { Numero, Vista } from "@/componentes/panel/nucleos/comunes";
import { BotonCerrar } from "@/componentes/panel/objetivos/Formularios";
import { ChipEstado } from "@/componentes/panel/objetivos/Piezas";
import { IconoFuente, TarjetaObjetivo, textoRitmo } from "@/componentes/panel/objetivos/Tarjeta";
import { COLOR_ESTADO } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { calcularAvance, serieReal, type Avance } from "@/objetivos/estado";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import type { Area, EstadoMeta, Meta } from "@/objetivos/tipos";
import { cargarDatos, cargarMetas, cierresRecientes, desdeNecesario, FaltaMigracion } from "@/servidor/objetivos/datos";
import { hoyBA } from "@/servidor/objetivos/proceso";
import { exigirAdmin } from "@/servidor/panel/acceso";

const T = PANEL_ADMIN.objetivos;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const ETAPAS = ["todas", "90_dias", "6_meses", "12_meses", "libre"] as const;
const AREAS = Object.keys(T.areas) as Area[];
const ESTADOS = ["cumplido", "en_camino", "en_riesgo", "atrasado", "sin_datos", "no_cumplido"] as const;
/** Lo más urgente primero. */
const URGENCIA: Record<EstadoMeta, number> = { atrasado: 0, en_riesgo: 1, sin_datos: 2, en_camino: 3, cumplido: 4, no_cumplido: 5 };

type Parametros = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function leerFiltros(p: Parametros) {
  const etapa = uno(p.etapa);
  const responsable = uno(p.responsable);
  const area = uno(p.area);
  const estado = uno(p.estado);
  const vista = uno(p.vista);
  const orden = uno(p.orden);
  return {
    etapa: (ETAPAS as readonly string[]).includes(etapa) ? (etapa as (typeof ETAPAS)[number]) : "todas",
    responsable: ["fabrizio", "michel", "los_dos"].includes(responsable) ? responsable : "",
    area: (AREAS as string[]).includes(area) ? area : "",
    estado: (ESTADOS as readonly string[]).includes(estado) ? estado : "",
    vista: vista === "lista" || vista === "area" ? vista : "tarjetas",
    orden: ["nombre", "avance", "hasta"].includes(orden) ? orden : "urgencia",
    cerrados: uno(p.cerrados) === "si",
  };
}
type FiltrosTablero = ReturnType<typeof leerFiltros>;

const enlace = (f: FiltrosTablero, cambios: Partial<Record<keyof FiltrosTablero, string>>) => {
  const p = new URLSearchParams();
  const todo = { ...f, cerrados: f.cerrados ? "si" : "", ...cambios };
  for (const [k, v] of Object.entries(todo)) if (v && !(k === "etapa" && v === "todas") && !(k === "vista" && v === "tarjetas") && !(k === "orden" && v === "urgencia")) p.set(k, String(v));
  const s = p.toString();
  return `/panel/objetivos${s ? `?${s}` : ""}`;
};

/** 7.1 El tablero: todos los objetivos, si se cumplen y a qué ritmo. */
export default function Objetivos({ searchParams }: PageProps<"/panel/objetivos">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const CLASE_ACCION = "inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero";

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/objetivos">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/objetivos");
  const f = leerFiltros(await searchParams);
  const hoy = hoyBA();

  let metas: Meta[];
  let calculados: Array<{ meta: Meta; avance: Avance; serie: Array<number | null> }>;
  let cierres: Awaited<ReturnType<typeof cierresRecientes>>;
  try {
    metas = await cargarMetas(supabase);
    const datos = await cargarDatos(supabase, desdeNecesario(metas, hoy), hoy);
    cierres = await cierresRecientes(supabase);
    calculados = metas.map((meta) => ({ meta, avance: calcularAvance(datos, meta, hoy), serie: serieReal(datos, meta, hoy).map((p) => p.valor) }));
  } catch (error) {
    if (error instanceof FaltaMigracion) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
    throw error;
  }

  const acciones = (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/panel/objetivos/nueva" className="inline-flex h-10 items-center gap-2 bg-blanco px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
        + {T.acciones.nueva}
      </Link>
      <Link href="/panel/objetivos/plan" className={CLASE_ACCION}>
        {T.acciones.plan}
      </Link>
      <Link href="/panel/objetivos/facturacion" className={CLASE_ACCION}>
        <span aria-hidden className="size-1.5 bg-blanco" />
        {T.acciones.facturacion}
      </Link>
    </div>
  );

  if (metas.length === 0) {
    return (
      <>
        {acciones}
        <p className="border border-profundo p-6 font-lectura text-sm leading-relaxed text-acero">{T.vacio}</p>
      </>
    );
  }

  // Los que entran en el filtro. Por defecto, los vigentes y los que vienen (no los terminados).
  const visibles = calculados.filter(({ meta, avance }) => {
    if (!f.cerrados && meta.hasta < hoy) return false;
    if (f.etapa !== "todas" && meta.etapa !== f.etapa) return false;
    if (f.responsable && meta.responsable !== f.responsable) return false;
    if (f.area && meta.area !== f.area) return false;
    if (f.estado && avance.estado !== f.estado) return false;
    return true;
  });
  const enCurso = visibles.filter(({ meta }) => meta.desde <= hoy);
  const bien = enCurso.filter(({ avance }) => avance.estado === "cumplido" || avance.estado === "en_camino").length;
  const conteo = ESTADOS.map((e) => ({ estado: e, n: enCurso.filter((c) => c.avance.estado === e).length })).filter((c) => c.n > 0);

  const ordenados = [...visibles].sort((a, b) => {
    const empezado = Number(a.meta.desde > hoy) - Number(b.meta.desde > hoy);
    if (f.orden === "nombre") return a.meta.nombre.localeCompare(b.meta.nombre);
    if (f.orden === "avance") return (b.avance.avance ?? -1) - (a.avance.avance ?? -1);
    if (f.orden === "hasta") return a.meta.hasta.localeCompare(b.meta.hasta);
    return empezado || URGENCIA[a.avance.estado] - URGENCIA[b.avance.estado] || a.meta.hasta.localeCompare(b.meta.hasta) || a.meta.orden - b.meta.orden;
  });

  const cumplidosRecientes = cierres.filter((c) => c.resultado === "cumplido").length;
  const grilla = (lista: typeof ordenados) => (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {lista.map((c) => (
        <li key={c.meta.id}>
          <TarjetaObjetivo meta={c.meta} avance={c.avance} serie={c.serie} hoy={hoy} />
        </li>
      ))}
    </ul>
  );

  return (
    <Vista nivel={0}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {acciones}
        <BotonCerrar />
      </div>

      {cierres.length > 0 ? (
        <p role="status" className="flex items-center gap-3 border border-profundo px-4 py-3 font-plex text-sm text-blanco">
          <span aria-hidden className="size-2 animate-[latido_1.2s_ease-out_1]" style={{ background: COLOR_ESTADO.cumplido }} />
          {T.cierre.replace("{n}", String(cierres.length)).replace("{c}", String(cumplidosRecientes))}
        </p>
      ) : null}

      {/* El marcador grande. */}
      <section aria-label={T.titulo} className="flex flex-col gap-4 border border-profundo p-5 md:p-6">
        {enCurso.length > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-michroma text-4xl leading-none text-blanco md:text-5xl">
              <Numero valor={bien} />
            </span>
            <span className="font-plex text-sm text-acero">{T.marcadorResto.replace("{total}", String(enCurso.length))}</span>
          </p>
        ) : (
          <p className="font-plex text-sm text-acero">{T.marcadorSin}</p>
        )}
        {enCurso.length > 0 ? (
          <>
            <div aria-hidden className="flex h-2.5 w-full gap-0.5 overflow-hidden">
              {conteo.map((c, i) => (
                <span key={c.estado} className="barra-crece h-full" style={{ flexGrow: c.n, background: COLOR_ESTADO[c.estado], animationDelay: `${i * 90}ms` }} />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {conteo.map((c) => (
                <li key={c.estado} className="flex items-center gap-2 font-plex text-xs text-acero">
                  <ChipEstado estado={c.estado} />
                  <span className="tabular-nums text-blanco">{c.n}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* Etapas. */}
      <nav aria-label={T.filtros.etapa} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-profundo">
          {ETAPAS.map((e) => (
            <li key={e}>
              <Link
                href={enlace(f, { etapa: e })}
                aria-current={f.etapa === e ? "page" : undefined}
                className="flex h-11 items-center border-b-2 border-transparent px-4 font-plex text-xs uppercase tracking-etiqueta text-acero transition-colors hover:text-blanco aria-[current=page]:border-blanco aria-[current=page]:text-blanco"
              >
                {T.etapas[e]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <FormularioFiltros f={f} />

      {ordenados.length === 0 ? (
        <p className="border border-profundo p-5 font-lectura text-sm text-acero">{T.marcadorSin}</p>
      ) : f.vista === "lista" ? (
        <Lista filas={ordenados} f={f} hoy={hoy} />
      ) : f.vista === "area" ? (
        AREAS.filter((a) => ordenados.some((c) => c.meta.area === a)).map((a) => (
          <Bloque key={a} titulo={T.areas[a]}>
            {grilla(ordenados.filter((c) => c.meta.area === a))}
          </Bloque>
        ))
      ) : (
        grilla(ordenados)
      )}
    </Vista>
  );
}

const CLASE_CONTROL = "h-10 w-full border border-profundo bg-negro px-3 font-plex text-base text-blanco focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA_FILTRO = "mb-1.5 block font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero";

function FormularioFiltros({ f }: { f: FiltrosTablero }) {
  const F = T.filtros;
  return (
    <form method="get" aria-label={F.titulo} className="grid grid-cols-2 gap-3 border border-profundo p-4 md:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] lg:items-end">
      {f.etapa !== "todas" ? <input type="hidden" name="etapa" value={f.etapa} /> : null}
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.responsable}</span>
        <select name="responsable" defaultValue={f.responsable} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {Object.entries(T.responsables).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.area}</span>
        <select name="area" defaultValue={f.area} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {Object.entries(T.areas).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.estado}</span>
        <select name="estado" defaultValue={f.estado} className={CLASE_CONTROL}>
          <option value="">{F.todos}</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {T.estados[e]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={CLASE_ETIQUETA_FILTRO}>{F.vista}</span>
        <select name="vista" defaultValue={f.vista} className={CLASE_CONTROL}>
          <option value="tarjetas">{F.tarjetas}</option>
          <option value="area">{F.porArea}</option>
          <option value="lista">{F.lista}</option>
        </select>
      </label>
      <label className="flex items-center gap-3 self-end pb-2.5">
        <input type="checkbox" name="cerrados" value="si" defaultChecked={f.cerrados} className="size-4 accent-[#ECECEE]" />
        <span className="font-plex text-[11px] uppercase leading-snug tracking-etiqueta text-acero">{F.cerrados}</span>
      </label>
      <div className="col-span-2 flex items-end gap-3 md:col-span-4 lg:col-span-1">
        <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
          {F.aplicar}
        </button>
        <Link href="/panel/objetivos" className="flex h-10 items-center font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
          {F.limpiar}
        </Link>
      </div>
    </form>
  );
}

/** La vista en lista: una tabla ordenable (útil en el celular, de costado). */
function Lista({ filas, f, hoy }: { filas: Array<{ meta: Meta; avance: Avance }>; f: FiltrosTablero; hoy: string }) {
  const L = T.lista;
  const cabecera = (texto: string, orden?: string) => (
    <th scope="col" className="whitespace-nowrap p-3 text-left font-medium uppercase tracking-etiqueta">
      {orden ? (
        <Link href={enlace(f, { orden })} aria-current={f.orden === orden ? "true" : undefined} className="hover:text-blanco aria-[current=true]:text-blanco">
          {texto}
        </Link>
      ) : (
        texto
      )}
    </th>
  );
  return (
    <div className="overflow-x-auto border border-profundo">
      <table className="w-full min-w-[44rem] border-collapse font-plex text-xs">
        <thead>
          <tr className="text-acero">
            {cabecera(L.nombre, "nombre")}
            {cabecera(L.estado)}
            {cabecera(L.valor)}
            {cabecera(L.meta)}
            {cabecera(L.avance, "avance")}
            {cabecera(L.responsable)}
            {cabecera(L.hasta, "hasta")}
          </tr>
        </thead>
        <tbody>
          {filas.map(({ meta, avance }) => (
            <tr key={meta.id} className="border-t border-profundo transition-colors hover:bg-profundo/40">
              <td className="p-3">
                <Link href={`/panel/objetivos/${meta.id}`} className="font-lectura text-sm text-blanco underline decoration-profundo underline-offset-4 hover:decoration-blanco">
                  {meta.nombre}
                </Link>
                <p className="mt-1 text-acero">{textoRitmo(meta, avance, hoy)}</p>
              </td>
              <td className="p-3">
                <ChipEstado estado={avance.estado} />
              </td>
              <td className="p-3 tabular-nums text-blanco">{conUnidad(avance.valor, meta.unidad)}</td>
              <td className="p-3 tabular-nums text-acero">{conUnidad(meta.meta, meta.unidad)}</td>
              <td className="p-3 tabular-nums text-blanco">{avance.avance === null ? "—" : `${Math.round(avance.avance * 100)} %`}</td>
              <td className="p-3 text-acero">
                {T.responsables[meta.responsable]} <IconoFuente meta={meta} />
              </td>
              <td className="p-3 tabular-nums text-acero">{diaLargo(meta.hasta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
