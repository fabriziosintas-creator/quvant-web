/**
 * Datos de contacto reales de Quvant.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  TODO: completar con los datos reales antes de publicar.    │
 * │  Los tres valores de abajo son EJEMPLOS y no funcionan.     │
 * └─────────────────────────────────────────────────────────────┘
 */

export const CONTACTO = {
  /** TODO: número de WhatsApp con código de país y sin signos. Ejemplo: "5491112345678". */
  whatsapp: "549XXXXXXXXXX",

  /** TODO: email real de contacto. */
  email: "contacto@tudominio.com",

  /** TODO: usuario de Instagram, sin la arroba. */
  instagram: "tu.instagram",
} as const;

export const urlInstagram = `https://www.instagram.com/${CONTACTO.instagram}/`;
export const urlEmail = `mailto:${CONTACTO.email}`;
export const urlWhatsApp = (texto?: string) =>
  `https://wa.me/${CONTACTO.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
