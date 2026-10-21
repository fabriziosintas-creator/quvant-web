"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Aviso, Campo, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { MOTIVOS_PERDIDA, type Etapa } from "@/comercial/comercial";
import { PANEL_ADMIN } from "@/datos/textos";
import { cargarActividad, crearOportunidad, editarOportunidad, moverEtapa, type EstadoForm } from "@/servidor/comercial/acciones";

/** Los formularios del seguimiento comercial: pensados para el celular. */

const T = PANEL_ADMIN.comercial;
const INICIAL: EstadoForm = { estado: "inicial" };

function Avisos({ estado }: { estado: EstadoForm }) {
  if (estado.estado === "error" && (estado.mensaje || estado.errores?.general)) return <Aviso tipo="error">{estado.mensaje ?? estado.errores?.general}</Aviso>;
  if (estado.estado === "listo" && estado.mensaje) return <Aviso tipo="listo">{estado.mensaje}</Aviso>;
  return null;
}

function Selector({ nombre, etiqueta, opciones, valor }: { nombre: string; etiqueta: string; opciones: Array<[string, string]>; valor?: string }) {
  return (
    <div>
      <label htmlFor={`com-${nombre}`} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <select id={`com-${nombre}`} name={nombre} defaultValue={valor} className={`${CLASE_CAMPO} bg-negro`}>
        {opciones.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

export type ValoresOportunidad = Partial<Record<"id" | "negocio" | "contacto" | "telefono" | "email" | "nicho" | "ciudad" | "valor_abono" | "valor_proyecto" | "probabilidad" | "responsable" | "proximo_paso" | "proximo_paso_fecha" | "perfil_id" | "local_id" | "conversacion_id", string>>;

/** Crear (sin id) o editar (con id) una oportunidad. */
export function FormOportunidad({ inicial, nichos }: { inicial: ValoresOportunidad; nichos: Array<{ id: string; nombre: string }> }) {
  const F = T.form;
  const router = useRouter();
  const editar = Boolean(inicial.id);
  const [estado, enviar, enviando] = useActionState(async (previo: EstadoForm, datos: FormData) => {
    const r = await (editar ? editarOportunidad : crearOportunidad)(previo, datos);
    if (r.estado === "listo" && r.id && !editar) router.push(`/panel/comercial/${r.id}`);
    return r;
  }, INICIAL);
  const e = estado.errores ?? {};
  const v = { ...inicial, ...(estado.valores ?? {}) };
  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      {(["id", "perfil_id", "local_id", "conversacion_id"] as const).map((c) => (inicial[c] ? <input key={c} type="hidden" name={c} value={inicial[c]} /> : null))}
      <Avisos estado={estado} />
      <div className="grid gap-4 md:grid-cols-2">
        <Campo name="negocio" etiqueta={F.negocio} defaultValue={v.negocio} required maxLength={160} error={e.negocio} />
        <Campo name="contacto" etiqueta={F.contacto} defaultValue={v.contacto} maxLength={120} />
        <Campo name="telefono" etiqueta={F.telefono} defaultValue={v.telefono} type="tel" inputMode="tel" maxLength={60} />
        <Campo name="email" etiqueta={F.email} defaultValue={v.email} type="email" maxLength={200} error={e.email} />
        <Selector nombre="nicho" etiqueta={F.nicho} valor={v.nicho ?? ""} opciones={[["", "—"], ...nichos.map((n) => [n.id, n.nombre] as [string, string])]} />
        <Campo name="ciudad" etiqueta={F.ciudad} defaultValue={v.ciudad} maxLength={120} />
        <Campo name="valor_abono" etiqueta={F.valorAbono} defaultValue={v.valor_abono} inputMode="decimal" error={e.valor_abono} />
        <Campo name="valor_proyecto" etiqueta={F.valorProyecto} defaultValue={v.valor_proyecto} inputMode="decimal" error={e.valor_proyecto} />
        <Campo name="probabilidad" etiqueta={F.probabilidad} defaultValue={v.probabilidad} inputMode="numeric" error={e.probabilidad} />
        <Selector nombre="responsable" etiqueta={F.responsable} valor={v.responsable ?? "fabrizio"} opciones={Object.entries(T.responsables)} />
        <Campo name="proximo_paso" etiqueta={F.proximoPaso} defaultValue={v.proximo_paso} maxLength={300} />
        <Campo name="proximo_paso_fecha" type="date" etiqueta={F.proximoPasoFecha} defaultValue={v.proximo_paso_fecha} error={e.proximo_paso_fecha} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? F.guardando : editar ? F.guardar : F.crear}
        </button>
      </div>
    </form>
  );
}

/** Cargar actividad: qué hiciste, cómo fue y el próximo paso. Menos de diez segundos. */
export function FormActividad({ oportunidadId }: { oportunidadId: string }) {
  const A = T.actividad;
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, enviar, enviando] = useActionState(cargarActividad, INICIAL);
  const e = estado.errores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") {
      formulario.current?.reset();
      router.refresh();
    }
  }, [estado, router]);
  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4">
      <input type="hidden" name="oportunidad_id" value={oportunidadId} />
      <Avisos estado={estado} />
      <fieldset>
        <legend className={CLASE_ETIQUETA}>{A.tipo}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {(["llamada", "mensaje", "reunion", "demo", "propuesta", "nota"] as const).map((t, i) => (
            <label key={t} className="flex min-h-11 cursor-pointer items-center justify-center border border-profundo px-2 text-center font-lectura text-xs text-acero has-[:checked]:border-blanco has-[:checked]:text-blanco">
              <input type="radio" name="tipo" value={t} defaultChecked={i === 0} className="sr-only" />
              {T.tipos[t]}
            </label>
          ))}
        </div>
        <ErrorCampo id="com-tipo-error" mensaje={e.tipo} />
      </fieldset>
      <Campo name="resultado" etiqueta={A.resultado} maxLength={500} error={e.resultado} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Campo name="proximo_paso" etiqueta={A.proximoPaso} maxLength={300} />
        <Campo name="proximo_paso_fecha" type="date" etiqueta={A.fecha} error={e.proximo_paso_fecha} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? T.form.guardando : A.guardar}
        </button>
      </div>
    </form>
  );
}

/** Mover de etapa desde la ficha (con motivo si se pierde). */
export function MoverEtapa({ id, actual }: { id: string; actual: Etapa }) {
  const F = T.ficha;
  const router = useRouter();
  const [etapa, setEtapa] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [detalle, setDetalle] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  return (
    <div className="flex flex-col gap-3 border border-profundo p-4">
      <p className={CLASE_ETIQUETA}>{F.mover}</p>
      <div className="flex flex-wrap gap-2">
        <select aria-label={F.mover} value={etapa} onChange={(e) => setEtapa(e.target.value)} className={`${CLASE_CAMPO} bg-negro sm:w-56`}>
          <option value="">—</option>
          {(Object.keys(T.etapas) as Etapa[])
            .filter((e) => e !== actual)
            .map((e) => (
              <option key={e} value={e}>
                {T.etapas[e]}
              </option>
            ))}
        </select>
        {etapa === "perdido" ? (
          <>
            <select aria-label={F.motivo} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${CLASE_CAMPO} bg-negro sm:w-52`}>
              <option value="">{F.motivo}</option>
              {MOTIVOS_PERDIDA.map((m) => (
                <option key={m} value={m}>
                  {T.motivos[m]}
                </option>
              ))}
            </select>
            <input aria-label={F.motivoTexto} placeholder={F.motivoTexto} value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={300} className={`${CLASE_CAMPO} sm:w-64`} />
          </>
        ) : null}
        <button
          type="button"
          disabled={!etapa || pendiente || (etapa === "perdido" && !motivo)}
          onClick={() =>
            iniciar(async () => {
              const r = await moverEtapa(id, etapa, motivo, detalle);
              setMensaje(r.mensaje ?? "");
              if (r.ok) {
                setEtapa("");
                router.refresh();
              }
            })
          }
          className={`${CLASE_BOTON_SECUNDARIO} h-12 px-5`}
        >
          {pendiente ? T.tablero.moviendo : F.moverBoton}
        </button>
      </div>
      {mensaje ? (
        <p role="status" className="font-plex text-xs text-blanco">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
