import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { exigirConfigSupabase } from "./entorno";
import type { Database } from "./tipos";

/**
 * Cliente para Server Components, Server Actions y Route Handlers. Actúa
 * como la persona que entró (lee su sesión de las cookies), así que la base
 * le aplica las reglas de RLS como a cualquiera. Uno nuevo por pedido:
 * nunca guardarlo en una variable global.
 *
 * Para saber quién es, usar `supabase.auth.getClaims()` (valida la firma
 * del token); nunca `getSession()` del lado del servidor.
 */
export async function crearClienteServidor() {
  const { url, clavePublica } = exigirConfigSupabase();
  const almacen = await cookies();

  return createServerClient<Database>(url, clavePublica, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll(cookiesNuevas) {
        try {
          cookiesNuevas.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Un Server Component no puede escribir cookies. No pasa nada:
          // el proxy (src/proxy.ts) ya renovó la sesión antes de llegar acá.
        }
      },
    },
  });
}
