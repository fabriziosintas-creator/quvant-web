"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CUENTA } from "@/datos/textos";
import { reenviarConfirmacion, registrarse, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, CampoContrasena, Campo, Casilla } from "./Campos";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_ENLACE } from "./estilos";
import { EleccionPerfil } from "./EleccionPerfil";

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, registro } = CUENTA;

/** El id anónimo de la visita (lo crea la medición de la web; si no hay, va vacío). */
const CLAVE_VISITA = "quvant-visita";

function leerVisita() {
  try {
    return window.localStorage.getItem(CLAVE_VISITA) ?? "";
  } catch {
    return "";
  }
}

/**
 * El registro: nombre, email y contraseña; rubro y objetivo (obligatorios);
 * empresa y ciudad (opcionales); novedades y privacidad. Si la persona
 * llegó desde un rubro, ese rubro viene elegido. Al terminar, la pantalla
 * de "Revisá tu email" con el botón para mandar el enlace de nuevo.
 */
export function FormularioRegistro({ nicho = "", origen = "" }: { nicho?: string; origen?: string }) {
  const [estado, enviar, enviando] = useActionState(registrarse, INICIAL);
  const [visita, setVisita] = useState("");
  useEffect(() => {
    const id = leerVisita();
    if (id) queueMicrotask(() => setVisita(id));
  }, []);

  if (estado.estado === "listo") {
    return <RevisaTuEmail email={String(estado.valores?.email ?? "")} />;
  }

  const v = estado.valores ?? {};
  const e = estado.errores ?? {};
  const cadena = (campo: string) => (typeof v[campo] === "string" ? (v[campo] as string) : undefined);

  return (
    <form action={enviar} noValidate className="flex flex-col gap-7">
      <input type="hidden" name="origen" value={origen} />
      <input type="hidden" name="visita" value={visita} />

      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          name="nombre"
          etiqueta={campos.nombre.etiqueta}
          placeholder={campos.nombre.marcador}
          autoComplete="given-name"
          defaultValue={cadena("nombre")}
          maxLength={80}
          required
          error={e.nombre}
        />
        <Campo
          name="apellido"
          etiqueta={campos.apellido.etiqueta}
          placeholder={campos.apellido.marcador}
          autoComplete="family-name"
          defaultValue={cadena("apellido")}
          maxLength={80}
          error={e.apellido}
        />
      </div>

      <Campo
        name="email"
        type="email"
        etiqueta={campos.email.etiqueta}
        placeholder={campos.email.marcador}
        autoComplete="email"
        inputMode="email"
        defaultValue={cadena("email")}
        maxLength={254}
        required
        error={e.email}
      />

      <CampoContrasena
        name="contrasena"
        etiqueta={campos.contrasena.etiqueta}
        ayuda={campos.contrasena.ayuda}
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        error={e.contrasena}
      />

      <EleccionPerfil
        nicho={cadena("nicho") ?? nicho}
        nichoOtro={cadena("nichoOtro")}
        objetivo={cadena("objetivo")}
        errores={e}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          name="empresa"
          etiqueta={campos.empresa.etiqueta}
          placeholder={campos.empresa.marcador}
          autoComplete="organization"
          defaultValue={cadena("empresa")}
          maxLength={120}
          error={e.empresa}
        />
        <Campo
          name="ciudad"
          etiqueta={campos.ciudad.etiqueta}
          placeholder={campos.ciudad.marcador}
          autoComplete="address-level2"
          defaultValue={cadena("ciudad")}
          maxLength={80}
          error={e.ciudad}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-profundo pt-6">
        <Casilla name="novedades" defaultChecked={v.novedades === true}>
          {campos.novedades}
        </Casilla>
        <Casilla name="privacidad" defaultChecked={v.privacidad === true} required error={e.privacidad}>
          {campos.privacidad.antes}
          <Link href="/privacidad" target="_blank" className={CLASE_ENLACE}>
            {campos.privacidad.enlace}
          </Link>
          {campos.privacidad.despues}
        </Casilla>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? registro.enviando : registro.boton}
        </button>
        <p className="font-plex text-sm text-acero">
          {registro.yaTenes}{" "}
          <Link href="/ingresar" className={CLASE_ENLACE}>
            {registro.ingresar}
          </Link>
        </p>
      </div>
    </form>
  );
}

/** Después del registro: el aviso y el botón para mandar el enlace de nuevo. */
function RevisaTuEmail({ email }: { email: string }) {
  const [estado, reenviar, reenviando] = useActionState(reenviarConfirmacion, INICIAL);
  const { listo } = registro;
  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <div className="border border-profundo p-6 md:p-8">
        <p className="flex items-center gap-3 font-michroma text-xs uppercase tracking-etiqueta text-blanco">
          <span aria-hidden className="size-2.5 bg-blanco" />
          {listo.titulo}
        </p>
        <p className="mt-5 font-lectura text-base leading-relaxed text-blanco">
          {listo.texto.replace("{email}", email)}
        </p>
        <p className="mt-3 font-lectura text-sm leading-relaxed text-acero">{listo.nota}</p>
        <p className="mt-3 font-lectura text-sm leading-relaxed text-acero">{listo.yaTenia}</p>
      </div>
      <form action={reenviar} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
        {estado.estado === "listo" ? <Aviso tipo="listo">{listo.reenviado}</Aviso> : null}
        <div>
          <button type="submit" disabled={reenviando} className={CLASE_BOTON_SECUNDARIO}>
            {listo.reenviar}
          </button>
        </div>
      </form>
    </div>
  );
}
