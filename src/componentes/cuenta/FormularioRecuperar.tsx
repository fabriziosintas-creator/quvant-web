"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CUENTA } from "@/datos/textos";
import { pedirRecuperacion, type EstadoFormulario } from "@/servidor/cuenta/acciones";
import { Aviso, Campo } from "./Campos";
import { CLASE_BOTON, CLASE_ENLACE } from "./estilos";

const INICIAL: EstadoFormulario = { estado: "inicial" };
const { campos, recuperar } = CUENTA;

/** Pide el enlace para elegir una contraseña nueva. Mismo aviso haya o no una cuenta con ese email. */
export function FormularioRecuperar() {
  const [estado, enviar, enviando] = useActionState(pedirRecuperacion, INICIAL);
  const email = typeof estado.valores?.email === "string" ? estado.valores.email : undefined;

  return (
    <div className="flex flex-col gap-6">
      {estado.estado === "listo" ? (
        <Aviso tipo="listo">{recuperar.listo}</Aviso>
      ) : (
        <form action={enviar} noValidate className="flex flex-col gap-6">
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
            error={estado.errores?.email}
          />
          <div>
            <button type="submit" disabled={enviando} className={CLASE_BOTON}>
              {enviando ? recuperar.enviando : recuperar.boton}
            </button>
          </div>
        </form>
      )}
      <p className="border-t border-profundo pt-6 font-plex text-sm">
        <Link href="/ingresar" className={CLASE_ENLACE}>
          {recuperar.volver}
        </Link>
      </p>
    </div>
  );
}
