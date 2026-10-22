"use client";

import { useState } from "react";
import { ErrorCampo } from "@/componentes/cuenta/Campos";
import { PROMO_TEXTOS, type IdBeneficio } from "@/datos/promo";

const T = PROMO_TEXTOS;

/**
 * "Elegí tu beneficio": dos tarjetas grandes, para el dedo. El mes gratis
 * del sistema se apaga (con su motivo) si el rubro elegido todavía no
 * tiene sistema; si estaba elegido y cambia el rubro, se suelta.
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
  const valor = elegido === "sistema_1_mes" && nicho && !conSistema ? "" : elegido;

  const opciones: Array<{ id: IdBeneficio; titulo: string; texto: string; disponible: boolean }> = [
    { id: "web_app_50", titulo: T.beneficios.web.titulo, texto: T.beneficios.web.texto, disponible: true },
    { id: "sistema_1_mes", titulo: T.beneficios.sistema.titulo, texto: T.beneficios.sistema.texto, disponible: !nicho || conSistema },
  ];

  return (
    <fieldset aria-describedby={error ? "beneficio-error" : undefined}>
      <legend className="mb-3 font-lectura text-sm font-medium text-acero">{T.registro.eleccion}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {opciones.map((o) => (
          <label
            key={o.id}
            style={{ "--acento": "#7BD389" } as React.CSSProperties}
            className={`group flex min-h-28 flex-col gap-2 rounded-2xl border p-5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blanco ${
              o.disponible ? "tarjeta-3d cursor-pointer border-profundo" : "cursor-not-allowed border-profundo/60 opacity-50"
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
              <span aria-hidden className="tarjeta-3d__marca size-3 shrink-0 border border-acero peer-checked:border-[var(--acento)] peer-checked:bg-[var(--acento)]" />
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
