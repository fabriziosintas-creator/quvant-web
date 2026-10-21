import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { armarAvisoRegistro, armarBienvenida } from "@/emails/armar";
import type { LugarEmail } from "@/emails/EmailsCuenta";
import type { IdBeneficio } from "@/datos/promo";
import { crearClienteAdmin } from "@/supabase/admin";
import { whatsappSiCorresponde } from "@/servidor/avisos/crear";
import { enviarEmail } from "./enviar";

/**
 * Lo que pasa cuando alguien confirma su email: la bienvenida (según su
 * rubro y su objetivo) y, si está activado, el aviso interno a los socios.
 *
 * Por qué acá y no con un webhook de la base: la confirmación ya pasa por
 * /auth/confirmar, que tiene los datos a mano y corre en el mismo servidor
 * que manda los emails. Un webhook necesitaría una dirección pública (no
 * anda probando en la computadora), un secreto más y otra pieza que puede
 * fallar. Para que salga una sola vez, se marca bienvenida_enviada_en antes
 * de mandar (si dos pedidos llegan juntos, solo uno encuentra la marca vacía).
 *
 * El aviso interno se activa con AVISO_REGISTROS_PARA (emails separados por
 * coma, en .env.local y en Vercel; no en el repo, que es público).
 *
 * Con "Primeros 100": la base da el lugar al confirmar (antes de que esto
 * corra), así que acá se lee y los dos emails lo dicen.
 */

/** El lugar de la promo, si lo pidió. Sin la tabla (migración sin aplicar), null. */
async function lugarDe(admin: SupabaseClient, idPerfil: string): Promise<LugarEmail | null> {
  const [{ data: lugar }, { data: config }] = await Promise.all([
    admin.from("promo_lugares").select("numero, beneficio, estado").eq("perfil_id", idPerfil).maybeSingle(),
    admin.from("promo_config").select("tope").maybeSingle(),
  ]);
  if (!lugar || lugar.estado === "pedido") return null;
  return { numero: lugar.numero as number | null, beneficio: lugar.beneficio as IdBeneficio, tope: (config?.tope as number | undefined) ?? 100 };
}
export async function despuesDeConfirmar(idPerfil: string) {
  const admin = crearClienteAdmin();
  const { data: perfil, error } = await admin
    .from("perfiles")
    .update({ bienvenida_enviada_en: new Date().toISOString() })
    .eq("id", idPerfil)
    .is("bienvenida_enviada_en", null)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[emails] no se pudo marcar la bienvenida:", error.message);
    return;
  }
  if (!perfil) return; // ya se había mandado

  const promo = await lugarDe(admin as unknown as SupabaseClient, idPerfil).catch(() => null);
  const bienvenida = await armarBienvenida({ nombre: perfil.nombre, nicho: perfil.nicho_id, objetivo: perfil.objetivo_id, promo });
  const resultado = await enviarEmail(perfil.email, bienvenida);
  if (!resultado.ok) {
    console.error("[emails] bienvenida:", resultado.motivo);
    // Queda sin marcar para poder mandarla de nuevo más adelante.
    await admin.from("perfiles").update({ bienvenida_enviada_en: null }).eq("id", idPerfil);
  }

  // El aviso del panel lo crea la base al registrarse; por WhatsApp sale al confirmar, si algún socio lo pidió.
  await whatsappSiCorresponde("registro", `Se registró ${perfil.nombre}${perfil.empresa ? ` (${perfil.empresa})` : ""}`, `Rubro: ${perfil.nicho_id} · Objetivo: ${perfil.objetivo_id}`, "/panel/comercial");

  const para = (process.env.AVISO_REGISTROS_PARA ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  if (para.length === 0) return;

  const aviso = await armarAvisoRegistro({
    nombre: perfil.nombre,
    apellido: perfil.apellido,
    email: perfil.email,
    nicho: perfil.nicho_id,
    nichoOtro: perfil.nicho_otro,
    objetivo: perfil.objetivo_id,
    empresa: perfil.empresa,
    ciudad: perfil.ciudad,
    novedades: perfil.acepta_novedades,
    origen: perfil.origen,
    telefono: perfil.telefono,
    promo,
  });
  const avisado = await enviarEmail(para, aviso);
  if (!avisado.ok) console.error("[emails] aviso interno:", avisado.motivo);
}
