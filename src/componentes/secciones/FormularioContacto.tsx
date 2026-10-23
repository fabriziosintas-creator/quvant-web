"use client";

import type { CSSProperties, FormEvent, MouseEvent } from "react";
import { AURORA } from "@/datos/colores";
import { armarMensajeContacto, urlEmailMensaje, urlWhatsApp } from "@/datos/contacto";
import { CONTACTO_SECCION, PLATAFORMAS } from "@/datos/textos";

/**
 * Formulario corto y amable (web más humana, paso 8): nombre, qué
 * necesitás y "contanos un poco"; empresa y rubro, opcionales y al final.
 * Sin servidor: arma el mensaje con lo cargado, escrito como lo escribiría
 * una persona, y lo abre en WhatsApp (envío principal) o en el email.
 */

const CLASE_CAMPO =
  "w-full rounded-2xl border border-profundo bg-negro/50 px-4 py-3 font-lectura text-base text-blanco transition-[border-color,box-shadow] placeholder:text-acero/60 focus:border-[var(--acento)] focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--acento)_22%,transparent)] focus:outline-none md:text-sm";
const CLASE_ETIQUETA = "mb-2 block font-lectura text-sm font-medium text-acero";
/** Cada opción de "Qué necesitás" con su color (los de las situaciones de la promo). */
const COLOR_OPCION: Record<string, string> = { sistema: AURORA[0], app: AURORA[2], web: AURORA[1] };

function leerDatos(formulario: HTMLFormElement) {
  const datos = new FormData(formulario);
  const idNecesidad = String(datos.get("necesidad") ?? "");
  const opcion = CONTACTO_SECCION.campos.necesidad.opciones.find((o) => o.id === idNecesidad);
  return armarMensajeContacto({
    nombre: String(datos.get("nombre") ?? "").trim(),
    empresa: String(datos.get("empresa") ?? "").trim(),
    rubro: String(datos.get("rubro") ?? "").trim(),
    necesidad: opcion?.enMensaje ?? "",
    mensaje: String(datos.get("mensaje") ?? "").trim(),
  });
}

export function FormularioContacto() {
  const { campos, botones, nota } = CONTACTO_SECCION;

  const alEnviarWhatsApp = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    window.open(urlWhatsApp(leerDatos(evento.currentTarget)), "_blank", "noopener,noreferrer");
  };

  const alPreferirEmail = (evento: MouseEvent<HTMLButtonElement>) => {
    const formulario = evento.currentTarget.form;
    if (!formulario || !formulario.reportValidity()) return;
    window.location.href = urlEmailMensaje(CONTACTO_SECCION.asuntoEmail, leerDatos(formulario));
  };

  return (
    <form onSubmit={alEnviarWhatsApp} className="flex flex-col gap-6">
      <div>
        <label htmlFor="contacto-nombre" className={CLASE_ETIQUETA}>
          {campos.nombre.etiqueta}
        </label>
        <input
          id="contacto-nombre"
          name="nombre"
          type="text"
          required
          autoComplete="name"
          placeholder={campos.nombre.marcador}
          className={CLASE_CAMPO}
        />
      </div>

      <fieldset>
        <legend className="mb-3 font-lectura text-sm font-medium text-acero">{campos.necesidad.etiqueta}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {campos.necesidad.opciones.map((opcion, indice) => (
            <label
              key={opcion.id}
              style={{ "--acento": COLOR_OPCION[opcion.id] } as CSSProperties}
              className="tarjeta-luz flex cursor-pointer flex-col gap-3 p-4 [--radio-luz:1rem] [--tam-numero:1.9rem]"
            >
              <input type="radio" name="necesidad" value={opcion.id} defaultChecked={indice === 0} className="peer sr-only" />
              <span aria-hidden className="numero-luz font-michroma">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <span className="font-lectura text-sm font-medium leading-snug text-acero transition-colors peer-checked:text-blanco">{opcion.texto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="contacto-mensaje" className={CLASE_ETIQUETA}>
          {campos.mensaje.etiqueta}
        </label>
        <textarea
          id="contacto-mensaje"
          name="mensaje"
          required
          rows={4}
          placeholder={campos.mensaje.marcador}
          className={`${CLASE_CAMPO} resize-y`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contacto-empresa" className={CLASE_ETIQUETA}>
            {campos.empresa.etiqueta}
          </label>
          <input
            id="contacto-empresa"
            name="empresa"
            type="text"
            autoComplete="organization"
            placeholder={campos.empresa.marcador}
            className={CLASE_CAMPO}
          />
        </div>
        <div>
          <label htmlFor="contacto-rubro" className={CLASE_ETIQUETA}>
            {campos.rubro.etiqueta}
          </label>
          <input
            id="contacto-rubro"
            name="rubro"
            type="text"
            list="rubros-sugeridos"
            placeholder={campos.rubro.marcador}
            className={CLASE_CAMPO}
          />
          <datalist id="rubros-sugeridos">
            {PLATAFORMAS.rubros.items.map((rubro) => (
              <option key={rubro.id} value={rubro.nombre} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-full inline-flex h-12 items-center justify-center gap-2.5 bg-blanco px-7 font-lectura text-sm font-medium text-negro shadow-[0_18px_48px_-14px_var(--acento)] transition-[background-color,box-shadow] hover:bg-acero hover:shadow-[0_22px_56px_-12px_var(--acento)]"
        >
          <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
          {botones.whatsapp}
        </button>
        <button
          type="button"
          onClick={alPreferirEmail}
          className="rounded-full inline-flex h-12 items-center justify-center border border-profundo px-7 font-lectura text-sm font-medium text-blanco transition-colors hover:border-acero"
        >
          {botones.email}
        </button>
      </div>
      <p className="font-lectura text-sm leading-relaxed text-acero">{nota}</p>
    </form>
  );
}
