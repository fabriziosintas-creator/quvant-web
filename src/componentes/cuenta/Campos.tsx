"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { CUENTA } from "@/datos/textos";
import { CLASE_CAMPO, CLASE_ETIQUETA } from "./estilos";

/**
 * Las piezas de los formularios de cuenta, con el mismo estilo que el
 * formulario de contacto: borde profundo, Plex Mono, etiquetas en
 * mayúsculas.
 *
 * Estados sin colores nuevos (el manual no tiene rojos ni verdes): se
 * distinguen por la forma del cuadradito de la marca y por el borde.
 *   error → cuadrado hueco y borde blanco en el campo;
 *   listo → cuadrado lleno;
 *   nota  → cuadrado chico en acero.
 */

/** El error de un campo, debajo del campo y anunciado por el lector de pantalla. */
export function ErrorCampo({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 font-plex text-xs leading-relaxed text-blanco">
      <span aria-hidden className="mt-[3px] size-2 shrink-0 border border-blanco" />
      {mensaje}
    </p>
  );
}

/** Un mensaje del formulario entero (error, listo o nota). */
export function Aviso({ tipo, children }: { tipo: "error" | "listo" | "nota"; children: ReactNode }) {
  const cuadrado =
    tipo === "error" ? "size-2.5 border border-blanco" : tipo === "listo" ? "size-2.5 bg-blanco" : "size-1.5 bg-acero";
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 border px-4 py-3 font-plex text-sm leading-relaxed ${
        tipo === "nota" ? "border-profundo text-acero" : "border-acero/60 text-blanco"
      }`}
    >
      <span aria-hidden className={`mt-[5px] shrink-0 ${cuadrado}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
};

/** Etiqueta, campo, ayuda y error, conectados para los lectores de pantalla. */
export function Campo({ etiqueta, error, ayuda, id, className, ...resto }: PropsCampo) {
  const automatico = useId();
  const idCampo = id ?? automatico;
  const idError = `${idCampo}-error`;
  const idAyuda = `${idCampo}-ayuda`;
  const describe = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={idCampo} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <input id={idCampo} aria-invalid={error ? true : undefined} aria-describedby={describe} className={CLASE_CAMPO} {...resto} />
      {ayuda && !error ? (
        <p id={idAyuda} className="mt-2 font-plex text-xs text-acero">
          {ayuda}
        </p>
      ) : null}
      <ErrorCampo id={idError} mensaje={error} />
    </div>
  );
}

/** Contraseña con el botón "Mostrar": en el celular ayuda a no equivocarse. */
export function CampoContrasena({ etiqueta, error, ayuda, id, className, ...resto }: PropsCampo) {
  const [visible, setVisible] = useState(false);
  const automatico = useId();
  const idCampo = id ?? automatico;
  const idError = `${idCampo}-error`;
  const idAyuda = `${idCampo}-ayuda`;
  const describe = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={idCampo} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={idCampo}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe}
          className={`${CLASE_CAMPO} pr-24`}
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={idCampo}
          className="absolute inset-y-0 right-0 px-4 font-plex text-[11px] font-medium uppercase tracking-etiqueta text-acero hover:text-blanco"
        >
          {visible ? CUENTA.campos.ocultar : CUENTA.campos.mostrar}
        </button>
      </div>
      {ayuda && !error ? (
        <p id={idAyuda} className="mt-2 font-plex text-xs text-acero">
          {ayuda}
        </p>
      ) : null}
      <ErrorCampo id={idError} mensaje={error} />
    </div>
  );
}

/** Casilla con el cuadradito de la marca en lugar del tilde del navegador. */
export function Casilla({
  name,
  defaultChecked,
  error,
  required,
  children,
}: {
  name: string;
  defaultChecked?: boolean;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label className="relative flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center border border-acero peer-checked:[&>span]:bg-blanco peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blanco"
        >
          <span className="size-2" />
        </span>
        <span className="font-lectura text-sm leading-relaxed text-acero">{children}</span>
      </label>
      <ErrorCampo id={`${id}-error`} mensaje={error} />
    </div>
  );
}
