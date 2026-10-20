import "server-only";
import { EMAIL } from "@/datos/emails";
import type { EmailArmado } from "@/emails/armar";

/**
 * Manda un email con la API de Resend (sin librería: un POST). La clave
 * vive solo en el servidor (RESEND_API_KEY, sin NEXT_PUBLIC_).
 *
 * Nunca tira: devuelve si salió o por qué no, para que un email que falla
 * no rompa lo que lo disparó (por ejemplo, confirmar la cuenta).
 */
export async function enviarEmail(para: string | string[], email: EmailArmado): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return { ok: false, motivo: "Falta RESEND_API_KEY" };

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL.remitente,
        to: Array.isArray(para) ? para : [para],
        subject: email.asunto,
        html: email.html,
        text: email.texto,
        ...(EMAIL.responderA ? { reply_to: EMAIL.responderA } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (respuesta.ok) return { ok: true };
    const detalle = await respuesta.text();
    return { ok: false, motivo: `Resend ${respuesta.status}: ${detalle.slice(0, 300)}` };
  } catch (error) {
    return { ok: false, motivo: error instanceof Error ? error.message : String(error) };
  }
}
