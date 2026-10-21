import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barras, Bloque, Indicador, PuntoRubro, TituloPanel } from "@/componentes/panel/Graficos";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { FormCobro, FormTipoCambio } from "@/componentes/panel/objetivos/Formularios";
import { ACENTO_CANAL, ACENTO_NICHO, AURORA } from "@/datos/colores";
import { PANEL_ADMIN } from "@/datos/textos";
import { METRICA } from "@/objetivos/catalogo";
import { limitesDelMes } from "@/objetivos/fechas";
import { conUnidad, diaLargo } from "@/objetivos/formato";
import type { DatosObjetivos } from "@/objetivos/tipos";
import { borrarCobro } from "@/servidor/objetivos/acciones";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";

const T = PANEL_ADMIN.objetivos;
const F = T.facturacion;
export const metadata: Metadata = { title: `${F.titulo} · ${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

const acentoDe = (nicho: string | null) => (nicho && nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : undefined);
const COLOR_TIPO: Record<string, string> = { abono_mensual: AURORA[0], implementacion: AURORA[1], web: AURORA[2], app_a_medida: ACENTO_NICHO.pymes, otro: "#9C9CA3" };

/** 7.6 Facturación: lo que cobra Quvant, cargado a mano, mes por mes. */
export default function Facturacion({ searchParams }: PageProps<"/panel/objetivos/facturacion">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
      <Link href="/panel/objetivos" className="w-fit font-plex text-xs uppercase tracking-etiqueta text-acero hover:text-blanco">
        {T.detalle.volver}
      </Link>
      <TituloPanel titulo={F.titulo} bajada={F.bajada} />
      <p className="flex items-center gap-3 border border-profundo px-4 py-3 font-plex text-xs text-acero">
        <span aria-hidden className="size-1.5 shrink-0 bg-acero" />
        {F.soloQuvant}
      </p>
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/panel/objetivos/facturacion">["searchParams"] }) {
  const { supabase } = await exigirAdmin("/panel/objetivos/facturacion");
  const parametros = await searchParams;
  const pedido = typeof parametros.mes === "string" && /^\d{4}-\d{2}$/.test(parametros.mes) ? parametros.mes : hoyEnBuenosAires().slice(0, 7);
  const { desde, hasta } = limitesDelMes(`${pedido}-01`);

  const [cobros, tipoCambio, clientes, nichos] = await Promise.all([
    supabase.from("cobros_quvant").select("*").gte("fecha", desde).lte("fecha", hasta).eq("es_prueba", false).order("fecha", { ascending: false }),
    supabase.from("tipo_cambio_mensual").select("pesos_por_dolar").eq("mes", desde).maybeSingle(),
    supabase.from("clientes_plantilla").select("id, empresa, nicho_id, abono_mensual, fecha_alta, fecha_baja").eq("es_prueba", false),
    cargarNichos(supabase),
  ]);
  if (cobros.error || clientes.error) {
    return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.faltaMigracion}</p>;
  }

  const filas = cobros.data ?? [];
  const cobradas = filas.filter((c) => c.cobrado);
  const total = cobradas.reduce((s, c) => s + Number(c.monto_ars), 0);
  const tc = tipoCambio.data ? Number(tipoCambio.data.pesos_por_dolar) : null;
  const datosMrr: DatosObjetivos = {
    cobros: [],
    tiposCambio: {},
    personas: [],
    visitantes: [],
    visitasLocales: [],
    locales: [],
    saludClientes: [],
    alertas: [],
    avances: [],
    comercial: null,
    clientes: (clientes.data ?? []).map((c) => ({ id: c.id, nicho: c.nicho_id, abono: c.abono_mensual === null ? null : Number(c.abono_mensual), alta: c.fecha_alta, baja: c.fecha_baja })),
  };
  const mrr = METRICA.mrr.calcular(datosMrr, { desde, hasta, corte: hasta < hoyEnBuenosAires() ? hasta : hoyEnBuenosAires(), filtros: {}, metaId: "", acumulacion: "valor_al_cierre" }) ?? 0;

  const sumaPor = (clave: (c: (typeof cobradas)[number]) => string) => {
    const mapa = new Map<string, number>();
    for (const c of cobradas) mapa.set(clave(c), (mapa.get(clave(c)) ?? 0) + Number(c.monto_ars));
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  };
  const nombreNicho = (id: string) => nichos.find((n) => n.id === id)?.nombre ?? "Sin rubro";
  const nichosRegistro = nichos.filter((n) => n.en_registro && n.id !== "otro").map((n) => ({ id: n.id, nombre: n.nombre }));

  return (
    <>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1.5 block font-plex text-[11px] uppercase tracking-etiqueta text-acero">{F.mes}</span>
          <input type="month" name="mes" defaultValue={pedido} className="h-10 border border-profundo bg-negro px-3 font-plex text-base text-blanco md:text-sm" />
        </label>
        <button type="submit" className="h-10 bg-blanco px-5 font-plex text-xs font-medium uppercase tracking-[0.14em] text-negro hover:bg-acero">
          {T.filtros.aplicar}
        </button>
        <a href={`/panel/objetivos/facturacion/exportar?mes=${pedido}`} className="flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs uppercase tracking-[0.14em] text-blanco hover:border-acero">
          <span aria-hidden className="size-1.5 bg-blanco" />
          {F.exportar}
        </a>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Indicador etiqueta={F.total} valor={conUnidad(total, "ars")} acento={AURORA[2]} detalle={`${cobradas.length} cobros`} />
        <Indicador etiqueta={F.enDolares} valor={tc ? conUnidad(total / tc, "usd") : "—"} acento={ACENTO_CANAL.contacto} detalle={tc ? F.tipoCambioActual.replace("{valor}", conUnidad(tc, "ars")) : F.sinTipoCambio} />
        <Indicador etiqueta={F.mrr} valor={conUnidad(mrr, "ars")} acento={AURORA[0]} detalle={tc ? conUnidad(mrr / tc, "usd") : undefined} />
      </div>

      {cobradas.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Barras titulo={F.porTipo} filas={sumaPor((c) => c.tipo).map(([k, v]) => ({ id: k, etiqueta: F.tipos[k as keyof typeof F.tipos] ?? k, valor: v, acento: COLOR_TIPO[k] }))} formato={(v) => conUnidad(v, "ars")} />
          <Barras titulo={F.porNicho} filas={sumaPor((c) => c.nicho_id ?? "").map(([k, v]) => ({ id: k || "sin", etiqueta: nombreNicho(k), valor: v, acento: acentoDe(k) }))} formato={(v) => conUnidad(v, "ars")} />
        </div>
      ) : null}

      <Bloque titulo={F.cargar} id="cargar-cobro">
        <FormCobro clientes={[...new Set((clientes.data ?? []).map((c) => c.empresa))].sort()} nichos={nichosRegistro} />
      </Bloque>

      <Bloque titulo={F.lista}>
        {filas.length === 0 ? (
          <p className="border border-profundo p-5 font-lectura text-sm text-acero">{F.sinCobros}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filas.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 border border-profundo p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-lectura text-[15px] text-blanco">
                    <PuntoRubro acento={COLOR_TIPO[c.tipo]} />
                    {c.cliente}
                  </p>
                  <p className="font-plex text-xs text-acero">
                    {diaLargo(c.fecha)} · {F.tipos[c.tipo as keyof typeof F.tipos]}
                    {c.nicho_id ? ` · ${nombreNicho(c.nicho_id)}` : ""}
                    {c.iva_incluido ? ` · ${F.iva}` : ""}
                    {c.factura ? ` · ${c.factura}` : ""}
                    {c.nota ? ` · ${c.nota}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className={`font-plex text-sm tabular-nums ${c.cobrado ? "text-blanco" : "text-acero line-through"}`}>{conUnidad(Number(c.monto_ars), "ars")}</span>
                  {!c.cobrado ? <span className="border border-profundo px-2 py-1 font-plex text-[10px] uppercase tracking-etiqueta text-acero">{F.pendiente}</span> : null}
                  <form action={borrarCobro}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">
                      {F.borrar}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque titulo={F.tipoCambio} id="tipo-cambio">
        <FormTipoCambio mes={pedido} actual={tc} />
      </Bloque>
    </>
  );
}
