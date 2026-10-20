"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CUENTA } from "@/datos/textos";
import { ingresar, reenviarConfirmacion, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, Campo, CampoContrasena } from "./Campos";
import { CLASE_BOTON, CLASE_BOTON_SECUNDARIO, CLASE_ENLACE } from "./estilos";
import { enviarSinReiniciar } from "./enviarSinReiniciar";

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, ingreso, registro } = CUENTA;

/**
 * Ingreso con email y contraseña. Si el email todavía no está confirmado,
 * ofrece mandar el enlace de nuevo. `siguiente` es adónde volver (lo valida
 * el servidor: solo rutas de este sitio).
 */
export function FormularioIngreso({ siguiente = "/cuenta", aviso }: { siguiente?: string; aviso?: string }) {
  const [estado, enviar, enviando] = useActionState(ingresar, INICIAL);
  const email = typeof estado.valores?.email === "string" ? estado.valores.email : undefined;
  const e = estado.errores ?? {};

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={enviarSinReiniciar(enviar)} noValidate className="flex flex-col gap-6">
        <input type="hidden" name="siguiente" value={siguiente} />
        {aviso && estado.estado === "inicial" ? <Aviso tipo="error">{aviso}</Aviso> : null}
        {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

        <Campo
          name="email"
          type="email"
          etiqueta={campos.email.etiqueta}
          placeholder={campos.email.marcador}
          autoComplete="email"
          inputMode="email"
          defaultValue={email}
          required
          error={e.email}
        />
        <CampoContrasena
          name="contrasena"
          etiqueta={campos.contrasena.etiqueta}
          autoComplete="current-password"
          required
          error={e.contrasena}
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={enviando} className={CLASE_BOTON}>
            {enviando ? ingreso.enviando : ingreso.boton}
          </button>
          <Link href="/ingresar/recuperar" className={`font-plex text-sm ${CLASE_ENLACE}`}>
            {ingreso.olvide}
          </Link>
        </div>
      </form>

      {estado.sinConfirmar && email ? <ReenviarEnlace email={email} /> : null}

      <p className="border-t border-profundo pt-6 font-plex text-sm text-acero">
        {ingreso.sinCuenta}{" "}
        <Link href="/registro" className={CLASE_ENLACE}>
          {ingreso.registrate}
        </Link>
      </p>
    </div>
  );
}

function ReenviarEnlace({ email }: { email: string }) {
  const [estado, reenviar, reenviando] = useActionState(reenviarConfirmacion, INICIAL);
  return (
    <form action={reenviar} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      {estado.estado === "listo" ? <Aviso tipo="listo">{registro.listo.reenviado}</Aviso> : null}
      {estado.estado === "error" && estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      <div>
        <button type="submit" disabled={reenviando} className={CLASE_BOTON_SECUNDARIO}>
          {ingreso.reenviar}
        </button>
      </div>
    </form>
  );
}
