import "server-only";
import { createClient } from "@supabase/supabase-js";
import { exigirConfigSupabase } from "./entorno";

/**
 * Cliente con la clave SECRETA: saltea RLS y ve toda la base. Solo para
 * tareas del servidor que no actúan en nombre de nadie (guardar eventos,
 * mandar la bienvenida, el aviso interno). Nunca para responder con datos
 * que pidió una persona: para eso, crearClienteServidor().
 *
 * "server-only" hace fallar el build si alguien lo importa desde el
 * navegador, y la variable no lleva NEXT_PUBLIC_, así que Next nunca la
 * incrusta en el código que baja al navegador.
 */
export function crearClienteAdmin() {
  const { url } = exigirConfigSupabase();
  const claveSecreta = process.env.SUPABASE_SECRET_KEY;
  if (!claveSecreta) {
    throw new Error("Falta SUPABASE_SECRET_KEY (ver .env.example).");
  }

  return createClient(url, claveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
