import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { Barras, Bloque } from "@/componentes/panel/Graficos";
import { Vista } from "@/componentes/panel/nucleos/comunes";
import { Puerta } from "@/componentes/panel/nichos/Puerta";
import { FormAvance } from "@/componentes/panel/objetivos/Formularios";
import { GraficoMeta } from "@/componentes/panel/objetivos/GraficoMeta";
import { Anillo, ChipEstado } from "@/componentes/panel/objetivos/Piezas";
import { IconoFuente, textoRitmo } from "@/componentes/panel/objetivos/Tarjeta";
import { ACENTO_NICHO, AURORA, COLOR_ESTADO } from "@/datos/colores";
import { CUENTA, PANEL_ADMIN } from "@/datos/textos";
import { METRICA, calcularValor } from "@/objetivos/catalogo";
import { abonoPromedio, embudoAlReves, tasasReales, tieneEmbudo, type Embudo, type Tasa } from "@/objetivos/embudo";
import { calcularAvance, serieReal } from "@/objetivos/estado";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import type { DatosObjetivos, Filtros, Meta } from "@/objetivos/tipos";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { archivarMeta, crearMetasDeActividad } from "@/servidor/objetivos/acciones";
import { cargarAdminsConSocio, cargarCambios, cargarCierres, cargarDatos, cargarMeta, cargarMetas, desdeNecesario, FaltaMigracion } from "@/servidor/objetivos/datos";
import { hoyBA } from "@/servidor/objetivos/proceso";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";
import { Historial } from "@/componentes/panel/bitacora/Historial";

const T = PANEL_ADMIN.objetivos;
const D = T.detalle;
export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const acentoDe = (nicho: string) => (nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : undefined);

/** 7.2 El detalle de un objetivo: gráfico, desglose, historial, cambios, carga manual y el embudo al revés. */
export default function Detalle({ params }: PageProps<"/panel/objetivos/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/objetivos" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {D.volver}
      </Link>
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: PageProps<"/panel/objetivos/[id]">["params"] }) {
  const { supabase } = await exigirAdmin("/panel/objetivos");
  const { id } = await params;
  if (!uuidValido(id)) notFound();
  const hoy = hoyBA();

  let meta: Meta | null;
  try {
    meta = await cargarMeta(supabase, id);
  } catch (error) {
    if (error instanceof FaltaMigracion) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
    throw error;
  }
  if (!meta) notFound();

  const metas = await cargarMetas(supabase, { archivadas: true });
  // La cadena de períodos (si se repite): este, los anteriores y los siguientes.
  const cadena = new Set<string>([meta.id]);
  const [datos, cambios, nichos, admins, filasRepite] = await Promise.all([
    cargarDatos(supabase, desdeNecesario([meta, ...metas], hoy), hoy),
    cargarCambios(supabase, meta.id),
    cargarNichos(supabase),
    cargarAdminsConSocio(supabase),
    supabase.from("metas").select("id, repite_de"),
  ]);
  const padres = new Map((filasRepite.data ?? []).map((f) => [f.id, f.repite_de]));
  for (let actual: string | null | undefined = meta.id; actual; actual = padres.get(actual)) cadena.add(actual);
  const cierres = await cargarCierres(supabase, [...cadena]);

  const metrica = METRICA[meta.metrica];
  const avance = calcularAvance(datos, meta, hoy);
  const serie = serieReal(datos, meta, hoy);
  const nombreNicho = (nid: string) => nichos.find((n) => n.id === nid)?.nombre ?? nid;
  const nombreQuien = (pid: string | null) => admins.find((a) => a.id === pid)?.nombre ?? "—";
  const color = COLOR_ESTADO[avance.estado];
  const racha = (() => {
    let n = 0;
    for (const c of cierres) {
      if (c.resultado !== "cumplido") break;
      n++;
    }
    return n;
  })();

  return (
    <Vista nivel={1}>
      {/* Cabecera. */}
      <header style={{ "--estado": color } as CSSProperties} className="flex flex-col gap-5 border border-profundo p-5 md:flex-row md:items-center md:p-6">
        <Anillo avance={avance.avance} estado={avance.estado} tamano={112} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <ChipEstado estado={avance.estado} />
          <h1 className="font-michroma text-xl uppercase leading-tight tracking-marca text-blanco md:text-2xl">{meta.nombre}</h1>
          {meta.descripcion ? <p className="font-lectura text-sm text-acero">{meta.descripcion}</p> : null}
          <p className="font-plex text-sm text-acero">
            <span className="font-michroma text-2xl text-blanco">{conUnidad(avance.valor, meta.unidad)}</span> / {conUnidad(meta.meta, meta.unidad)}
            {meta.meta !== meta.metaOriginal ? <span className="ml-2 line-through decoration-acero/70" title={T.tarjeta.metaOriginal}>{conUnidad(meta.metaOriginal, meta.unidad)}</span> : null}
          </p>
          <p className="font-plex text-xs text-blanco">{textoRitmo(meta, avance, hoy)}</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-plex text-xs text-acero">
            <span>
              {D.periodo}: {diaLargo(meta.desde)} → {diaLargo(meta.hasta)}
            </span>
            <span>{T.responsables[meta.responsable]}</span>
            <span>{T.areas[meta.area]}</span>
            <IconoFuente meta={meta} />
            {meta.archivada ? <span className="border border-profundo px-2 py-0.5 uppercase tracking-etiqueta">{D.archivada}</span> : null}
            {meta.filtros.nicho ? (
              <Puerta nicho={meta.filtros.nicho} className="uppercase tracking-etiqueta text-acero underline decoration-profundo underline-offset-4 hover:text-blanco">
                {PANEL_ADMIN.nichos.entrar.replace("{nombre}", nombreNicho(meta.filtros.nicho))}
              </Puerta>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <Link href={`/panel/objetivos/${meta.id}/editar`} className="inline-flex h-10 items-center justify-center border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
            {D.editar}
          </Link>
          {metrica?.area === "facturacion" && meta.metrica !== "mrr" ? (
            <Link href="/panel/objetivos/facturacion" className="inline-flex h-10 items-center justify-center border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
              {D.cargarCobro}
            </Link>
          ) : null}
          <form action={archivarMeta}>
            <input type="hidden" name="id" value={meta.id} />
            {meta.archivada ? <input type="hidden" name="volver" value="si" /> : null}
            <button type="submit" className="inline-flex h-10 w-full items-center justify-center px-4 font-plex text-xs uppercase tracking-[0.14em] text-acero hover:text-blanco">
              {meta.archivada ? D.desarchivar : D.archivar}
            </button>
          </form>
        </div>
      </header>

      <Bloque titulo={D.grafico} nota={`${D.graficoNota}${metrica?.ritmo === "habiles" ? ` ${D.feriados}` : ""}`}>
        {serie.length > 0 ? (
          <div className="border border-profundo p-3 md:p-5">
            <GraficoMeta serie={serie} desde={meta.desde} hasta={meta.hasta} meta={meta.meta} inicio={avance.inicio} acumulacion={meta.acumulacion} proyeccion={avance.proyeccion} unidad={meta.unidad} estado={avance.estado} />
          </div>
        ) : (
          <p className="border border-profundo p-5 font-plex text-sm text-acero">{T.tarjeta.empieza.replace("{fecha}", diaLargo(meta.desde))}</p>
        )}
        <p className="font-plex text-xs text-acero">
          {D.fuente}: {metrica?.explicacion}
        </p>
      </Bloque>

      <Desglose meta={meta} datos={datos} hoy={hoy} nombreNicho={nombreNicho} nichos={nichos.filter((n) => n.en_registro && n.id !== "otro").map((n) => n.id)} />

      {metrica && !metrica.automatica ? (
        <Bloque titulo={D.cargarAvance}>
          <FormAvance metaId={meta.id} />
          <AvancesCargados datos={datos} meta={meta} />
        </Bloque>
      ) : null}

      {tieneEmbudo(meta) ? <EmbudoAlReves meta={meta} falta={avance.falta} datos={datos} hoy={hoy} metas={metas} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo={D.historial}>
          {cierres.length === 0 ? (
            <p className="font-plex text-sm text-acero">{D.sinHistorial}</p>
          ) : (
            <>
              {racha > 1 ? <p className="font-plex text-xs" style={{ color: COLOR_ESTADO.cumplido }}>{D.racha.replace("{n}", String(racha))}</p> : null}
              <ul className="flex flex-col gap-2">
                {cierres.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 border border-profundo p-3 font-plex text-xs">
                    <span className="text-acero">
                      {diaLargo(c.desde)} → {diaLargo(c.hasta)}
                    </span>
                    <span className="tabular-nums text-blanco">
                      {conUnidad(c.valor === null ? null : Number(c.valor), meta!.unidad)} / {conUnidad(Number(c.meta), meta!.unidad)}
                    </span>
                    <ChipEstado estado={c.resultado === "cumplido" ? "cumplido" : "no_cumplido"} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Bloque>
        <Bloque titulo={D.cambios}>
          {cambios.length === 0 ? (
            <p className="font-plex text-sm text-acero">{D.sinCambios}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {cambios.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 border-l border-profundo pl-3">
                  <p className="font-plex text-xs text-blanco">{D.cambio.replace("{campo}", c.campo).replace("{antes}", c.valor_anterior ?? "—").replace("{despues}", c.valor_nuevo ?? "—")}</p>
                  <p className="font-lectura text-sm text-acero">{c.motivo}</p>
                  <p className="font-plex text-[11px] text-acero/70">
                    {nombreQuien(c.quien)} · {diaLargo(c.creado_en.slice(0, 10))}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Bloque>
        <Historial tabla="metas" registroId={meta.id} />
      </div>
    </Vista>
  );
}

/** El desglose por rubro, socio o tipo, cuando la métrica lo permite. */
function Desglose({ meta, datos, hoy, nombreNicho, nichos }: { meta: Meta; datos: DatosObjetivos; hoy: string; nombreNicho: (id: string) => string; nichos: string[] }) {
  const metrica = METRICA[meta.metrica];
  if (!metrica?.automatica || metrica.filtros.length === 0 || metrica.unidad === "porcentaje") return null;
  const valorCon = (filtros: Filtros) => calcularValor(datos, { ...meta, filtros: { ...meta.filtros, ...filtros } }, hoy) ?? 0;
  const formato = (v: number) => conUnidad(v, meta.unidad);
  const bloques: Array<{ titulo: string; filas: Array<{ id: string; etiqueta: string; valor: number; acento?: string }> }> = [];
  if (metrica.filtros.includes("nicho") && !meta.filtros.nicho) {
    bloques.push({ titulo: T.form.filtroNicho, filas: nichos.map((n) => ({ id: n, etiqueta: nombreNicho(n), valor: valorCon({ nicho: n }), acento: acentoDe(n) })).filter((f) => f.valor > 0) });
  }
  if (metrica.filtros.includes("socio") && !meta.filtros.socio) {
    bloques.push({ titulo: T.form.filtroSocio, filas: (["fabrizio", "michel"] as const).map((s, i) => ({ id: s, etiqueta: T.responsables[s], valor: valorCon({ socio: s }), acento: AURORA[i] })) });
  }
  if (metrica.filtros.includes("tipo") && !meta.filtros.tipo) {
    bloques.push({ titulo: T.form.filtroTipo, filas: Object.entries(T.facturacion.tipos).map(([k, v], i) => ({ id: k, etiqueta: v, valor: valorCon({ tipo: k as Filtros["tipo"] }), acento: AURORA[i % AURORA.length] })).filter((f) => f.valor > 0) });
  }
  if (metrica.filtros.includes("objetivo") && !meta.filtros.objetivo) {
    bloques.push({ titulo: T.form.filtroObjetivo, filas: CUENTA.objetivos.map((o, i) => ({ id: o.id, etiqueta: o.texto, valor: valorCon({ objetivo: o.id }), acento: AURORA[i % AURORA.length] })) });
  }
  const conDatos = bloques.filter((b) => b.filas.some((f) => f.valor > 0));
  if (conDatos.length === 0) return null;
  return (
    <Bloque titulo={D.desglose}>
      <div className="grid gap-4 lg:grid-cols-2">
        {conDatos.map((b) => (
          <Barras key={b.titulo} titulo={b.titulo} filas={b.filas} formato={formato} />
        ))}
      </div>
    </Bloque>
  );
}

function AvancesCargados({ datos, meta }: { datos: DatosObjetivos; meta: Meta }) {
  const propios = datos.avances.filter((a) => a.metaId === meta.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <div className="flex flex-col gap-2">
      <p className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{D.avances}</p>
      {propios.length === 0 ? (
        <p className="font-plex text-sm text-acero">{D.sinAvances}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {propios.map((a, i) => (
            <li key={`${a.fecha}-${i}`} className="flex justify-between gap-3 border-b border-profundo py-2 font-plex text-xs">
              <span className="text-acero">{diaLargo(a.fecha)}</span>
              <span className="tabular-nums text-blanco">{conUnidad(a.valor, meta.unidad)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 7.3 El embudo al revés, que se ensancha hacia arriba: de los clientes que faltan a las visitas que hacen falta. */
function EmbudoAlReves({ meta, falta, datos, hoy, metas }: { meta: Meta; falta: number | null; datos: DatosObjetivos; hoy: string; metas: Meta[] }) {
  const E = T.embudo;
  if (!falta || falta <= 0) {
    return (
      <Bloque titulo={E.titulo}>
        <p className="font-plex text-sm text-acero">{E.cumplido}</p>
      </Bloque>
    );
  }
  const e: Embudo = embudoAlReves(meta, falta, tasasReales(datos, hoy, metas), abonoPromedio(datos, hoy));
  const nota = (t: Tasa) => (t.propia ? E.tasaPropia.replace("{casos}", String(t.casos)) : E.tasaPlan);
  const maximo = Math.max(e.visitasWeb, e.visitasLocales, 1);
  // Escala logarítmica: las visitas a la web son cientos de veces los clientes.
  const ancho = (n: number) => `${Math.max(14, (Math.log10(n + 1) / Math.log10(maximo + 1)) * 100)}%`;
  const fila = (etiqueta: string, n: number, color: string, detalle: string | null, i: number) => (
    <li className="flex flex-col items-center gap-1">
      <span className="embudo-crece flex h-9 items-center justify-center font-plex text-sm tabular-nums text-negro" style={{ width: ancho(n), background: color, animationDelay: `${(4 - i) * 120}ms` }}>
        {conUnidad(n, "numero")}
      </span>
      <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{etiqueta}</span>
      {detalle ? <span className="text-center font-plex text-[10px] text-acero/70">{detalle}</span> : null}
    </li>
  );
  return (
    <Bloque titulo={E.titulo} nota={E.nota}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3 border border-profundo p-4">
          <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{E.porLaCalle}</p>
          <ol className="flex flex-col gap-3">
            {fila(E.visitasLocales, e.visitasLocales, AURORA[0], nota(e.tasas.localADemo), 3)}
            {fila(E.demos, e.demos, AURORA[1], nota(e.tasas.demoACliente), 1)}
            {fila(E.clientes, e.clientes, COLOR_ESTADO.cumplido, null, 0)}
          </ol>
        </div>
        <div className="flex flex-col gap-3 border border-profundo p-4">
          <p className="font-plex text-[11px] uppercase tracking-etiqueta text-blanco">{E.porLaWeb}</p>
          <ol className="flex flex-col gap-3">
            {fila(E.visitasWeb, e.visitasWeb, AURORA[2], nota(e.tasas.webARegistro), 4)}
            {fila(E.registros, e.registros, ACENTO_NICHO.holistica, nota(e.tasas.registroADemo), 3)}
            {fila(E.demos, e.demos, AURORA[1], nota(e.tasas.demoACliente), 1)}
            {fila(E.clientes, e.clientes, COLOR_ESTADO.cumplido, null, 0)}
          </ol>
        </div>
      </div>
      {e.abonoUsado ? <p className="font-plex text-xs text-acero">{E.abono.replace("{abono}", conUnidad(e.abonoUsado, "ars"))}</p> : null}
      <form action={crearMetasDeActividad}>
        <input type="hidden" name="id" value={meta.id} />
        <button type="submit" className="inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
          + {E.crear}
        </button>
      </form>
    </Bloque>
  );
}
