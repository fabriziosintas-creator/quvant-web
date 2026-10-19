import { ACENTO_CANAL } from "./colores";

/**
 * La cara visual de "Cómo trabajamos" (los textos están en
 * textos.ts → OBJETIVO.etapas).
 *
 * Dirección de arte (decidida con fabrizio el 19-oct-2026): un mismo
 * negocio real del rubro, una ferretería industrial, fotografiado en sus
 * cuatro momentos, de la primera visita al sistema andando. Fotos
 * documentales, con luz natural, más manos y objetos que caras. El sitio
 * las pasa a blanco y negro con grano (no hace falta editarlas antes) y
 * les dibuja encima la capa gráfica de la marca: líneas finas y el punto
 * cuadrado, en un solo color.
 *
 * Las fotos de hoy son provisorias (Unsplash). Para poner las de la
 * sesión, reemplazar los archivos de public/objetivo/ con el mismo
 * nombre: horizontales, 1600 px de ancho como mínimo, motivo al centro (en
 * el celular se recortan arriba y abajo).
 */

/** Un solo color para todo el recorrido: el del canal Servicios, donde vive. */
export const COLOR_RECORRIDO = ACENTO_CANAL.servicios;

export const OBJETIVO_VISUAL = {
  /**
   * Toma: plano detalle del mostrador. Las manos del dueño muestran el
   * cuaderno de stock o el Excel impreso lleno de tachones; del otro lado,
   * alguien de Quvant toma notas. Capa: ondas que "escuchan" dos puntos.
   */
  escuchar: {
    foto: { src: "/objetivo/escuchar.webp", alt: "Una charla de trabajo con anotaciones sobre la mesa" },
  },
  /**
   * Toma: plano abierto del depósito, con las estanterías. Capa: la red de
   * cómo podría estar todo conectado, en líneas de alambre (como Forja).
   */
  sonar: {
    foto: { src: "/objetivo/sonar.webp", alt: "Una persona mirando la ciudad de noche" },
  },
  /**
   * Toma: vista cenital de una mesa con el plan en papel o post-its.
   * Capa: las líneas que lo ordenan en tres fases.
   */
  bajar: {
    foto: { src: "/objetivo/bajar.webp", alt: "Alguien ordenando ideas en una pizarra llena de notas" },
  },
  /**
   * Toma: el mismo mostrador de la primera foto, con el empleado vendiendo
   * con Yunque en una tablet y un cliente atrás. Capa: la pantalla
   * funcionando y el punto cuadrado encendido.
   */
  construir: {
    foto: { src: "/objetivo/construir.webp", alt: "Un equipo trabajando junto frente a una computadora" },
  },
} as const;

export type IdEtapa = keyof typeof OBJETIVO_VISUAL;
