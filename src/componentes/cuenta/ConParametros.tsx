"use client";

import { useSearchParams } from "next/navigation";
import { CUENTA } from "@/datos/textos";
import { destinoSeguro, esNicho, origenSeguro } from "@/servidor/cuenta/validacion";
import { FormularioIngreso } from "./FormularioIngreso";
import { FormularioRegistro, type PromoRegistro } from "./FormularioRegistro";
import { PROMO } from "@/datos/promo";

/**
 * Los formularios que dependen de la dirección (?nicho=, ?siguiente=).
 * Se leen en el navegador para que las páginas sigan siendo estáticas: en
 * el HTML va el formulario sin preelegir (el fallback del <Suspense>) y al
 * cargar se completa con lo que diga la dirección.
 */
export function RegistroConParametros({ promo = null }: { promo?: PromoRegistro | null }) {
  const parametros = useSearchParams();
  const nicho = parametros.get("nicho") ?? "";
  const origen = parametros.get("origen") ?? parametros.get("utm_source") ?? "";
  // La promo "Primeros 100" solo si vino con ?promo=primeros-100 y la base la tiene.
  const conPromo = parametros.get("promo") === PROMO.id ? promo : null;
  return <FormularioRegistro nicho={esNicho(nicho) ? nicho : ""} origen={origenSeguro(origen) || (conPromo ? PROMO.id : "")} promo={conPromo} />;
}

export function IngresoConParametros() {
  const parametros = useSearchParams();
  const aviso = parametros.get("error") === "enlace" ? CUENTA.errores.enlace : undefined;
  return <FormularioIngreso siguiente={destinoSeguro(parametros.get("siguiente"))} aviso={aviso} />;
}
