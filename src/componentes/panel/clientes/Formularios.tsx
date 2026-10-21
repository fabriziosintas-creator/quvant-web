"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Aviso, Campo, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { MEDIOS_CONSTANCIA, MOTIVOS_BAJA, modulosDe } from "@/clientes/clientes";
import { PANEL_ADMIN } from "@/datos/textos";
import { cambiarPermisoMetricas, crearClienteSistema, darDeBaja, type EstadoCliente } from "@/servidor/clientes/acciones";
import type { Plantilla } from "../../../../medicion-sistema/catalogo";

/** Los formularios de Clientes: alta, permiso de métricas y baja. Pensados para el celular. */

const T = PANEL_ADMIN.clientesSistema;
const INICIAL: EstadoCliente = { estado: "inicial" };
const PLANTILLAS_NUCLEO: Record<string, Plantilla> = { industria: "industria", gimnasios: "gimnasios", holistica: "holistica", kioscos: "kioscos", pymes: "pymes", inmobiliarias: "inmobiliarias", supermercados: "supermercados" };

function Avisos({ estado }: { estado: EstadoCliente }) {
  if (estado.estado === "error" && (estado.mensaje || estado.errores?.general)) return <Aviso tipo="error">{estado.mensaje ?? estado.errores?.general}</Aviso>;
  if (estado.estado === "listo" && estado.mensaje) return <Aviso tipo="listo">{estado.mensaje}</Aviso>;
  return null;
}

function Selector({ nombre, etiqueta, opciones, valor, alCambiar, error }: { nombre: string; etiqueta: string; opciones: Array<[string, string]>; valor?: string; alCambiar?: (v: string) => void; error?: string }) {
  return (
    <div>
      <label htmlFor={`cli-${nombre}`} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <select id={`cli-${nombre}`} name={nombre} defaultValue={valor} onChange={alCambiar ? (e) => alCambiar(e.target.value) : undefined} className={`${CLASE_CAMPO} bg-negro`}>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <ErrorCampo id={`cli-${nombre}-error`} mensaje={error} />
    </div>
  );
}

export type ValoresCliente = Partial<Record<"nombre" | "nucleo" | "abono" | "responsable" | "oportunidad_id" | "local_id" | "plantilla_id", string>>;

/** "Nuevo cliente": un solo formulario para el día que se cierra la venta. */
export function FormNuevoCliente({ inicial, nucleos, enlaces, hoy }: { inicial: ValoresCliente; nucleos: Array<{ id: string; nombre: string }>; enlaces: string[]; hoy: string }) {
  const F = T.form;
  const [estado, enviar, enviando] = useActionState(crearClienteSistema, INICIAL);
  const e = estado.errores ?? {};
  const v = { ...inicial, ...(estado.valores ?? {}) };
  const [nucleo, setNucleo] = useState(v.nucleo ?? nucleos[0]?.id ?? "industria");
  const modulos = modulosDe(PLANTILLAS_NUCLEO[nucleo] ?? "industria");
  const M = T.modulos as Record<string, string>;
  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-6 border border-profundo p-4 md:p-5">
      {(["oportunidad_id", "local_id", "plantilla_id"] as const).map((c) => (inicial[c] ? <input key={c} type="hidden" name={c} value={inicial[c]} /> : null))}
      {enlaces.map((t) => (
        <Aviso key={t} tipo="nota">
          {t}
        </Aviso>
      ))}
      <Avisos estado={estado} />
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">{F.seccionCliente}</legend>
        <Campo name="nombre" etiqueta={F.nombre} defaultValue={v.nombre} required maxLength={160} error={e.nombre} />
        <Selector nombre="nucleo" etiqueta={F.nicho} valor={nucleo} alCambiar={setNucleo} opciones={nucleos.map((n) => [n.id, n.nombre])} error={e.nucleo} />
        <Selector nombre="responsable" etiqueta={F.responsable} valor={v.responsable ?? "fabrizio"} opciones={Object.entries(PANEL_ADMIN.comercial.responsables)} />
        <Campo name="alta" type="date" etiqueta={F.alta} defaultValue={hoy} max={hoy} error={e.alta} />
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">{F.seccionSistema}</legend>
        <div className="md:col-span-2">
          <Campo name="organizacion" etiqueta={F.organizacion} ayuda={F.organizacionAyuda} required maxLength={120} autoComplete="off" spellCheck={false} error={e.organizacion} />
        </div>
        <Selector nombre="plan" etiqueta={F.plan} valor="negocio" opciones={[["negocio", T.planes.negocio], ["multinegocio", T.planes.multinegocio], ["", T.planes.sin]]} />
        <div className="grid grid-cols-2 gap-4">
          <Campo name="sucursales" etiqueta={F.sucursales} defaultValue="1" inputMode="numeric" error={e.sucursales} />
          <Campo name="usuarios" etiqueta={F.usuarios} defaultValue="1" inputMode="numeric" error={e.usuarios} />
        </div>
        <div className="md:col-span-2">
          <p className={CLASE_ETIQUETA}>{F.modulos}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {modulos.map((m) => (
              <label key={`${nucleo}-${m}`} className="flex min-h-11 cursor-pointer items-center gap-2 border border-profundo px-3 font-lectura text-xs text-acero has-[:checked]:border-blanco has-[:checked]:text-blanco">
                <input type="checkbox" name="modulos" value={m} defaultChecked className="size-4 accent-blanco" />
                {M[m] ?? m}
              </label>
            ))}
          </div>
          <p className="mt-2 font-plex text-xs text-acero">{F.modulosAyuda}</p>
        </div>
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">{F.seccionCobro}</legend>
        <Campo name="abono" etiqueta={F.abono} defaultValue={v.abono} inputMode="decimal" error={e.abono} />
      </fieldset>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? PANEL_ADMIN.comercial.form.guardando : F.guardar}
        </button>
      </div>
    </form>
  );
}

/** Prender con constancia o apagar el permiso de compartir métricas. */
export function FormPermiso({ clienteId, prendido, hoy }: { clienteId: string; prendido: boolean; hoy: string }) {
  const P = T.metricas;
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [estado, enviar, enviando] = useActionState(cambiarPermisoMetricas, INICIAL);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") router.refresh();
  }, [estado, router]);
  if (!abierto || estado.estado === "listo") {
    return (
      <div className="flex flex-col gap-3">
        <Avisos estado={estado} />
        <div>
          <button type="button" onClick={() => setAbierto(true)} className={prendido ? CLASE_BOTON_SECUNDARIO : CLASE_BOTON}>
            {prendido ? P.apagar : P.prender}
          </button>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="accion" value={prendido ? "apagado" : "prendido"} />
      <Avisos estado={estado} />
      <div className="grid gap-4 md:grid-cols-2">
        <Campo name="fecha" type="date" etiqueta={prendido ? P.fechaApagar : P.fecha} defaultValue={v.fecha ?? hoy} max={hoy} error={e.fecha} />
        <Campo name="quien" etiqueta={P.quien} defaultValue={v.quien} maxLength={160} error={e.quien} />
        <Selector nombre="medio" etiqueta={P.medio} valor={v.medio ?? "contrato"} opciones={MEDIOS_CONSTANCIA.map((m) => [m, P.medios[m]])} error={e.medio} />
        <Campo name="detalle" etiqueta={P.detalle} defaultValue={v.detalle} maxLength={500} error={e.detalle} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {prendido ? P.apagar : P.prender}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className={CLASE_BOTON_SECUNDARIO}>
          {T.cancelar}
        </button>
      </div>
    </form>
  );
}

/** Dar de baja con fecha y motivo (lista cerrada). */
export function FormBaja({ clienteId, hoy }: { clienteId: string; hoy: string }) {
  const B = T.baja;
  const router = useRouter();
  const [estado, enviar, enviando] = useActionState(darDeBaja, INICIAL);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") router.refresh();
  }, [estado, router]);
  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <Avisos estado={estado} />
      <div className="grid gap-4 md:grid-cols-3">
        <Campo name="fecha" type="date" etiqueta={B.fecha} defaultValue={v.fecha ?? hoy} error={e.fecha} />
        <Selector nombre="motivo" etiqueta={B.motivo} valor={v.motivo ?? ""} opciones={[["", "—"], ...MOTIVOS_BAJA.map((m) => [m, B.motivos[m]] as [string, string])]} error={e.motivo} />
        <Campo name="nota" etiqueta={B.nota} defaultValue={v.nota} maxLength={500} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
          {B.confirmar}
        </button>
      </div>
    </form>
  );
}
