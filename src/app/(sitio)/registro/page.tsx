import type { Metadata } from "next";
import { Suspense } from "react";
import { RegistroConParametros } from "@/componentes/cuenta/ConParametros";
import { FormularioRegistro } from "@/componentes/cuenta/FormularioRegistro";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { CUENTA } from "@/datos/textos";

export const metadata: Metadata = {
  title: `${CUENTA.registro.metaTitulo} | Quvant`,
  description: CUENTA.registro.bajada,
  alternates: { canonical: "/registro" },
};

/** Registro de personas: crea la cuenta y manda el email de confirmación. */
export default function Registro() {
  return (
    <MarcoCuenta titulo={CUENTA.registro.titulo} bajada={CUENTA.registro.bajada}>
      <Suspense fallback={<FormularioRegistro />}>
        <RegistroConParametros />
      </Suspense>
    </MarcoCuenta>
  );
}
