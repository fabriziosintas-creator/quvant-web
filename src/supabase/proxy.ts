import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "./entorno";

/**
 * Renueva la sesión antes de que se dibuje la página: los Server Components
 * no pueden escribir cookies, así que si el token venció lo cambia acá, se
 * lo pasa a la página (cookies del pedido) y al navegador (cookies de la
 * respuesta).
 *
 * La mayoría de las visitas no tiene sesión: sin cookies "sb-…" no se llama
 * a Supabase y la web pública no paga nada. Si Supabase no está configurado
 * o no responde, la página sigue de largo.
 */
export async function actualizarSesion(pedido: NextRequest) {
  let respuesta = NextResponse.next({ request: pedido });

  const config = configSupabase();
  const tieneSesion = pedido.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (!config || !tieneSesion) return respuesta;

  const supabase = createServerClient(config.url, config.clavePublica, {
    cookies: {
      getAll: () => pedido.cookies.getAll(),
      setAll(cookiesNuevas, cabeceras) {
        cookiesNuevas.forEach(({ name, value }) => pedido.cookies.set(name, value));
        respuesta = NextResponse.next({ request: pedido });
        cookiesNuevas.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        // Que ninguna caché guarde una respuesta con el token de otra persona.
        Object.entries(cabeceras).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  try {
    // Nada entre crear el cliente y esta llamada: es la que renueva el token.
    await supabase.auth.getClaims();
  } catch {
    // Supabase caído o sin red: mejor una página sin sesión que una caída.
  }

  return respuesta;
}
