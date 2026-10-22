import type { Metadata } from "next";
import { Suspense } from "react";
import { Barras, Bloque, Indicador, PuntoRubro, TituloPanel } from "@/componentes/panel/Graficos";
import { fecha, fechaHora, numero } from "@/componentes/panel/formato";
import { ACENTO_NICHO } from "@/datos/colores";
import { whatsappDe } from "@/datos/contacto";
import { PROMO_TEXTOS } from "@/datos/promo";
import { PANEL_ADMIN } from "@/datos/textos";
import { exigirAdmin } from "@/servidor/panel/acceso";
import { cargarNichos } from "@/servidor/panel/datos";
import { cambiarPromoActiva, guardarLugar } from "@/servidor/promo/accionesPanel";
import { ESTADOS_EDITABLES, canalDe, cargarConfigPromo, cargarEmbudo, cargarLugares, contarTarjetas, type LugarPanel } from "@/servidor/promo/panel";

const T = PROMO_TEXTOS.panel;
const BENEFICIO = PROMO_TEXTOS.beneficiosCortos;
const acentoDe = (nicho: string) => (nicho in ACENTO_NICHO ? ACENTO_NICHO[nicho as keyof typeof ACENTO_NICHO] : undefined);

export const metadata: Metadata = { title: `${T.titulo} · ${PANEL_ADMIN.titulo} · Quvant` };

/** "Primeros 100": los lugares, qué eligieron, en qué están, de dónde vinieron y el camino hasta el lugar. */
export default function PrimerosCienPanel() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6 md:py-10">
      <TituloPanel titulo={T.titulo} bajada={T.bajada} />
      <Suspense fallback={<p className="font-plex text-sm text-acero">{PANEL_ADMIN.cargando}</p>}>
        <Contenido />
      </Suspense>
    </main>
  );
}

async function Contenido() {
  const { supabase } = await exigirAdmin("/panel/primeros-100");
  const config = await cargarConfigPromo(supabase);
  if (!config) return <p className="border border-profundo p-6 font-lectura text-sm text-acero">{T.sinBase}</p>;

  const [lugares, embudo, nichos, tarjetas] = await Promise.all([cargarLugares(supabase), cargarEmbudo(supabase), cargarNichos(supabase), contarTarjetas(supabase)]);
  const conNumero = lugares.filter((l) => l.numero !== null);
  const espera = lugares.filter((l) => l.estado === "espera");
  const pedidos = lugares.filter((l) => l.estado === "pedido");
  const nombreNicho = (id: string) => nichos.find((n) => n.id === id)?.nombre ?? id;
  const contar = <K extends string>(lista: LugarPanel[], clave: (l: LugarPanel) => K) => {
    const cuenta = new Map<K, number>();
    for (const l of lista) cuenta.set(clave(l), (cuenta.get(clave(l)) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  };
  const I = T.indicadores;
  const hasta = config.hasta.split("-").reverse().join("/");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador etiqueta={I.dados} valor={numero(conNumero.length)} detalle={I.deTope.replace("{tope}", numero(config.tope))} />
        <Indicador etiqueta={I.quedan} valor={numero(Math.max(config.tope - conNumero.length, 0))} detalle={I.hasta.replace("{hasta}", hasta)} />
        <Indicador etiqueta={I.espera} valor={numero(espera.length)} />
        <Indicador etiqueta={I.pedidos} valor={numero(pedidos.length)} />
        <Indicador etiqueta={I.web} valor={numero(conNumero.filter((l) => l.beneficio === "web_app_50").length)} />
        <Indicador etiqueta={I.sistema} valor={numero(conNumero.filter((l) => l.beneficio === "sistema_2_meses").length)} />
        <Indicador
          etiqueta={I.tarjetas}
          valor={numero(tarjetas)}
          detalle={I.porVisita.replace("{n}", numero(conNumero.filter((l) => canalDe(l.perfil?.origen) === "visita").length))}
        />
      </div>

      <Bloque titulo={T.control.titulo}>
        <form action={cambiarPromoActiva} className="flex flex-col gap-4 border border-profundo p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <p className="flex items-center gap-3 font-lectura text-sm text-blanco">
            <span aria-hidden className={`size-2.5 shrink-0 ${config.activa ? "bg-blanco" : "border border-acero"}`} />
            {!config.desde ? T.control.sinAbrir : config.activa ? T.control.activa.replace("{desde}", config.desde.split("-").reverse().join("/")) : T.control.pausada}
          </p>
          <input type="hidden" name="activa" value={config.activa ? "no" : "si"} />
          <button type="submit" className="h-10 shrink-0 border border-profundo px-4 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
            {!config.desde ? T.control.abrir : config.activa ? T.control.pausar : T.control.reabrir}
          </button>
        </form>
      </Bloque>

      <Bloque titulo={T.embudo.titulo} nota={T.embudo.nota}>
        {embudo.length === 0 ? (
          <p className="border border-profundo p-5 font-lectura text-sm text-acero">{T.embudo.sinDatos}</p>
        ) : (
          <Barras
            titulo={T.embudo.titulo}
            unidad="visitas"
            filas={(Object.keys(T.embudo.pasos) as Array<keyof typeof T.embudo.pasos>).map((paso) => ({
              id: paso,
              etiqueta: T.embudo.pasos[paso],
              valor: embudo.find((e) => e.tipo === paso)?.visitas ?? 0,
            }))}
          />
        )}
        {embudo.some((e) => e.tipo === "cierre_cinta_promo") ? (
          <p className="font-plex text-xs text-acero">
            {T.embudo.cerraron}: {numero(embudo.find((e) => e.tipo === "cierre_cinta_promo")?.visitas ?? 0)}
          </p>
        ) : null}
      </Bloque>

      {conNumero.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Barras
            titulo={T.porRubro}
            filas={contar(conNumero, (l) => l.perfil?.nicho_id ?? "otro").map(([id, valor]) => ({ id, etiqueta: nombreNicho(id), valor, acento: acentoDe(id) }))}
          />
          <Barras titulo={T.porOrigen} filas={contar(conNumero, (l) => canalDe(l.perfil?.origen)).map(([id, valor]) => ({ id, etiqueta: id, valor }))} />
        </div>
      ) : null}

      <Bloque
        titulo={T.lista.titulo}
        acciones={
          <a
            href="/panel/primeros-100/exportar"
            className="inline-flex h-10 items-center gap-2 border border-profundo px-4 font-plex text-xs font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero"
          >
            <span aria-hidden className="size-1.5 bg-blanco" />
            {T.exportar}
          </a>
        }
      >
        {conNumero.length === 0 ? (
          <p className="border border-profundo p-5 font-lectura text-sm text-acero">{T.lista.vacio}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {conNumero.map((l) => (
              <FilaLugar key={l.id} lugar={l} nombreNicho={nombreNicho} />
            ))}
          </ul>
        )}
      </Bloque>

      {espera.length > 0 ? (
        <Bloque titulo={T.lista.espera}>
          <ul className="flex flex-col gap-2">
            {espera.map((l, i) => (
              <FilaSimple key={l.id} lugar={l} posicion={i + 1} nombreNicho={nombreNicho} />
            ))}
          </ul>
        </Bloque>
      ) : null}

      {pedidos.length > 0 ? (
        <Bloque titulo={T.lista.pedidos}>
          <ul className="flex flex-col gap-2">
            {pedidos.map((l) => (
              <FilaSimple key={l.id} lugar={l} nombreNicho={nombreNicho} />
            ))}
          </ul>
        </Bloque>
      ) : null}
    </>
  );
}

const CLASE_CONTROL = "h-10 border border-profundo bg-negro px-2 font-plex text-xs text-blanco focus:border-acero focus:outline-none";

/** Un lugar con número: quién es, qué eligió, en qué está, y los controles para seguirlo. */
function FilaLugar({ lugar, nombreNicho }: { lugar: LugarPanel; nombreNicho: (id: string) => string }) {
  const p = lugar.perfil;
  const C = T.lista.columnas;
  const mensaje = `Hola, ${p?.nombre ?? ""}. Te escribo de Quvant por tu lugar N° ${lugar.numero} de Primeros 100.`;
  const whatsapp = whatsappDe(p?.telefono, mensaje);
  return (
    <li className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <span className="titulo text-2xl tabular-nums text-blanco" aria-label={`${C.numero} ${lugar.numero}`}>
            {lugar.numero}
          </span>
          <div className="min-w-0">
            <p className="font-lectura text-[15px] font-semibold text-blanco">
              {[p?.nombre, p?.apellido].filter(Boolean).join(" ")}
              {p?.empresa ? <span className="font-normal text-acero"> · {p.empresa}</span> : null}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-plex text-xs text-acero">
              <span className="flex items-center gap-2">
                <PuntoRubro acento={p ? acentoDe(p.nicho_id) : undefined} />
                {p ? (p.nicho_id === "otro" && p.nicho_otro ? p.nicho_otro : nombreNicho(p.nicho_id)) : "—"}
              </span>
              {p?.ciudad ? <span>{p.ciudad}</span> : null}
              <span>{p?.email}</span>
              {p?.telefono ? <span>{p.telefono}</span> : null}
              <span>
                {C.origen}: {canalDe(p?.origen)}
              </span>
              {lugar.asignado_en ? <span>{fechaHora(lugar.asignado_en)}</span> : null}
              {lugar.es_prueba ? <span className="border border-profundo px-1.5 py-0.5 text-[10px] uppercase tracking-etiqueta">{T.lista.prueba}</span> : null}
            </p>
          </div>
        </div>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 border border-profundo px-4 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
            <span aria-hidden className="size-1.5 bg-[#7BD389]" />
            {T.lista.whatsapp}
          </a>
        ) : null}
      </div>
      <form action={guardarLugar} className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto] md:items-end">
        <input type="hidden" name="id" value={lugar.id} />
        <label className="flex flex-col gap-1.5">
          <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{C.estado}</span>
          <select name="estado" defaultValue={lugar.estado} className={CLASE_CONTROL}>
            {ESTADOS_EDITABLES.map((e) => (
              <option key={e} value={e}>
                {T.estados[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{C.beneficio}</span>
          <select name="beneficio" defaultValue={lugar.beneficio} className={CLASE_CONTROL}>
            {(Object.keys(BENEFICIO) as Array<keyof typeof BENEFICIO>).map((b) => (
              <option key={b} value={b}>
                {BENEFICIO[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-plex text-[11px] uppercase tracking-etiqueta text-acero">{T.lista.notas}</span>
          <input name="notas" defaultValue={lugar.notas ?? ""} maxLength={2000} className={`${CLASE_CONTROL} w-full text-sm`} />
        </label>
        <button type="submit" className="h-10 border border-profundo px-4 font-plex text-[11px] uppercase tracking-etiqueta text-blanco hover:border-acero">
          {T.lista.guardar}
        </button>
      </form>
    </li>
  );
}

/** Lista de espera y pedidos sin confirmar: quién, qué eligió y desde cuándo. */
function FilaSimple({ lugar, posicion, nombreNicho }: { lugar: LugarPanel; posicion?: number; nombreNicho: (id: string) => string }) {
  const p = lugar.perfil;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-profundo px-4 py-3 font-plex text-xs text-acero">
      {posicion ? <span className="tabular-nums text-blanco">{posicion}.</span> : null}
      <span className="font-lectura text-sm text-blanco">{[p?.nombre, p?.apellido].filter(Boolean).join(" ")}</span>
      <span>{p ? nombreNicho(p.nicho_id) : "—"}</span>
      <span>{BENEFICIO[lugar.beneficio]}</span>
      <span>{p?.email}</span>
      <span>{fecha(lugar.pedido_en)}</span>
    </li>
  );
}
