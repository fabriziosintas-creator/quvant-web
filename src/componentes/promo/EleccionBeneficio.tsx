"use client";

import { useState } from "react";
import { ErrorCampo } from "@/componentes/cuenta/Campos";
import { PROMO_TEXTOS, type IdBeneficio } from "@/datos/promo";

const T = PROMO_TEXTOS;

/**
 * "Elegí tu beneficio": dos tarjetas grandes, para el dedo. Los 2 meses
 * del sistema se apagan (con su motivo) si el rubro elegido todavía no
 * tiene sistema; si estaban elegidos y cambia el rubro, se sueltan.
 */
export function EleccionBeneficio({
  nicho,
  rubrosSistema,
  inicial,
  error,
}: {
  nicho: string;
  rubrosSistema: readonly string[];
  inicial?: string;
  error?: string;
}) {
  const [elegido, setElegido] = useState<string>(inicial ?? "");
  const conSistema = rubrosSistema.includes(nicho);
  const valor = elegido === "sistema_2_meses" && nicho && !conSistema ? "" : elegido;

  const opciones: Array<{ id: IdBeneficio; titulo: string; texto: string; disponible: boolean }> = [
    { id: "web_app_50", titulo: T.beneficios.web.titulo, texto: T.beneficios.web.texto, disponible: true },
    { id: "sistema_2_meses", titulo: T.beneficios.sistema.titulo, texto: T.beneficios.sistema.texto, disponible: !nicho || conSistema },
  ];

  return (
    <fieldset aria-describedby={error ? "beneficio-error" : undefined}>
      <legend className="mb-3 font-lectura text-sm font-medium text-acero">{T.registro.eleccion}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {opciones.map((o) => (
          <label
            key={o.id}
            className={`flex min-h-24 cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors has-[:checked]:border-blanco has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco ${
              o.disponible ? "border-profundo bg-profundo/35 hover:border-acero" : "cursor-not-allowed border-profundo/60 opacity-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="promo_beneficio"
                value={o.id}
                checked={valor === o.id}
                disabled={!o.disponible}
                onChange={() => setElegido(o.id)}
                className="peer sr-only"
              />
              <span aria-hidden className="size-2.5 shrink-0 border border-acero peer-checked:border-blanco peer-checked:bg-blanco" />
              <span className="titulo text-lg leading-snug text-blanco">{o.titulo}</span>
            </span>
            <span className="font-lectura text-sm leading-relaxed text-acero">{o.texto}</span>
          </label>
        ))}
      </div>
      {nicho && !conSistema ? <p className="mt-3 font-lectura text-sm text-acero">{T.registro.noDisponible}</p> : null}
      <ErrorCampo id="beneficio-error" mensaje={error} />
    </fieldset>
  );
}
