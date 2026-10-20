import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { after, type NextRequest } from "next/server";
import { destinoSeguro } from "@/servidor/cuenta/validacion";
import { despuesDeConfirmar } from "@/servidor/emails/bienvenida";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteServidor } from "@/supabase/servidor";

/**
 * Adonde llevan los enlaces de los emails (confirmar la cuenta, recuperar
 * la contraseña). Acepta las dos formas que manda Supabase:
 *   · ?token_hash=…&type=… (las plantillas propias: anda aunque el email
 *     se abra en otro dispositivo);
 *   · ?code=… (las plantillas por defecto: solo en el mismo navegador).
 * Si sale bien, la persona queda con la sesión iniciada y va a `siguiente`.
 */
export async function GET(pedido: NextRequest) {
  const parametros = pedido.nextUrl.searchParams;
  const tokenHash = parametros.get("token_hash");
  const tipo = parametros.get("type") as EmailOtpType | null;
  const codigo = parametros.get("code");
  const siguiente = destinoSeguro(parametros.get("siguiente") ?? parametros.get("next"));

  if (!configSupabase() || (!codigo && !(tokenHash && tipo))) redirect("/ingresar?error=enlace");

  const supabase = await crearClienteServidor();
  const { data, error } =
    tokenHash && tipo
      ? await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
      : await supabase.auth.exchangeCodeForSession(codigo!);

  if (error) {
    console.error("[auth/confirmar]", error.code, error.message);
    redirect("/ingresar?error=enlace");
  }

  // Al confirmar la cuenta, la bienvenida; al recuperar, el destino ya pide la contraseña nueva.
  const destino = new URL(siguiente, pedido.nextUrl.origin);
  const confirmoCuenta = tipo ? tipo === "signup" || tipo === "email" : !destino.searchParams.has("contrasena");
  if (confirmoCuenta) {
    destino.searchParams.set("bienvenida", "1");
    // El email de bienvenida (y el aviso a los socios) sale después de responder: no demora la entrada.
    const id = data.user?.id;
    if (id) after(() => despuesDeConfirmar(id));
  }
  if (tipo === "recovery") {
    destino.pathname = "/cuenta";
    destino.searchParams.set("contrasena", "nueva");
  }
  redirect(`${destino.pathname}${destino.search}`);
}
