import "server-only";
import { redirect } from "next/navigation";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteServidor } from "@/supabase/servidor";
import type { Tables } from "@/supabase/tipos";

export type Perfil = Tables<"perfiles">;

/**
 * Quién entró, validando la firma del token (getClaims), o null. Lee las
 * cookies: con Cache Components, quien lo llame tiene que estar dentro de
 * un <Suspense> o ser una acción del servidor.
 */
export async function usuarioActual() {
  if (!configSupabase()) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  return { id, supabase };
}

/** El perfil de quien entró. Sin sesión (o sin perfil), a /ingresar. */
export async function exigirPerfil(siguiente = "/cuenta") {
  const usuario = await usuarioActual();
  if (!usuario) redirect(`/ingresar?siguiente=${encodeURIComponent(siguiente)}`);
  const { data: perfil } = await usuario.supabase
    .from("perfiles")
    .select("*")
    .eq("id", usuario.id)
    .single();
  if (!perfil) redirect(`/ingresar?siguiente=${encodeURIComponent(siguiente)}`);
  return { perfil, supabase: usuario.supabase };
}
