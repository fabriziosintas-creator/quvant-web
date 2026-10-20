/**
 * Configuración de los emails: quién los manda.
 *
 * quvant.com.ar quedó verificado en Resend el 20-oct-2026 (DKIM, SPF y MX
 * de "send", y DMARC, cargados en el DNS de Vercel). Con false, los emails
 * vuelven al modo prueba (onboarding@resend.dev, que Resend solo entrega a
 * la casilla dueña de la cuenta).
 */

const dominioVerificado = true;

export const EMAIL = {
  dominio: "quvant.com.ar",
  dominioVerificado,
  /** Remitente de todos los emails (los de la web y los de Supabase). */
  remitente: dominioVerificado ? "Quvant <hola@quvant.com.ar>" : "Quvant <onboarding@resend.dev>",
  remitenteNombre: "Quvant",
  remitenteEmail: dominioVerificado ? "hola@quvant.com.ar" : "onboarding@resend.dev",
  /**
   * Adónde van las respuestas. TODO: el email real de contacto (el de
   * src/datos/contacto.ts todavía es de ejemplo). Mientras sea null, el
   * email no ofrece responder: el cierre manda a WhatsApp.
   */
  responderA: null as string | null,
} as const;
