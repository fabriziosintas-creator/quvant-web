import type { Metadata } from "next";
import { Suspense } from "react";
import { IngresoConParametros } from "@/componentes/cuenta/ConParametros";
import { FormularioIngreso } from "@/componentes/cuenta/FormularioIngreso";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { CUENTA } from "@/datos/textos";

export const metadata: Metadata = {
  title: `${CUENTA.ingreso.metaTitulo} | Quvant`,
  robots: { index: false, follow: true },
};

/** Ingreso con email y contraseña, con "Olvidé mi contraseña" y el link al registro. */
export default function Ingresar() {
  return (
    <MarcoCuenta titulo={CUENTA.ingreso.titulo} bajada={CUENTA.ingreso.bajada}>
      <Suspense fallback={<FormularioIngreso />}>
        <IngresoConParametros />
      </Suspense>
    </MarcoCuenta>
  );
}
