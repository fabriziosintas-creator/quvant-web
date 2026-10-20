"use client";

import { useActionState, useEffect, useRef } from "react";
import { CUENTA } from "@/datos/textos";
import { cambiarContrasena, guardarPerfil, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, Campo, CampoContrasena, Casilla } from "./Campos";
import { CLASE_BOTON, CLASE_ETIQUETA } from "./estilos";
import { enviarSinReiniciar } from "./enviarSinReiniciar";
import { EleccionPerfil } from "./EleccionPerfil";

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, cuenta } = CUENTA;

/** Lo que la cuenta deja editar (el resto del perfil no viaja al navegador). */
export type PerfilEditable = {
  email: string;
  nombre: string;
  apellido: string;
  nicho: string;
  nichoOtro: string;
  objetivo: string;
  empresa: string;
  ciudad: string;
  telefono: string;
  novedades: boolean;
};

const titulo = (texto: string) => (
  <h2 className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">
    <span aria-hidden className="size-1.5 bg-[var(--acento)]" />
    {texto}
  </h2>
);

export function DatosCuenta({ perfil }: { perfil: PerfilEditable }) {
  const [estado, enviar, enviando] = useActionState(guardarPerfil, INICIAL);
  // Después de guardar (o de un error), lo último que se mandó; si no, lo de la base.
  const v = { ...perfil, ...(estado.valores ?? {}) } as PerfilEditable;
  const e = estado.errores ?? {};

  return (
    <section aria-labelledby="datos-titulo" className="flex flex-col gap-7">
      <div id="datos-titulo">{titulo(cuenta.datos.titulo)}</div>
      <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-7">
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

        <div>
          <p className={CLASE_ETIQUETA}>{cuenta.datos.email}</p>
          <p className="border border-profundo bg-profundo/30 px-4 py-3 font-plex text-sm text-blanco">{perfil.email}</p>
          <p className="mt-2 font-plex text-xs text-acero">{cuenta.datos.emailNota}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo name="nombre" etiqueta={campos.nombre.etiqueta} autoComplete="given-name" defaultValue={v.nombre} maxLength={80} required error={e.nombre} />
          <Campo name="apellido" etiqueta={campos.apellido.etiqueta} autoComplete="family-name" defaultValue={v.apellido} maxLength={80} error={e.apellido} />
        </div>

        <EleccionPerfil nicho={v.nicho} nichoOtro={v.nichoOtro} objetivo={v.objetivo} errores={e} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo name="empresa" etiqueta={campos.empresa.etiqueta} placeholder={campos.empresa.marcador} autoComplete="organization" defaultValue={v.empresa} maxLength={120} error={e.empresa} />
          <Campo name="ciudad" etiqueta={campos.ciudad.etiqueta} placeholder={campos.ciudad.marcador} autoComplete="address-level2" defaultValue={v.ciudad} maxLength={80} error={e.ciudad} />
        </div>
        <Campo
          name="telefono"
          type="tel"
          etiqueta={campos.telefono.etiqueta}
          placeholder={campos.telefono.marcador}
          autoComplete="tel"
          inputMode="tel"
          defaultValue={v.telefono}
          maxLength={40}
          error={e.telefono}
        />

        <Casilla name="novedades" defaultChecked={v.novedades}>
          {campos.novedades}
        </Casilla>

        {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
        <div>
          <button type="submit" disabled={enviando} className={CLASE_BOTON}>
            {enviando ? cuenta.datos.guardando : cuenta.datos.guardar}
          </button>
        </div>
      </form>
    </section>
  );
}

export function CambiarContrasena({ destacar = false }: { destacar?: boolean }) {
  const [estado, enviar, enviando] = useActionState(cambiarContrasena, INICIAL);
  const e = estado.errores ?? {};
  const formulario = useRef<HTMLFormElement>(null);
  // Si salió bien, la contraseña nueva no queda escrita en pantalla.
  useEffect(() => {
    if (estado.estado === "listo") formulario.current?.reset();
  }, [estado]);
  return (
    <section
      id="contrasena"
      aria-labelledby="contrasena-titulo"
      className={`flex scroll-mt-32 flex-col gap-7 ${destacar ? "border border-blanco p-5 md:p-7" : ""}`}
    >
      <div id="contrasena-titulo">{titulo(cuenta.contrasena.titulo)}</div>
      <form ref={formulario} onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-6">
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoContrasena
            name="nueva"
            etiqueta={cuenta.contrasena.nueva}
            ayuda={campos.contrasena.ayuda}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            autoFocus={destacar}
            error={e.nueva}
          />
          <CampoContrasena
            name="repetida"
            etiqueta={cuenta.contrasena.repetir}
            autoComplete="new-password"
            maxLength={72}
            required
            error={e.repetida}
          />
        </div>
        {estado.estado === "listo" && estado.mensaje ? <Aviso tipo="listo">{estado.mensaje}</Aviso> : null}
        <div>
          <button type="submit" disabled={enviando} className={CLASE_BOTON}>
            {enviando ? cuenta.contrasena.cambiando : cuenta.contrasena.boton}
          </button>
        </div>
      </form>
    </section>
  );
}
