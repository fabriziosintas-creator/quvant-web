import type { Metadata } from "next";
import { FormularioRecuperar } from "@/componentes/cuenta/FormularioRecuperar";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { CUENTA } from "@/datos/textos";

export const metadata: Metadata = {
  title: `${CUENTA.recuperar.metaTitulo} | Quvant`,
  robots: { index: false, follow: true },
};

/** Pide el email y manda el enlace para elegir una contraseña nueva. */
export default function Recuperar() {
  return (
    <MarcoCuenta titulo={CUENTA.recuperar.titulo} bajada={CUENTA.recuperar.bajada}>
      <FormularioRecuperar />
    </MarcoCuenta>
  );
}
