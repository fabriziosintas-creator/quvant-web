"use client";

import type { FormEvent, MouseEvent } from "react";
import { armarMensajeContacto, urlEmailMensaje, urlWhatsApp } from "@/datos/contacto";
import { CONTACTO_SECCION, PLATAFORMAS } from "@/datos/textos";

/**
 * Formulario corto y amable (web más humana, paso 8): nombre, qué
 * necesitás y "contanos un poco"; empresa y rubro, opcionales y al final.
 * Sin servidor: arma el mensaje con lo cargado, escrito como lo escribiría
 * una persona, y lo abre en WhatsApp (envío principal) o en el email.
 */

const CLASE_CAMPO =
  "w-full rounded-2xl border border-profundo bg-transparent px-4 py-3 font-lectura text-base text-blanco placeholder:text-acero/60 focus:border-acero focus:outline-none md:text-sm";
const CLASE_ETIQUETA = "mb-2 block font-lectura text-sm font-medium text-acero";

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
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-profundo/35 px-4 py-3 transition-colors has-[:checked]:border-acero"
            >
              <input type="radio" name="necesidad" value={opcion.id} defaultChecked={indice === 0} className="peer sr-only" />
              <span aria-hidden className="size-2 shrink-0 border border-acero peer-checked:bg-blanco" />
              <span className="font-lectura text-sm leading-snug text-acero peer-checked:text-blanco">{opcion.texto}</span>
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
          className="rounded-full inline-flex h-12 items-center justify-center bg-blanco px-7 font-lectura text-sm font-medium text-negro transition-colors hover:bg-acero"
        >
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
