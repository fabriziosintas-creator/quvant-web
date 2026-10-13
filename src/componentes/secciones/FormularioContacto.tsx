"use client";

import type { FormEvent, MouseEvent } from "react";
import { armarMensajeContacto, urlEmailMensaje, urlWhatsApp } from "@/datos/contacto";
import { CONTACTO_SECCION, PLATAFORMAS } from "@/datos/textos";

/**
 * Formulario corto sin servidor: arma el mensaje con lo cargado y lo abre
 * en WhatsApp (envío principal) o en el cliente de email. Campos no
 * controlados: los datos se leen recién al enviar.
 */

const CLASE_CAMPO =
  "w-full border border-profundo bg-transparent px-4 py-3 font-plex text-sm text-blanco placeholder:text-acero/60 focus:border-acero focus:outline-none";

function leerDatos(formulario: HTMLFormElement) {
  const datos = new FormData(formulario);
  const idNecesidad = String(datos.get("necesidad") ?? "");
  const opcion = CONTACTO_SECCION.campos.necesidad.opciones.find((o) => o.id === idNecesidad);
  return armarMensajeContacto({
    nombre: String(datos.get("nombre") ?? "").trim(),
    empresa: String(datos.get("empresa") ?? "").trim(),
    rubro: String(datos.get("rubro") ?? "").trim(),
    necesidad: opcion?.texto ?? "",
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
    <form onSubmit={alEnviarWhatsApp} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contacto-nombre"
            className="mb-2 block font-plex text-xs font-medium uppercase tracking-etiqueta text-acero"
          >
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
        <div>
          <label
            htmlFor="contacto-empresa"
            className="mb-2 block font-plex text-xs font-medium uppercase tracking-etiqueta text-acero"
          >
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
      </div>

      <div>
        <label
          htmlFor="contacto-rubro"
          className="mb-2 block font-plex text-xs font-medium uppercase tracking-etiqueta text-acero"
        >
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

      <fieldset>
        <legend className="mb-3 font-plex text-xs font-medium uppercase tracking-etiqueta text-acero">
          {campos.necesidad.etiqueta}
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {campos.necesidad.opciones.map((opcion, indice) => (
            <label
              key={opcion.id}
              className="flex cursor-pointer items-center gap-3 border border-profundo px-4 py-3 transition-colors has-[:checked]:border-acero"
            >
              <input
                type="radio"
                name="necesidad"
                value={opcion.id}
                defaultChecked={indice === 0}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="size-2 shrink-0 border border-acero peer-checked:bg-blanco"
              />
              <span className="font-plex text-xs leading-snug text-acero peer-checked:text-blanco">
                {opcion.texto}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="contacto-mensaje"
          className="mb-2 block font-plex text-xs font-medium uppercase tracking-etiqueta text-acero"
        >
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

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center bg-blanco px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-negro transition-colors hover:bg-acero"
        >
          {botones.whatsapp}
        </button>
        <button
          type="button"
          onClick={alPreferirEmail}
          className="inline-flex h-12 items-center justify-center border border-profundo px-7 font-plex text-[13px] font-medium uppercase tracking-[0.14em] text-blanco transition-colors hover:border-acero"
        >
          {botones.email}
        </button>
      </div>
      <p className="font-plex text-xs leading-relaxed text-acero">{nota}</p>
    </form>
  );
}
