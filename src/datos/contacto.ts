/**
 * Datos de contacto reales de Quvant.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  TODO: completar el email real antes de difundir.       │
 * │  El de abajo es un EJEMPLO y no funciona.               │
 * └─────────────────────────────────────────────────────────┘
 */

export const CONTACTO = {
  /**
   * WhatsApp para los links (wa.me): código de país y sin signos. Los
   * celulares argentinos llevan el 9 después del 54 para que WhatsApp los encuentre.
   */
  whatsapp: "5491124811956",
  /** El mismo número, como se lee. */
  whatsappVisible: "+54 11 2481-1956",

  /** TODO: email real de contacto. */
  email: "contacto@tudominio.com",

  /** Usuario de Instagram, sin la arroba. */
  instagram: "quvant.ar",
} as const;

export const urlInstagram = `https://www.instagram.com/${CONTACTO.instagram}/`;
export const urlEmail = `mailto:${CONTACTO.email}`;
export const urlWhatsApp = (texto?: string) =>
  `https://wa.me/${CONTACTO.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
export const urlEmailMensaje = (asunto: string, cuerpo: string) =>
  `mailto:${CONTACTO.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

/** Arma el mensaje del formulario de contacto, listo para WhatsApp o email. */
export function armarMensajeContacto(datos: {
  nombre: string;
  empresa: string;
  rubro: string;
  necesidad: string;
  mensaje: string;
}) {
  const partes = [
    `Hola, soy ${datos.nombre}${datos.empresa ? `, de ${datos.empresa}` : ""}.`,
    datos.rubro ? `Rubro: ${datos.rubro}.` : "",
    `Necesito: ${datos.necesidad.toLowerCase()}.`,
    datos.mensaje,
  ];
  return partes.filter(Boolean).join(" ");
}
