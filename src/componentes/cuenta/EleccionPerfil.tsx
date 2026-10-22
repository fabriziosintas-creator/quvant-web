"use client";

import { useState, type CSSProperties } from "react";
import { ACENTO_NICHO } from "@/datos/colores";
import { CUENTA } from "@/datos/textos";
import { Campo, ErrorCampo } from "./Campos";

/**
 * Rubro y objetivo: lo que el registro pide sí o sí (un paso cada uno en
 * el registro por pasos). Rubros como tarjetas grandes, para el dedo,
 * cada una con el color de su rubro; "Otro rubro" abre el campo para
 * decir cuál. Son radios de verdad: se recorren con el teclado y los lee
 * el lector de pantalla.
 *
 * Las tarjetas son .tarjeta-3d (globals.css): se inclinan con el mouse
 * (lo maneja el registro) y la elegida se levanta con el color del rubro.
 */

export const acentoDeNicho = (id: string) => (id in ACENTO_NICHO ? ACENTO_NICHO[id as keyof typeof ACENTO_NICHO] : "#9C9CA3");

export function EleccionRubro({
  nicho: nichoInicial = "",
  nichoOtro = "",
  errores = {},
  alElegir,
}: {
  nicho?: string;
  nichoOtro?: string;
  errores?: Partial<Record<string, string>>;
  alElegir?: (nicho: string) => void;
}) {
  const [nicho, setNicho] = useState(nichoInicial);

  return (
    <>
      <fieldset aria-describedby={errores.nicho ? "nicho-error" : undefined}>
        <legend className="sr-only">{CUENTA.campos.nicho}</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {CUENTA.nichos.map((item) => (
            <label
              key={item.id}
              style={{ "--acento": acentoDeNicho(item.id) } as CSSProperties}
              className="tarjeta-3d group relative flex min-h-28 cursor-pointer flex-col justify-between gap-3 rounded-2xl border border-profundo p-3.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco sm:p-4"
            >
              <input
                type="radio"
                name="nicho"
                value={item.id}
                checked={nicho === item.id}
                onChange={() => {
                  setNicho(item.id);
                  alElegir?.(item.id);
                }}
                required
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2">
                <span aria-hidden className="tarjeta-3d__punto size-2.5 bg-[var(--acento)]" />
                <span aria-hidden className="tarjeta-3d__marca size-4 border border-acero/70 p-[3px] group-has-[:checked]:border-[var(--acento)]">
                  <span className="block size-full group-has-[:checked]:bg-[var(--acento)]" />
                </span>
              </span>
              <span>
                <span className="block font-lectura text-[15px] font-semibold leading-tight text-blanco">{item.nombre}</span>
                <span className="mt-1 block font-lectura text-xs leading-snug text-acero">{item.detalle}</span>
              </span>
            </label>
          ))}
        </div>
        <ErrorCampo id="nicho-error" mensaje={errores.nicho} />
      </fieldset>

      {nicho === "otro" ? (
        <Campo
          name="nichoOtro"
          etiqueta={CUENTA.campos.nichoOtro.etiqueta}
          placeholder={CUENTA.campos.nichoOtro.marcador}
          defaultValue={nichoOtro}
          maxLength={80}
          required
          error={errores.nichoOtro}
        />
      ) : null}
    </>
  );
}

export function EleccionObjetivo({ objetivo = "", errores = {} }: { objetivo?: string; errores?: Partial<Record<string, string>> }) {
  return (
    <fieldset aria-describedby={errores.objetivo ? "objetivo-error" : undefined}>
      <legend className="sr-only">{CUENTA.campos.objetivo}</legend>
      <div className="flex flex-col gap-3">
        {CUENTA.objetivos.map((item) => (
          <label
            key={item.id}
            style={{ "--acento": "var(--acento-registro, #ececee)" } as CSSProperties}
            className="tarjeta-3d group relative flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border border-profundo px-4 py-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco"
          >
            <input type="radio" name="objetivo" value={item.id} defaultChecked={objetivo === item.id} required className="sr-only" />
            <span aria-hidden className="tarjeta-3d__marca size-4 shrink-0 border border-acero/70 p-[3px] group-has-[:checked]:border-[var(--acento)]">
              <span className="block size-full group-has-[:checked]:bg-[var(--acento)]" />
            </span>
            <span className="font-lectura text-base leading-snug text-acero group-has-[:checked]:text-blanco">{item.texto}</span>
          </label>
        ))}
      </div>
      <ErrorCampo id="objetivo-error" mensaje={errores.objetivo} />
    </fieldset>
  );
}

/** Los dos juntos (como era antes del registro por pasos). */
export function EleccionPerfil({
  nicho = "",
  nichoOtro = "",
  objetivo = "",
  errores = {},
}: {
  nicho?: string;
  nichoOtro?: string;
  objetivo?: string;
  errores?: Partial<Record<string, string>>;
}) {
  return (
    <>
      <EleccionRubro nicho={nicho} nichoOtro={nichoOtro} errores={errores} />
      <EleccionObjetivo objetivo={objetivo} errores={errores} />
    </>
  );
}
