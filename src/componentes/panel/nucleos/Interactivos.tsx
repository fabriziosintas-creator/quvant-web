"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Aviso, Campo, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import type { Alerta } from "@/nucleos/tipos";
import { actualizarAhora, cambiarEstadoAlerta, pedirAnalisis, registrarAcompanamiento } from "@/servidor/nucleos/acciones";
import type { AnalisisCliente } from "@/servidor/nucleos/claude";
import type { ResultadoProceso } from "@/servidor/nucleos/proceso";
import { CLASE_BOTON_PANEL, CLASE_BOTON_PANEL_2 } from "./comunes";

const T = PANEL_ADMIN.nucleos;

/** "Actualizar ahora": corre el proceso diario con la sesión del admin. */
export function BotonActualizar() {
  const [pendiente, empezar] = useTransition();
  const [resultado, setResultado] = useState<ResultadoProceso | { error: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => empezar(async () => {
          try {
            setResultado(await actualizarAhora());
          } catch {
            setResultado({ error: T.actualizar.error });
          }
        })}
        className={CLASE_BOTON_PANEL_2}
      >
        <span aria-hidden className="size-1.5 bg-blanco" />
        {pendiente ? T.actualizar.corriendo : T.actualizar.boton}
      </button>
      {resultado ? (
        <p role="status" className="font-plex text-xs text-acero">
          {"error" in resultado ? resultado.error : resultado.modoEjemplo ? T.actualizar.ejemplo : T.actualizar.listo.replace("{fotos}", String(resultado.fotosGuardadas)).replace("{alertas}", String(resultado.alertasNuevas))}
        </p>
      ) : null}
    </div>
  );
}

/** Las acciones sobre una alerta (marcar vista, resolver, descartar). */
export function AccionesAlerta({ alerta }: { alerta: Alerta }) {
  const A = T.alertas.acciones;
  const boton = (estado: "vista" | "resuelta" | "descartada", texto: string) => (
    <form action={cambiarEstadoAlerta}>
      <input type="hidden" name="id" value={alerta.id} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" className="font-plex text-[11px] uppercase tracking-etiqueta text-acero hover:text-blanco">{texto}</button>
    </form>
  );
  return (
    <div className="flex flex-wrap items-center gap-3">
      {alerta.estado === "nueva" ? boton("vista", A.ver) : null}
      {boton("resuelta", A.resolver)}
      {boton("descartada", A.descartar)}
    </div>
  );
}

const INICIAL = { estado: "inicial" as const };

/** Cargar un acompañamiento en menos de 15 segundos. */
export function FormularioAcompanamiento({ clienteId, alertas }: { clienteId: string; alertas: Alerta[] }) {
  const [estado, enviar, enviando] = useActionState(registrarAcompanamiento, INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.estado === "listo") formulario.current?.reset();
  }, [estado]);
  const C = T.cliente;
  return (
    <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-4 border border-profundo p-4 md:p-5">
      <input type="hidden" name="clienteId" value={clienteId} />
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      <fieldset>
        <legend className={CLASE_ETIQUETA}>{C.campos.tipo}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(C.tiposAcomp).map(([id, nombre], i) => (
            <label key={id} className="flex min-h-11 cursor-pointer items-center gap-2 border border-profundo px-3 py-2 font-lectura text-sm text-acero has-[:checked]:border-blanco has-[:checked]:text-blanco">
              <input type="radio" name="tipo" value={id} defaultChecked={i === 0} className="sr-only" />
              {nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo name="fecha" type="date" etiqueta={C.campos.fecha} defaultValue={hoyEnBuenosAires()} />
        <div>
          <label htmlFor="acomp-alerta" className={CLASE_ETIQUETA}>{C.campos.alerta}</label>
          <select id="acomp-alerta" name="alertaId" defaultValue="" className={CLASE_CAMPO}>
            <option value="">{C.ninguna}</option>
            {alertas.map((a) => (
              <option key={a.id} value={a.id}>{T.alertas.tipos[a.tipo]}{a.funcionClave ? ` · ${a.funcionClave}` : ""}</option>
            ))}
          </select>
          <ErrorCampo id="acomp-alerta-error" />
        </div>
      </div>
      <Campo name="nota" etiqueta={C.campos.nota} maxLength={2000} />
      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON_PANEL}>{enviando ? C.registrando : C.registrar}</button>
      </div>
    </form>
  );
}

/** El bloque de Claude: pide el análisis y muestra resumen, riesgo, correcciones y el borrador editable. */
export function BloqueClaude({ clienteId }: { clienteId: string }) {
  const [pendiente, empezar] = useTransition();
  const [analisis, setAnalisis] = useState<AnalisisCliente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [copiado, setCopiado] = useState(false);
  const K = T.claude;

  const pedir = () =>
    empezar(async () => {
      setError(null);
      const r = await pedirAnalisis(clienteId);
      if ("error" in r) setError(r.error);
      else {
        setAnalisis(r);
        setMensaje(r.mensaje);
      }
    });

  return (
    <section className="flex flex-col gap-5 border border-profundo p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">
            <span aria-hidden className="size-1.5 bg-blanco" />
            {K.titulo}
          </h2>
          <p className="mt-2 max-w-2xl font-lectura text-sm leading-relaxed text-acero">{K.nota}</p>
        </div>
        <button type="button" onClick={pedir} disabled={pendiente} className={CLASE_BOTON_PANEL}>{pendiente ? K.pidiendo : K.pedir}</button>
      </div>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      {analisis ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            {analisis.ejemplo ? <Aviso tipo="nota">{K.ejemplo}</Aviso> : null}
            <div>
              <p className={CLASE_ETIQUETA}>{K.resumen}</p>
              <ul className="flex flex-col gap-1.5 font-lectura text-[15px] leading-relaxed text-blanco">
                {analisis.resumen.map((linea, i) => (
                  <li key={i} className="flex gap-3"><span aria-hidden className="mt-2.5 size-1.5 shrink-0 bg-acero" />{linea}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={CLASE_ETIQUETA}>{K.riesgo}</p>
              <p className="font-lectura text-[15px] leading-relaxed text-blanco">{analisis.riesgo}</p>
            </div>
            <div>
              <p className={CLASE_ETIQUETA}>{K.correcciones}</p>
              <ul className="flex flex-col gap-2">
                {analisis.correcciones.map((c, i) => (
                  <li key={i} className="flex flex-col gap-1 border border-profundo p-3">
                    <span className="font-plex text-[10px] uppercase tracking-etiqueta text-acero">{K.tiposCorreccion[c.tipo]}</span>
                    <span className="font-lectura text-sm leading-relaxed text-blanco">{c.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-plex text-[11px] text-acero">{K.modelo}: {analisis.modelo}</p>
          </div>
          <div className="flex flex-col gap-3">
            <label htmlFor="claude-mensaje" className={CLASE_ETIQUETA}>{K.mensaje}</label>
            <textarea id="claude-mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={10} className={`${CLASE_CAMPO} resize-y font-lectura`} />
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={CLASE_BOTON_PANEL_2}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mensaje);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  } catch {
                    /* sin portapapeles: el texto queda seleccionable */
                  }
                }}
              >
                {K.copiar}
              </button>
              {copiado ? <span role="status" className="font-plex text-xs text-acero">{K.copiado}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
