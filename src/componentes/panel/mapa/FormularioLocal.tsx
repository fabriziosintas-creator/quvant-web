"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useActionState, useEffect, useRef, useState } from "react";
// (useEffect y useRef los usa el buscador de Google.)
import { Aviso, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { PANEL_ADMIN } from "@/datos/textos";
import { agregarLocal, type EstadoFormulario } from "@/servidor/panel/locales";

const T = PANEL_ADMIN.mapa.local;
const INICIAL: EstadoFormulario = { estado: "inicial" };

type Valores = {
  nombre: string;
  nicho: string;
  rubro: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  telefono: string;
  web: string;
  latitud: string;
  longitud: string;
  place_id: string;
};
const VACIO: Valores = { nombre: "", nicho: "", rubro: "", direccion: "", ciudad: "", provincia: "", telefono: "", web: "", latitud: "", longitud: "", place_id: "" };

/** Qué parte de la dirección de Google es la ciudad y cuál la provincia. */
function partesDe(componentes: google.maps.GeocoderAddressComponent[] | undefined) {
  const buscar = (tipo: string) => componentes?.find((c) => c.types.includes(tipo))?.long_name ?? "";
  return {
    ciudad: buscar("locality") || buscar("administrative_area_level_2") || buscar("sublocality"),
    provincia: buscar("administrative_area_level_1"),
  };
}

/** El buscador de Google Places: al elegir un lugar, llena el formulario. Solo se monta con clave. */
function BuscadorGoogle({ alElegir }: { alElegir: (valores: Partial<Valores>) => void }) {
  const places = useMapsLibrary("places");
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!places || !campo.current) return;
    const autocompletar = new places.Autocomplete(campo.current, {
      fields: ["place_id", "name", "formatted_address", "geometry", "address_components", "formatted_phone_number", "website"],
      componentRestrictions: { country: "ar" },
    });
    const escucha = autocompletar.addListener("place_changed", () => {
      const lugar = autocompletar.getPlace();
      const ubicacion = lugar.geometry?.location;
      alElegir({
        nombre: lugar.name ?? "",
        direccion: lugar.formatted_address ?? "",
        ...partesDe(lugar.address_components),
        telefono: lugar.formatted_phone_number ?? "",
        web: lugar.website ?? "",
        place_id: lugar.place_id ?? "",
        latitud: ubicacion ? String(ubicacion.lat()) : "",
        longitud: ubicacion ? String(ubicacion.lng()) : "",
      });
      if (campo.current) campo.current.value = "";
    });
    return () => escucha.remove();
  }, [places, alElegir]);
  return (
    <div>
      <label htmlFor="local-buscar" className={CLASE_ETIQUETA}>
        {T.buscar}
      </label>
      <input id="local-buscar" ref={campo} type="search" placeholder={T.buscarMarcador} autoComplete="off" className={CLASE_CAMPO} />
    </div>
  );
}

/**
 * Agregar un local: buscándolo en Google (con clave) o a mano, y "Estoy
 * acá" para cargarlo parado en la puerta. Si el lugar ya estaba, abre el
 * que está en vez de duplicarlo.
 */
export function FormularioLocal({ nichos, hayClave, alCrear }: { nichos: Array<{ id: string; nombre: string }>; hayClave: boolean; alCrear?: (id: string) => void }) {
  const [valores, setValores] = useState<Valores>(VACIO);
  const [ubicacion, setUbicacion] = useState<{ estado: "" | "buscando" | "listo" | "error"; precision?: number }>({ estado: "" });
  // Al guardar, el formulario se vacía; si el local ya estaba, se abre el que está.
  const [estado, enviar, enviando] = useActionState(async (previo: EstadoFormulario, datos: FormData) => {
    const resultado = await agregarLocal(previo, datos);
    if (resultado.estado === "listo") {
      setValores(VACIO);
      setUbicacion({ estado: "" });
    }
    if ((resultado.estado === "listo" || resultado.estado === "repetido") && resultado.localId) alCrear?.(resultado.localId);
    return resultado;
  }, INICIAL);
  const e = estado.errores ?? {};

  const cambiar = (campo: keyof Valores) => (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValores((v) => ({ ...v, [campo]: evento.target.value }));

  const estoyAca = () => {
    if (!("geolocation" in navigator)) return setUbicacion({ estado: "error" });
    setUbicacion({ estado: "buscando" });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setValores((v) => ({ ...v, latitud: String(p.coords.latitude), longitud: String(p.coords.longitude), place_id: "" }));
        setUbicacion({ estado: "listo", precision: Math.round(p.coords.accuracy) });
      },
      () => setUbicacion({ estado: "error" }),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const campo = (nombre: keyof Valores, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`local-${nombre}`} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <input id={`local-${nombre}`} name={nombre} value={valores[nombre]} onChange={cambiar(nombre)} aria-invalid={e[nombre] ? true : undefined} className={CLASE_CAMPO} {...extra} />
      <ErrorCampo id={`local-${nombre}-error`} mensaje={e[nombre]} />
    </div>
  );

  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-5 border border-profundo p-4 md:p-5">
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      {estado.estado === "repetido" && estado.mensaje ? <Aviso tipo="nota">{estado.mensaje}</Aviso> : null}

      {hayClave ? <BuscadorGoogle alElegir={(nuevos) => setValores((v) => ({ ...v, ...nuevos }))} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {campo("nombre", T.nombre, { required: true, maxLength: 160, autoComplete: "organization" })}
        <div>
          <label htmlFor="local-nicho" className={CLASE_ETIQUETA}>
            {T.nicho}
          </label>
          <select id="local-nicho" name="nicho" value={valores.nicho} onChange={cambiar("nicho")} aria-invalid={e.nicho ? true : undefined} className={CLASE_CAMPO}>
            <option value="">{T.sinNicho}</option>
            {nichos.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
              </option>
            ))}
          </select>
          <ErrorCampo id="local-nicho-error" mensaje={e.nicho} />
        </div>
        {campo("rubro", T.rubro, { maxLength: 120 })}
        {campo("direccion", T.direccion, { maxLength: 300, autoComplete: "street-address" })}
        {campo("ciudad", T.ciudad, { maxLength: 120 })}
        {campo("provincia", T.provincia, { maxLength: 120 })}
        {campo("telefono", T.telefono, { maxLength: 60, type: "tel", inputMode: "tel" })}
        {campo("web", T.web, { maxLength: 300, type: "url", inputMode: "url" })}
      </div>

      <input type="hidden" name="latitud" value={valores.latitud} />
      <input type="hidden" name="longitud" value={valores.longitud} />
      <input type="hidden" name="place_id" value={valores.place_id} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={estoyAca} disabled={ubicacion.estado === "buscando"} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
          {ubicacion.estado === "buscando" ? T.ubicando : T.estoyAca}
        </button>
        <p className="font-plex text-xs text-acero" aria-live="polite">
          {ubicacion.estado === "listo" ? T.ubicado.replace("{m}", String(ubicacion.precision ?? 0)) : ubicacion.estado === "error" ? T.sinUbicacion : valores.latitud ? `${valores.latitud}, ${valores.longitud}` : ""}
        </p>
      </div>
      <ErrorCampo id="local-coordenadas-error" mensaje={e.coordenadas} />

      <div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? T.agregando : T.agregar}
        </button>
      </div>
    </form>
  );
}
