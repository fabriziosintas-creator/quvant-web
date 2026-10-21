"use client";

import { useActionState, useEffect, useRef } from "react";
import { Aviso, Campo, Casilla, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import { cargarVisita, type EstadoFormulario } from "@/servidor/panel/locales";
import type { Admin } from "@/servidor/panel/mapa";
import { conCola } from "@/sinconexion/sincronizador";

const T = PANEL_ADMIN.mapa;
const INICIAL: EstadoFormulario = { estado: "inicial" };

/**
 * Cargar una visita en menos de quince segundos, desde el celular: fecha
 * (hoy), quién fue (quien está logueado), cómo nos fue en tres botones
 * grandes, si volver, y dos renglones opcionales.
 */
export function FormularioVisita({ localId, nombreLocal, admins, yo, alGuardar }: { localId: string; nombreLocal: string; admins: Admin[]; yo: string; alGuardar?: () => void }) {
  // Sin señal se guarda en el teléfono y se manda sola al volver (con su clave única: no se duplica).
  const [estado, enviar, enviando] = useActionState(
    conCola("visita", cargarVisita, () => PANEL_ADMIN.sinSenal.tituloVisita.replace("{n}", nombreLocal), { estado: "listo", mensaje: PANEL_ADMIN.sinSenal.guardado, localId } as EstadoFormulario),
    INICIAL,
  );
  const formulario = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") {
      formulario.current?.reset();
      alGuardar?.();
    }
  }, [estado, alGuardar]);

  const opcion = (name: string, valor: string, texto: string, marcado: boolean) => (
    <label
      key={valor}
      className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-profundo px-3 font-lectura text-sm text-acero transition-colors has-[:checked]:border-blanco has-[:checked]:text-blanco"
    >
      <input type="radio" name={name} value={valor} defaultChecked={marcado} className="peer sr-only" />
      <span aria-hidden className="size-2 border border-acero peer-checked:bg-blanco" />
      {texto}
    </label>
  );

  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="local_id" value={localId} />
      {estado.estado === "error" && (estado.mensaje || e.general) ? <Aviso tipo="error">{estado.mensaje ?? e.general}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo name="fecha" type="date" etiqueta={T.visita.fecha} defaultValue={v.fecha ?? hoyEnBuenosAires()} required error={e.fecha} />
        <div>
          <label htmlFor={`visita-quien-${localId}`} className={CLASE_ETIQUETA}>
            {T.visita.quien}
          </label>
          <select id={`visita-quien-${localId}`} name="visitante" defaultValue={v.visitante ?? yo} className={CLASE_CAMPO} aria-invalid={e.visitante ? true : undefined}>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
                {a.apellido ? ` ${a.apellido}` : ""}
              </option>
            ))}
          </select>
          <ErrorCampo id={`visita-quien-${localId}-error`} mensaje={e.visitante} />
        </div>
      </div>

      <fieldset>
        <legend className={CLASE_ETIQUETA}>{T.visita.feedback}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["bueno", "regular", "malo"] as const).map((f) => opcion("feedback", f, T.feedback[f], v.feedback === f))}
        </div>
        <ErrorCampo id={`visita-feedback-${localId}-error`} mensaje={e.feedback} />
      </fieldset>

      <fieldset>
        <legend className={CLASE_ETIQUETA}>{T.visita.volver}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["si", "mas_adelante", "no"] as const).map((o) => opcion("volver", o, T.volver[o], v.volver === o))}
        </div>
      </fieldset>

      <Campo name="nota" etiqueta={T.visita.nota} defaultValue={v.nota} maxLength={2000} />
      <Campo name="mostrado" etiqueta={T.visita.mostrado} defaultValue={v.mostrado} maxLength={200} list={`visita-mostrado-${localId}`} />
      <datalist id={`visita-mostrado-${localId}`}>
        {T.visita.mostradoOpciones.map((opcion) => (
          <option key={opcion} value={opcion} />
        ))}
      </datalist>
      <Casilla name="tarjeta_promo">{T.visita.tarjeta}</Casilla>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo name="siguiente" etiqueta={T.visita.siguiente} defaultValue={v.siguiente} maxLength={500} />
        <Campo name="proxima" type="date" etiqueta={T.visita.proxima} defaultValue={v.proxima} error={e.proxima} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? T.visita.guardando : T.visita.guardar}
        </button>
      </div>
    </form>
  );
}
