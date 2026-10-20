"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Aviso, ErrorCampo } from "@/componentes/cuenta/Campos";
import { enviarSinReiniciar } from "@/componentes/cuenta/enviarSinReiniciar";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, CLASE_ETIQUETA } from "@/componentes/cuenta/estilos";
import { PANEL_ADMIN } from "@/datos/textos";
import { agregarLocal, buscarDireccion, direccionAca, leerLinkGoogle, type EstadoFormulario } from "@/servidor/panel/locales";
import type { Lugar } from "@/servidor/panel/nominatim";

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
  contacto: string;
  web: string;
  latitud: string;
  longitud: string;
  osm_id: string;
  link_google_maps: string;
};
const VACIO: Valores = { nombre: "", nicho: "", rubro: "", direccion: "", ciudad: "", provincia: "", telefono: "", contacto: "", web: "", latitud: "", longitud: "", osm_id: "", link_google_maps: "" };

type Nota = { tipo: "error" | "listo" | "nota"; texto: string; abrir?: string } | null;

/**
 * Agregar un local, de tres maneras y sin ninguna API de Google:
 *  1. Pegando el link de Google Maps (de "Compartir" en el celular): el
 *     servidor lee el nombre y las coordenadas del link.
 *  2. Buscando la dirección en OpenStreetMap (Nominatim), al tocar
 *     "Buscar" (nunca mientras se escribe: su política no lo permite).
 *  3. "Estoy acá": la ubicación del celular, parado en la puerta; la
 *     dirección se completa sola.
 * Si el local ya estaba (mismo link, mismo lugar, mismo nombre a menos de
 * 30 m o misma dirección), se abre el que está en vez de duplicarlo.
 */
export function FormularioLocal({ nichos }: { nichos: Array<{ id: string; nombre: string }> }) {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>(VACIO);
  const [pegado, setPegado] = useState("");
  const [consulta, setConsulta] = useState("");
  const [lugares, setLugares] = useState<Lugar[] | null>(null);
  const [nota, setNota] = useState<Nota>(null);
  const [precision, setPrecision] = useState<"exacta" | "aproximada" | null>(null);
  const [ocupado, setOcupado] = useState<"" | "link" | "buscar" | "aca">("");
  const [, iniciar] = useTransition();

  /** Abre un local en el mapa (el recién cargado o el que ya estaba). */
  const abrir = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("local", id);
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
    requestAnimationFrame(() => document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const [estado, enviar, enviando] = useActionState(async (previo: EstadoFormulario, datos: FormData) => {
    const resultado = await agregarLocal(previo, datos);
    if (resultado.estado === "listo") {
      setValores(VACIO);
      setPegado("");
      setConsulta("");
      setLugares(null);
      setPrecision(null);
      setNota(null);
    }
    if ((resultado.estado === "listo" || resultado.estado === "repetido") && resultado.localId) abrir(resultado.localId);
    return resultado;
  }, INICIAL);
  const e = estado.errores ?? {};

  const cambiar = (campo: keyof Valores) => (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValores((v) => ({ ...v, [campo]: evento.target.value }));

  // 1. El link de Google Maps.
  const leerLink = () => {
    if (!pegado.trim()) return setNota({ tipo: "error", texto: T.link.vacio });
    setOcupado("link");
    iniciar(async () => {
      const r = await leerLinkGoogle(pegado);
      setOcupado("");
      if (r.estado === "error") return setNota({ tipo: "error", texto: r.mensaje });
      const { leido } = r;
      setValores((v) => ({
        ...v,
        nombre: leido.nombre ?? v.nombre,
        direccion: leido.direccion ?? v.direccion,
        latitud: leido.latitud !== null ? String(leido.latitud) : v.latitud,
        longitud: leido.longitud !== null ? String(leido.longitud) : v.longitud,
        osm_id: leido.latitud !== null ? "" : v.osm_id,
        link_google_maps: leido.link,
      }));
      if (leido.latitud !== null) setPrecision(leido.precision === "pantalla" ? "aproximada" : "exacta");
      if (r.repetidoId) return setNota({ tipo: "nota", texto: T.repetido, abrir: r.repetidoId });
      if (leido.latitud === null) {
        setConsulta([leido.nombre, leido.direccion].filter(Boolean).join(", "));
        return setNota({ tipo: "nota", texto: T.link.sinCoordenadas });
      }
      setNota({ tipo: "listo", texto: T.link.leido.replace("{nombre}", leido.nombre ?? T.link.sinNombre) });
    });
  };

  // 2. Buscar en OpenStreetMap.
  const buscar = () => {
    setOcupado("buscar");
    iniciar(async () => {
      const r = await buscarDireccion(consulta);
      setOcupado("");
      if (r.estado === "error") {
        setLugares(null);
        return setNota({ tipo: "error", texto: r.mensaje });
      }
      setLugares(r.lugares);
      setNota(r.lugares.length === 0 ? { tipo: "nota", texto: T.busqueda.nada } : null);
    });
  };
  const elegirLugar = (lugar: Lugar) => {
    setValores((v) => ({
      ...v,
      nombre: v.nombre || lugar.nombre || "",
      direccion: lugar.direccion,
      ciudad: lugar.ciudad ?? v.ciudad,
      provincia: lugar.provincia ?? v.provincia,
      latitud: String(lugar.latitud),
      longitud: String(lugar.longitud),
      osm_id: lugar.osm_id ?? "",
    }));
    setPrecision("exacta");
    setLugares(null);
    setNota({ tipo: "listo", texto: T.busqueda.elegido });
  };

  // 3. Estoy acá.
  const estoyAca = () => {
    if (!("geolocation" in navigator)) return setNota({ tipo: "error", texto: T.sinUbicacion });
    setOcupado("aca");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: latitud, longitude: longitud, accuracy } = p.coords;
        setValores((v) => ({ ...v, latitud: String(latitud), longitud: String(longitud), osm_id: "" }));
        setPrecision(accuracy <= 30 ? "exacta" : "aproximada");
        setNota({ tipo: "listo", texto: T.ubicado.replace("{m}", String(Math.round(accuracy))) });
        iniciar(async () => {
          const lugar = await direccionAca(latitud, longitud);
          setOcupado("");
          if (!lugar) return;
          setValores((v) => ({
            ...v,
            direccion: v.direccion || lugar.direccion,
            ciudad: v.ciudad || lugar.ciudad || "",
            provincia: v.provincia || lugar.provincia || "",
          }));
        });
      },
      () => {
        setOcupado("");
        setNota({ tipo: "error", texto: T.sinUbicacion });
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const campo = (nombre: keyof Valores, etiqueta: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`local-${nombre}`} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <input id={`local-${nombre}`} name={nombre} value={valores[nombre]} onChange={cambiar(nombre)} aria-invalid={e[nombre] ? true : undefined} aria-describedby={e[nombre] ? `local-${nombre}-error` : undefined} className={CLASE_CAMPO} {...extra} />
      <ErrorCampo id={`local-${nombre}-error`} mensaje={e[nombre]} />
    </div>
  );

  const avisoNota = nota ? (
    <Aviso tipo={nota.tipo}>
      {nota.texto}
      {nota.abrir ? (
        <>
          {" "}
          <button type="button" onClick={() => abrir(nota.abrir!)} className="underline decoration-acero underline-offset-4 hover:decoration-blanco">
            {T.abrirExistente}
          </button>
        </>
      ) : null}
    </Aviso>
  ) : null;

  return (
    <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-6 border border-profundo p-4 md:p-5">
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
      {estado.estado === "repetido" && estado.mensaje ? <Aviso tipo="nota">{estado.mensaje}</Aviso> : null}

      {/* Las tres maneras de ubicarlo. */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="local-link" className={CLASE_ETIQUETA}>
            {T.link.etiqueta}
          </label>
          <textarea
            id="local-link"
            value={pegado}
            onChange={(ev) => setPegado(ev.target.value)}
            rows={2}
            placeholder={T.link.marcador}
            autoComplete="off"
            className={`${CLASE_CAMPO} h-auto min-h-[4.5rem] resize-y py-3`}
          />
          <div>
            <button type="button" onClick={leerLink} disabled={ocupado !== ""} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
              {ocupado === "link" ? T.link.leyendo : T.link.boton}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="local-buscar" className={CLASE_ETIQUETA}>
            {T.busqueda.etiqueta}
          </label>
          <input
            id="local-buscar"
            type="search"
            value={consulta}
            onChange={(ev) => setConsulta(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                buscar();
              }
            }}
            placeholder={T.busqueda.marcador}
            autoComplete="off"
            enterKeyHint="search"
            className={CLASE_CAMPO}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={buscar} disabled={ocupado !== ""} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
              {ocupado === "buscar" ? T.busqueda.buscando : T.busqueda.boton}
            </button>
            <button type="button" onClick={estoyAca} disabled={ocupado !== ""} className={`${CLASE_BOTON_SECUNDARIO} h-11 px-5`}>
              {ocupado === "aca" ? T.ubicando : T.estoyAca}
            </button>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {avisoNota}
        {lugares && lugares.length > 0 ? (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {lugares.map((lugar) => (
                <li key={`${lugar.osm_id}-${lugar.latitud}`}>
                  <button type="button" onClick={() => elegirLugar(lugar)} className="flex w-full flex-col gap-1 border border-profundo p-3 text-left transition-colors hover:border-acero">
                    <span className="font-lectura text-sm text-blanco">{lugar.nombre ? `${lugar.nombre} · ${lugar.direccion}` : lugar.direccion}</span>
                    <span className="font-plex text-xs text-acero">{lugar.completa}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="font-plex text-[11px] text-acero">{T.busqueda.atribucion}</p>
          </div>
        ) : null}
      </div>

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
        {campo("contacto", T.contacto, { maxLength: 120 })}
        {campo("web", T.web, { maxLength: 300, type: "url", inputMode: "url" })}
      </div>

      <input type="hidden" name="latitud" value={valores.latitud} />
      <input type="hidden" name="longitud" value={valores.longitud} />
      <input type="hidden" name="osm_id" value={valores.osm_id} />
      <input type="hidden" name="link_google_maps" value={valores.link_google_maps} />
      <div className="flex flex-wrap items-center gap-3 font-plex text-xs text-acero">
        <span aria-hidden className={`size-2 ${valores.latitud ? "bg-blanco" : "border border-acero"}`} />
        {valores.latitud
          ? T.ubicacion.replace("{coordenadas}", `${Number(valores.latitud).toFixed(5)}, ${Number(valores.longitud).toFixed(5)}`).replace("{precision}", precision === "aproximada" ? T.aproximada : T.exacta)
          : T.sinUbicar}
        {valores.latitud ? (
          <button type="button" onClick={() => (setValores((v) => ({ ...v, latitud: "", longitud: "", osm_id: "" })), setPrecision(null))} className="uppercase tracking-etiqueta hover:text-blanco">
            {T.quitarUbicacion}
          </button>
        ) : null}
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
