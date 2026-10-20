/**
 * Configuración de los emails: quién los manda.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TODO: dominio verificado en Resend.                            │
 * │  Cuando quvant.com.ar figure "Verified" en resend.com/domains,  │
 * │  poner dominioVerificado en true. Hasta entonces los emails     │
 * │  salen en modo prueba desde onboarding@resend.dev y Resend solo │
 * │  los entrega a la casilla dueña de la cuenta.                   │
 * └─────────────────────────────────────────────────────────────────┘
 */

const dominioVerificado = false;

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
