import { createBrowserClient } from "@supabase/ssr";
import { exigirConfigSupabase } from "./entorno";

/**
 * Cliente para componentes del navegador ("use client"). Usa solo la clave
 * publishable, que es pública a propósito: lo que protege los datos son las
 * reglas de RLS de la base. En el navegador devuelve siempre la misma
 * instancia.
 */
export function crearClienteNavegador() {
  const { url, clavePublica } = exigirConfigSupabase();
  return createBrowserClient(url, clavePublica);
}
