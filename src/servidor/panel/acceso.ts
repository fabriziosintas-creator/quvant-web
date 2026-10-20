import "server-only";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/servidor/cuenta/sesion";

/**
 * Quién puede entrar al panel: solo admin (rol en perfiles, que se da por
 * la lista de emails y el email confirmado; ver supabase/migrations).
 *
 * Se verifica en el servidor de cada página, acción y ruta del panel; el
 * proxy y el encabezado solo apuran el camino. Sin sesión, a /ingresar; con
 * sesión pero sin ser admin, a la portada, sin decir que el panel existe.
 */

async function perfilAdmin() {
  const usuario = await usuarioActual();
  if (!usuario) return { usuario: null, perfil: null };
  const { data: perfil } = await usuario.supabase
    .from("perfiles")
    .select("id, nombre, apellido, email, rol")
    .eq("id", usuario.id)
    .single();
  return { usuario, perfil: perfil?.rol === "admin" ? perfil : null };
}

/** Para páginas y acciones: el admin y su cliente, o redirige. */
export async function exigirAdmin(siguiente = "/panel") {
  const { usuario, perfil } = await perfilAdmin();
  if (!usuario) redirect(`/ingresar?siguiente=${encodeURIComponent(siguiente)}`);
  if (!perfil) redirect("/");
  return { perfil, supabase: usuario.supabase };
}

/** Para rutas de la API: el admin o null (la ruta responde 401). */
export async function adminDelPedido() {
  const { usuario, perfil } = await perfilAdmin();
  return usuario && perfil ? { perfil, supabase: usuario.supabase } : null;
}
