/**
 * Las fotos reales del sitio (web más humana, paso 6): gente y lugares de
 * verdad, nunca de banco de imágenes. Cada foto dice de quién o de qué es,
 * en qué sección va y si tiene permiso para publicarse.
 *
 * Solo se muestran las que tienen permiso: true. Sin permiso (o sin
 * archivo), el bloque no aparece en producción; en desarrollo se ve un
 * recuadro con el TODO para no olvidarse (ver componentes/estructura/Foto).
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  TODO: fabrizio junta las fotos en public/fotos/ (con el       │
 * │  celular alcanza: luz de día, sin flash) y pone permiso: true   │
 * │  cuando la persona o el negocio lo autorizó.                    │
 * └───────────────────────────────────────────────────────────────┘
 *
 * Las de ambiente por rubro (public/nichos, public/objetivo) son de banco
 * de imágenes y se quedan hasta tener reales (decisión de fabrizio,
 * 20-oct-2026): no pasan por este registro.
 */

export type Seccion = "nosotros" | "contacto" | "ferremix" | "uso" | "gimnasio";

export type Foto = {
  id: string;
  /** Ruta bajo public/ (por ejemplo "/fotos/nosotros-michel.jpg"). Vacía hasta que exista. */
  archivo: string;
  /** Qué se ve, para quien no ve la imagen ("Mostrador de Ferremix en Moreno"). */
  alt: string;
  seccion: Seccion;
  /** La persona o el negocio autorizó publicarla. */
  permiso: boolean;
  /** Para el recuadro de desarrollo: qué foto falta. */
  pendiente: string;
};

export const FOTOS: readonly Foto[] = [
  { id: "nosotros-michel", archivo: "", alt: "Michel, co-founder de Quvant", seccion: "nosotros", permiso: false, pendiente: "foto de Michel (nosotros-michel.jpg)" },
  { id: "nosotros-fabrizio", archivo: "", alt: "Fabrizio, co-founder de Quvant", seccion: "nosotros", permiso: false, pendiente: "foto de Fabrizio (nosotros-fabrizio.jpg)" },
  { id: "nosotros-juntos", archivo: "", alt: "Michel y Fabrizio trabajando juntos", seccion: "nosotros", permiso: false, pendiente: "foto de los dos trabajando (opcional)" },
  { id: "ferremix-local", archivo: "", alt: "El local de Ferremix en Moreno, por fuera", seccion: "ferremix", permiso: false, pendiente: "foto del local de Ferremix (solo con permiso de Ferremix)" },
  { id: "ferremix-mostrador", archivo: "", alt: "El mostrador de Ferremix", seccion: "ferremix", permiso: false, pendiente: "foto del mostrador de Ferremix (solo con permiso)" },
  { id: "uso-conteo", archivo: "", alt: "Alguien contando stock con el celular en un depósito", seccion: "uso", permiso: false, pendiente: "foto del sistema en uso: contando stock con el celular" },
  { id: "uso-mostrador", archivo: "", alt: "La caja del sistema en un mostrador", seccion: "uso", permiso: false, pendiente: "foto del sistema en uso: la caja en un mostrador" },
];

/** Una foto lista para publicar (con archivo y permiso), o null. */
export function fotoDe(id: string): Foto | null {
  const foto = FOTOS.find((f) => f.id === id);
  return foto && foto.permiso && foto.archivo ? foto : null;
}

/** Lo que falta de una foto, para el recuadro de desarrollo. */
export const pendienteDe = (id: string) => FOTOS.find((f) => f.id === id)?.pendiente ?? id;

/** Las fotos publicables de una sección. */
export const fotosDe = (seccion: Seccion) => FOTOS.filter((f) => f.seccion === seccion && f.permiso && f.archivo);
