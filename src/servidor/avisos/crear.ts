import "server-only";
import { PRIORIDAD, type TipoAviso } from "@/avisos/avisos";
import { SITIO } from "@/datos/sitio";
import { avisarPorWhatsApp, canalAvisos } from "@/servidor/chat/whatsapp";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteAdmin } from "@/supabase/admin";

/**
 * Crea un aviso del panel desde el servidor (chat, objetivos, oportunidades
 * estancadas), con la clave secreta. Un mismo hecho, un solo aviso (clave
 * única). Si es nuevo y algún socio lo quiere también por WhatsApp, sale
 * por el canal de avisos que ya existe (CallMeBot o la API de Meta). Nunca
 * rompe lo que lo llamó: si falla, queda en el registro del servidor.
 */

export type NuevoAviso = { tipo: TipoAviso; titulo: string; texto?: string; enlace?: string; clave: string; paraPerfil?: string | null; esPrueba?: boolean; /** El chat ya manda su propio WhatsApp: no se repite. */ sinWhatsApp?: boolean };

const POR_DEFECTO_WHATSAPP: TipoAviso[] = ["registro", "chat", "alerta_roja", "copia_detectada"];

export async function crearAviso(a: NuevoAviso): Promise<boolean> {
  if (!configSupabase() || !process.env.SUPABASE_SECRET_KEY) return false;
  try {
    const supabase = crearClienteAdmin();
    const { data, error } = await supabase
      .from("avisos")
      .upsert(
        { tipo: a.tipo, titulo: a.titulo.slice(0, 160), texto: a.texto?.slice(0, 400) ?? null, enlace: a.enlace ?? null, prioridad: PRIORIDAD[a.tipo], clave: a.clave.slice(0, 200), para_perfil: a.paraPerfil ?? null, es_prueba: a.esPrueba ?? false },
        { onConflict: "clave", ignoreDuplicates: true },
      )
      .select("id");
    if (error) {
      console.error("[avisos] crear:", error.message);
      return false;
    }
    const nuevo = (data ?? []).length > 0;
    if (nuevo && !a.esPrueba && !a.sinWhatsApp) await whatsappSiCorresponde(a.tipo, a.titulo, a.texto, a.enlace);
    return nuevo;
  } catch (error) {
    console.error("[avisos] crear:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Manda el aviso por WhatsApp si algún socio lo pidió para ese tipo (por defecto: registro, chat y alerta roja). */
export async function whatsappSiCorresponde(tipo: TipoAviso, titulo: string, texto?: string, enlace?: string) {
  if (canalAvisos() === "ninguno" || !process.env.SUPABASE_SECRET_KEY) return;
  try {
    const supabase = crearClienteAdmin();
    const [{ data: admins }, { data: preferencias }] = await Promise.all([
      supabase.from("perfiles").select("id").eq("rol", "admin"),
      supabase.from("avisos_preferencias").select("perfil_id, por_whatsapp"),
    ]);
    const quiere = (admins ?? []).some((adm) => {
      const p = (preferencias ?? []).find((x) => x.perfil_id === adm.id);
      return (p ? p.por_whatsapp : POR_DEFECTO_WHATSAPP).includes(tipo);
    });
    if (!quiere) return;
    await avisarPorWhatsApp(["■ " + titulo, texto, enlace ? `${SITIO.url}${enlace}` : null].filter(Boolean).join("\n"));
  } catch (error) {
    console.error("[avisos] whatsapp:", error instanceof Error ? error.message : error);
  }
}
