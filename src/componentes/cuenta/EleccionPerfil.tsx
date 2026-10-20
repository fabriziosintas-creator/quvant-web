"use client";

import { useState, type CSSProperties } from "react";
import { ACENTO_NICHO } from "@/datos/colores";
import { CUENTA } from "@/datos/textos";
import { Campo, ErrorCampo } from "./Campos";

/**
 * Rubro y objetivo: lo que el registro pide sí o sí y la cuenta deja
 * cambiar. Rubros como tarjetas grandes (para el dedo), cada una con el
 * punto del color de su rubro; "Otro rubro" abre el campo para decir cuál.
 * Son radios de verdad: se recorren con el teclado y los lee el lector de
 * pantalla.
 */
export function EleccionPerfil({
  nicho: nichoInicial = "",
  nichoOtro = "",
  objetivo = "",
  errores = {},
}: {
  nicho?: string;
  nichoOtro?: string;
  objetivo?: string;
  errores?: Partial<Record<string, string>>;
}) {
  const [nicho, setNicho] = useState(nichoInicial);

  return (
    <>
      <fieldset aria-describedby={errores.nicho ? "nicho-error" : undefined}>
        <legend className="mb-3 font-lectura text-sm font-medium text-acero">
          {CUENTA.campos.nicho}
        </legend>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {CUENTA.nichos.map((item) => {
            const acento = item.id in ACENTO_NICHO ? ACENTO_NICHO[item.id as keyof typeof ACENTO_NICHO] : "#9C9CA3";
            return (
              <label
                key={item.id}
                style={{ "--acento": acento } as CSSProperties}
                className="group relative flex min-h-24 cursor-pointer flex-col justify-between gap-3 rounded-2xl border border-profundo p-3.5 transition-colors hover:border-acero/60 has-[:checked]:border-[var(--acento)] has-[:checked]:bg-profundo/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco sm:p-4"
              >
                <input
                  type="radio"
                  name="nicho"
                  value={item.id}
                  checked={nicho === item.id}
                  onChange={() => setNicho(item.id)}
                  required
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span aria-hidden className="size-2 bg-[var(--acento)]" />
                  <span aria-hidden className="size-3.5 border border-acero/70 p-[2px] group-has-[:checked]:border-blanco">
                    <span className="block size-full group-has-[:checked]:bg-blanco" />
                  </span>
                </span>
                <span>
                  <span className="block font-lectura text-[15px] font-semibold leading-tight text-blanco">{item.nombre}</span>
                  <span className="mt-1 block font-lectura text-xs leading-snug text-acero">{item.detalle}</span>
                </span>
              </label>
            );
          })}
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

      <fieldset aria-describedby={errores.objetivo ? "objetivo-error" : undefined}>
        <legend className="mb-3 font-lectura text-sm font-medium text-acero">
          {CUENTA.campos.objetivo}
        </legend>
        <div className="flex flex-col gap-2.5">
          {CUENTA.objetivos.map((item) => (
            <label
              key={item.id}
              className="group relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-profundo/35 px-4 py-3 transition-colors hover:border-acero/60 has-[:checked]:border-blanco has-[:checked]:bg-profundo/40 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco"
            >
              <input
                type="radio"
                name="objetivo"
                value={item.id}
                defaultChecked={objetivo === item.id}
                required
                className="sr-only"
              />
              <span aria-hidden className="size-3.5 shrink-0 border border-acero/70 p-[2px] group-has-[:checked]:border-blanco">
                <span className="block size-full group-has-[:checked]:bg-blanco" />
              </span>
              <span className="font-lectura text-[15px] leading-snug text-acero group-has-[:checked]:text-blanco">
                {item.texto}
              </span>
            </label>
          ))}
        </div>
        <ErrorCampo id="objetivo-error" mensaje={errores.objetivo} />
      </fieldset>
    </>
  );
}
