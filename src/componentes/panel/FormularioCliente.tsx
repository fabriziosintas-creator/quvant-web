"use client";

import { useActionState, useEffect, useRef } from "react";
import { Aviso, Campo, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import { agregarCliente, type EstadoClientes } from "@/servidor/panel/clientes";

const T = PANEL_ADMIN.clientes;
const INICIAL: EstadoClientes = { estado: "inicial" };

/** Cargar un cliente por plantilla desde el celular: empresa, rubro, estado, abono, fecha y notas. */
export function FormularioCliente({ nichos }: { nichos: Array<{ id: string; nombre: string }> }) {
  const [estado, enviar, enviando] = useActionState(agregarCliente, INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  useEffect(() => {
    if (estado.estado === "listo") formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-5 border border-profundo p-4 md:p-5">
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Campo name="empresa" etiqueta={T.campos.empresa} defaultValue={v.empresa} maxLength={160} required error={e.empresa} />
        <div>
          <label htmlFor="cliente-nicho" className={CLASE_ETIQUETA}>
            {T.campos.nicho}
          </label>
          <select id="cliente-nicho" name="nicho" defaultValue={v.nicho ?? ""} required aria-invalid={e.nicho ? true : undefined} className={CLASE_CAMPO}>
            <option value="">—</option>
            {nichos.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
          <ErrorCampo id="cliente-nicho-error" mensaje={e.nicho} />
        </div>
        <div>
          <label htmlFor="cliente-estado" className={CLASE_ETIQUETA}>
            {T.campos.estado}
          </label>
          <select id="cliente-estado" name="estado" defaultValue={v.estado ?? "demo_mostrada"} className={CLASE_CAMPO}>
            {Object.entries(PANEL_ADMIN.plantillas.estadosCliente).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
          <ErrorCampo id="cliente-estado-error" mensaje={e.estado} />
        </div>
        <Campo name="abono" type="text" inputMode="decimal" etiqueta={T.campos.abono} placeholder="0" defaultValue={v.abono} error={e.abono} />
        <Campo name="fecha" type="date" etiqueta={T.campos.fecha} defaultValue={v.fecha ?? hoyEnBuenosAires()} required error={e.fecha} />
        <Campo name="notas" etiqueta={T.campos.notas} defaultValue={v.notas} maxLength={2000} />
      </div>
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? T.agregando : T.agregar}
        </button>
      </div>
    </form>
  );
}
