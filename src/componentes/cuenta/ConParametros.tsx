"use client";

import { useSearchParams } from "next/navigation";
import { CUENTA } from "@/datos/textos";
import { destinoSeguro, esNicho, origenSeguro } from "@/servidor/cuenta/validacion";
import { FormularioIngreso } from "./FormularioIngreso";
import { FormularioRegistro } from "./FormularioRegistro";

/**
 * Los formularios que dependen de la dirección (?nicho=, ?siguiente=).
 * Se leen en el navegador para que las páginas sigan siendo estáticas: en
 * el HTML va el formulario sin preelegir (el fallback del <Suspense>) y al
 * cargar se completa con lo que diga la dirección.
 */
export function RegistroConParametros() {
  const parametros = useSearchParams();
  const nicho = parametros.get("nicho") ?? "";
  const origen = parametros.get("origen") ?? parametros.get("utm_source") ?? "";
  return <FormularioRegistro nicho={esNicho(nicho) ? nicho : ""} origen={origenSeguro(origen)} />;
}

export function IngresoConParametros() {
  const parametros = useSearchParams();
  const aviso = parametros.get("error") === "enlace" ? CUENTA.errores.enlace : undefined;
  return <FormularioIngreso siguiente={destinoSeguro(parametros.get("siguiente"))} aviso={aviso} />;
}
