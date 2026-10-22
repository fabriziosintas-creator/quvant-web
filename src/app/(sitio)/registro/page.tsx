import type { Metadata } from "next";
import { Suspense } from "react";
import { RegistroConParametros } from "@/componentes/cuenta/ConParametros";
import { FormularioRegistro } from "@/componentes/cuenta/FormularioRegistro";
import { MarcoCuenta } from "@/componentes/cuenta/MarcoCuenta";
import { CUENTA } from "@/datos/textos";
import { obtenerEstadoPromo, promoAbierta } from "@/servidor/promo/estado";

export const metadata: Metadata = {
  title: `${CUENTA.registro.metaTitulo} | Quvant`,
  description: CUENTA.registro.bajada,
  alternates: { canonical: "/registro" },
};

/**
 * Registro de personas: crea la cuenta y manda el email de confirmación.
 * Los números de la promo "Primeros 100" salen de la base en caché (un
 * minuto); el formulario los muestra solo si la dirección trae ?promo=.
 */
export default async function Registro() {
  const estado = await obtenerEstadoPromo();
  const promo = estado
    ? { quedan: estado.quedan, tope: estado.tope, abierta: promoAbierta(estado), rubrosSistema: estado.rubros_sistema }
    : null;
  return (
    <MarcoCuenta titulo={CUENTA.registro.titulo} bajada={CUENTA.registro.bajada} ancho="amplio">
      <Suspense fallback={<FormularioRegistro />}>
        <RegistroConParametros promo={promo} />
      </Suspense>
    </MarcoCuenta>
  );
}
