"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Aviso, Campo, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { CUENTA, PANEL_ADMIN } from "@/datos/textos";
import { METRICAS } from "@/objetivos/catalogo";
import type { Meta } from "@/objetivos/tipos";
import { cargarAvance, cargarCobro, cargarPlan, cargarTipoCambio, cerrarPeriodosAhora, guardarMeta, type EstadoForm } from "@/servidor/objetivos/acciones";

/**
 * Los formularios de Objetivos. Pensados para el celular: cargar un cobro o
 * un avance en menos de quince segundos (fecha de hoy, lo justo y un botón).
 */

const T = PANEL_ADMIN.objetivos;
const INICIAL: EstadoForm = { estado: "inicial" };

function Avisos({ estado }: { estado: EstadoForm }) {
  if (estado.estado === "error" && (estado.mensaje || estado.errores?.general)) return <Aviso tipo="error">{estado.mensaje ?? estado.errores?.general}</Aviso>;
  if (estado.estado === "listo" && estado.mensaje) return <Aviso tipo="listo">{estado.mensaje}</Aviso>;
  return null;
}

function Selector({ id, nombre, etiqueta, opciones, valor, error, alCambiar }: { id: string; nombre: string; etiqueta: string; opciones: Array<[string, string]>; valor?: string; error?: string; alCambiar?: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <select id={id} name={nombre} defaultValue={alCambiar ? undefined : valor} value={alCambiar ? valor : undefined} onChange={alCambiar ? (e) => alCambiar(e.target.value) : undefined} aria-invalid={error ? true : undefined} className={`${CLASE_CAMPO} bg-negro`}>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <ErrorCampo id={`${id}-error`} mensaje={error} />
    </div>
  );
}

function Casilla({ nombre, etiqueta, marcada }: { nombre: string; etiqueta: string; marcada?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3 font-plex text-sm text-blanco">
      <input type="checkbox" name={nombre} defaultChecked={marcada} className="size-4 accent-[#ECECEE]" />
      {etiqueta}
    </label>
  );
}

// ── Cobro ─────────────────────────────────────────────────────────────
export function FormCobro({ clientes, nichos }: { clientes: string[]; nichos: Array<{ id: string; nombre: string }> }) {
  const F = T.facturacion;
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, enviar, enviando] = useActionState(cargarCobro, INICIAL);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") formulario.current?.reset();
  }, [estado]);
  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      <Avisos estado={estado} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo name="fecha" type="date" etiqueta={F.fecha} defaultValue={v.fecha ?? hoyEnBuenosAires()} required error={e.fecha} />
        <Campo name="cliente" etiqueta={F.cliente} defaultValue={v.cliente} list="cobro-clientes" required maxLength={160} autoComplete="off" error={e.cliente} />
        <datalist id="cobro-clientes">
          {clientes.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Selector id="cobro-tipo" nombre="tipo" etiqueta={F.tipo} valor={v.tipo ?? "abono_mensual"} error={e.tipo} opciones={Object.entries(F.tipos)} />
        <Campo name="monto" etiqueta={F.monto} defaultValue={v.monto} inputMode="decimal" required ayuda={F.montoAyuda} error={e.monto} />
        <Selector id="cobro-nicho" nombre="nicho" etiqueta={F.nicho} valor={v.nicho ?? ""} opciones={[["", "—"], ...nichos.map((n) => [n.id, n.nombre] as [string, string])]} />
        <Campo name="factura" etiqueta={F.factura} defaultValue={v.factura} maxLength={60} />
      </div>
      <Campo name="nota" etiqueta={F.nota} defaultValue={v.nota} maxLength={500} />
      <div className="flex flex-wrap gap-x-6">
        <Casilla nombre="cobrado" etiqueta={F.cobrado} marcada />
        <Casilla nombre="iva" etiqueta={F.iva} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? F.guardando : F.guardar}
        </button>
      </div>
    </form>
  );
}

// ── Tipo de cambio ────────────────────────────────────────────────────
export function FormTipoCambio({ mes, actual }: { mes: string; actual: number | null }) {
  const F = T.facturacion;
  const [estado, enviar, enviando] = useActionState(cargarTipoCambio, INICIAL);
  const e = estado.errores ?? {};
  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      <Avisos estado={estado} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo name="mes" type="month" etiqueta={F.mes} defaultValue={mes} required error={e.mes} />
        <Campo name="pesos" etiqueta={F.pesosPorDolar} defaultValue={actual ? String(actual).replace(".", ",") : ""} inputMode="decimal" required error={e.pesos} />
        <Campo name="fuente" etiqueta={F.fuente} placeholder={F.fuenteMarcador} maxLength={120} error={e.fuente} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON_SECUNDARIO + " h-11 px-5"}>
          {enviando ? F.guardando : F.guardarTipoCambio}
        </button>
      </div>
    </form>
  );
}

// ── Avance manual ─────────────────────────────────────────────────────
export function FormAvance({ metaId }: { metaId: string }) {
  const D = T.detalle;
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, enviar, enviando] = useActionState(cargarAvance, INICIAL);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") formulario.current?.reset();
  }, [estado]);
  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      <input type="hidden" name="meta_id" value={metaId} />
      <Avisos estado={estado} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <Campo name="fecha" type="date" etiqueta={D.fecha} defaultValue={v.fecha ?? hoyEnBuenosAires()} required error={e.fecha} />
        <Campo name="valor" etiqueta={D.valor} defaultValue={v.valor} inputMode="decimal" required error={e.valor} />
        <Campo name="nota" etiqueta={D.nota} defaultValue={v.nota} maxLength={500} error={e.nota} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? D.guardando : D.cargarAvance}
        </button>
      </div>
    </form>
  );
}

// ── Crear o editar un objetivo ────────────────────────────────────────
export function FormMeta({ meta, nichos }: { meta?: Meta; nichos: Array<{ id: string; nombre: string }> }) {
  const F = T.form;
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(async (previo: EstadoForm, datos: FormData) => {
    const r = await guardarMeta(previo, datos);
    if (r.estado === "listo" && r.id) router.push(`/panel/objetivos/${r.id}`);
    return r;
  }, INICIAL);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  const [clave, setClave] = useState(v.metrica ?? meta?.metrica ?? "registros");
  const [periodo, setPeriodo] = useState(v.tipo_periodo ?? meta?.tipoPeriodo ?? "mes");
  const metrica = useMemo(() => METRICAS.find((m) => m.clave === clave) ?? METRICAS[0], [clave]);
  const [meta0, setMeta0] = useState(v.meta ?? (meta ? String(meta.meta) : ""));
  const cambiaMeta = meta !== undefined && meta0 !== "" && Number(meta0.replace(/\./g, "").replace(",", ".")) !== meta.meta;

  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-5 border border-profundo p-4 md:p-6">
      {meta ? <input type="hidden" name="id" value={meta.id} /> : null}
      <Avisos estado={estado} />
      <div className="grid gap-4 md:grid-cols-2">
        <Campo name="nombre" etiqueta={F.nombre} defaultValue={v.nombre ?? meta?.nombre} required maxLength={160} error={e.nombre} />
        <Campo name="descripcion" etiqueta={F.descripcion} defaultValue={v.descripcion ?? meta?.descripcion ?? ""} maxLength={500} error={e.descripcion} />
      </div>

      <div>
        <Selector id="meta-metrica" nombre="metrica" etiqueta={F.metrica} valor={clave} alCambiar={setClave} error={e.metrica} opciones={METRICAS.map((m) => [m.clave, m.nombre])} />
        <p className="mt-2 font-plex text-xs leading-relaxed text-acero">{metrica.explicacion}</p>
      </div>

      {metrica.filtros.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {metrica.filtros.includes("nicho") ? (
            <Selector id="meta-filtro-nicho" nombre="filtro_nicho" etiqueta={F.filtroNicho} valor={meta?.filtros.nicho ?? ""} opciones={[["", F.sinFiltro], ...nichos.map((n) => [n.id, n.nombre] as [string, string])]} />
          ) : null}
          {metrica.filtros.includes("socio") ? <Selector id="meta-filtro-socio" nombre="filtro_socio" etiqueta={F.filtroSocio} valor={meta?.filtros.socio ?? ""} opciones={[["", F.sinFiltro], ["fabrizio", T.responsables.fabrizio], ["michel", T.responsables.michel]]} /> : null}
          {metrica.filtros.includes("tipo") ? <Selector id="meta-filtro-tipo" nombre="filtro_tipo" etiqueta={F.filtroTipo} valor={meta?.filtros.tipo ?? ""} opciones={[["", F.sinFiltro], ...Object.entries(T.facturacion.tipos)]} /> : null}
          {metrica.filtros.includes("objetivo") ? (
            <Selector id="meta-filtro-objetivo" nombre="filtro_objetivo" etiqueta={F.filtroObjetivo} valor={meta?.filtros.objetivo ?? ""} opciones={[["", F.sinFiltro], ...CUENTA.objetivos.map((o) => [o.id, o.texto] as [string, string])]} />
          ) : null}
        </div>
      ) : null}

      {!metrica.automatica ? (
        <fieldset className="grid gap-4 md:grid-cols-3">
          <legend className="mb-2 font-plex text-[11px] uppercase tracking-etiqueta text-acero">{F.soloManual}</legend>
          <Selector id="meta-unidad" nombre="unidad" etiqueta={F.unidad} valor={v.unidad ?? meta?.unidad ?? "numero"} opciones={Object.entries(T.unidades)} />
          <Selector id="meta-acumulacion" nombre="acumulacion" etiqueta={F.acumulacion} valor={v.acumulacion ?? meta?.acumulacion ?? "suma_del_periodo"} opciones={Object.entries(T.acumulaciones)} />
          <Selector id="meta-direccion" nombre="direccion" etiqueta={F.direccion} valor={v.direccion ?? meta?.direccion ?? "mas_es_mejor"} opciones={Object.entries(T.direcciones)} />
        </fieldset>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Selector id="meta-area" nombre="area" etiqueta={F.area} valor={v.area ?? meta?.area ?? metrica.area} opciones={Object.entries(T.areas)} />
        <Selector id="meta-etapa" nombre="etapa" etiqueta={F.etapa} valor={v.etapa ?? meta?.etapa ?? "libre"} opciones={Object.entries(T.etapas).filter(([k]) => k !== "todas")} />
        <Selector id="meta-responsable" nombre="responsable" etiqueta={F.responsable} valor={v.responsable ?? meta?.responsable ?? "los_dos"} opciones={Object.entries(T.responsables)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Selector id="meta-periodo" nombre="tipo_periodo" etiqueta={F.tipoPeriodo} valor={periodo} alCambiar={setPeriodo} opciones={Object.entries(T.periodos)} />
        {periodo === "mes" ? (
          <Campo name="mes" type="month" etiqueta={F.mes} defaultValue={v.mes ?? (meta ? meta.desde.slice(0, 7) : hoyEnBuenosAires().slice(0, 7))} required error={e.periodo} />
        ) : (
          <>
            <Campo name="desde" type="date" etiqueta={F.desde} defaultValue={v.desde ?? meta?.desde} required error={e.periodo} />
            <Campo name="hasta" type="date" etiqueta={F.hasta} defaultValue={v.hasta ?? meta?.hasta} required />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="meta-meta" className={CLASE_ETIQUETA}>
            {F.meta}
          </label>
          <input id="meta-meta" name="meta" value={meta0} onChange={(ev) => setMeta0(ev.target.value)} inputMode="decimal" required aria-invalid={e.meta ? true : undefined} className={CLASE_CAMPO} />
          <ErrorCampo id="meta-meta-error" mensaje={e.meta} />
        </div>
        <Campo name="orden" etiqueta={F.orden} defaultValue={v.orden ?? (meta ? String(meta.orden) : "")} inputMode="numeric" />
      </div>

      {/* Al editar: si cambia la meta o el período, el motivo es obligatorio (lo controla también el servidor). */}
      {meta ? <Campo name="motivo" etiqueta={F.motivo} ayuda={F.motivoAyuda} defaultValue={v.motivo} required={cambiaMeta} maxLength={500} error={e.motivo} /> : null}

      <Casilla nombre="se_repite" etiqueta={F.seRepite} marcada={meta?.seRepite} />

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? F.guardando : F.guardar}
        </button>
        <button type="button" onClick={() => router.back()} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {F.cancelar}
        </button>
      </div>
    </form>
  );
}

// ── Plan inicial ──────────────────────────────────────────────────────
export function FormPlan({ children }: { children: React.ReactNode }) {
  const P = T.plan;
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(async (previo: EstadoForm, datos: FormData) => {
    const r = await cargarPlan(previo, datos);
    if (r.estado === "listo") router.refresh();
    return r;
  }, INICIAL);
  return (
    <form action={enviar} className="flex flex-col gap-5">
      <Avisos estado={estado} />
      {children}
      <div className="sticky bottom-0 -mx-4 border-t border-profundo bg-negro/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? P.cargando : P.cargar}
        </button>
      </div>
    </form>
  );
}

// ── Cerrar período a mano ─────────────────────────────────────────────
export function BotonCerrar() {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await cerrarPeriodosAhora();
            setMensaje(r.mensaje);
          })
        }
        className={`${CLASE_BOTON_SECUNDARIO} h-10 px-4 text-xs`}
      >
        {pendiente ? T.acciones.cerrando : T.acciones.cerrar}
      </button>
      <p aria-live="polite" className="font-plex text-xs text-acero">
        {mensaje}
      </p>
    </div>
  );
}
