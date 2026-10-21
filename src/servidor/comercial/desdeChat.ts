import "server-only";
import type { Pedido } from "@/servidor/chat/tipos";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteAdmin } from "@/supabase/admin";

/**
 * Cuando el chat de la web junta un pedido con contacto, se crea la
 * oportunidad (origen "chat"). El chat guarda en Redis, no en Supabase: por
 * eso se hace acá, con la clave secreta. Nunca rompe el chat: si falla
 * (sin clave, sin la migración), solo queda en el registro del servidor.
 */
export async function oportunidadDesdeChat(conversacionId: string, pedido: Omit<Pedido, "registrado">) {
  if (!configSupabase() || !process.env.SUPABASE_SECRET_KEY) return;
  try {
    const supabase = crearClienteAdmin();
    const esEmail = pedido.medio === "email" || pedido.contacto.includes("@");
    const { error } = await supabase.from("oportunidades").insert({
      origen: "chat",
      conversacion_id: conversacionId.slice(0, 80),
      negocio: (pedido.empresa || pedido.nombre || "Contacto del chat").slice(0, 160),
      contacto: pedido.nombre?.slice(0, 120) || null,
      email: esEmail ? pedido.contacto.slice(0, 200) : null,
      telefono: esEmail ? null : pedido.contacto.slice(0, 60),
      proximo_paso: `Necesita: ${pedido.necesidad}. ${pedido.detalle}`.slice(0, 300),
    });
    // 23505: ya había una oportunidad de esta charla.
    if (error && error.code !== "23505") console.error("[comercial] desde el chat:", error.message);
  } catch (error) {
    console.error("[comercial] desde el chat:", error instanceof Error ? error.message : error);
  }
}
