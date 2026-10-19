/**
 * El modelo de datos del chat "Hablemos ahora" y del panel de mensajes.
 *
 * Una conversación arranca atendida por el asistente ("bot"). Si el
 * visitante pide una persona pasa a "espera-humano"; cuando alguien del
 * equipo la toma desde el panel, a "humano" (el asistente deja de
 * responder); "cerrada" es la que el equipo dio por terminada (si el
 * visitante vuelve a escribir, se reabre con el asistente).
 */

export type Estado = "bot" | "espera-humano" | "humano" | "cerrada";

export type Autor = "visitante" | "bot" | "humano" | "sistema";

export type Necesidad = "sistema" | "app" | "web" | "otro";

export type Pedido = {
  nombre: string;
  empresa: string | null;
  rubro: string | null;
  necesidad: Necesidad;
  detalle: string;
  contacto: string;
  medio: "whatsapp" | "email" | "otro";
  registrado: number;
};

/** Lo que el modo guiado (sin IA) va juntando, paso a paso. */
export type Borrador = {
  paso: "detalle" | "rubro" | "nombre" | "contacto" | "listo";
  detalle?: string;
  rubro?: string;
  nombre?: string;
};

export type Conversacion = {
  id: string;
  creada: number;
  actualizada: number;
  estado: Estado;
  /** Quién del equipo la atiende (cuando está en "humano"). */
  atiende: string | null;
  pedido: Pedido | null;
  /** Mensajes del visitante que nadie del equipo vio todavía. */
  noLeidos: number;
  /** La página desde la que escribió por primera vez. */
  pagina: string | null;
  /** Cuántos mensajes escribió el visitante (para el límite). */
  mensajesVisitante: number;
  borrador: Borrador | null;
  /** El último mensaje, para la lista del panel. */
  ultimo: { autor: Autor; texto: string } | null;
};

export type Mensaje = {
  id: string;
  autor: Autor;
  /** Nombre de quién escribió, si es alguien del equipo. */
  nombre: string | null;
  texto: string;
  fecha: number;
};

/** Lo que ve el visitante de su conversación (nada interno del panel). */
export type VistaVisitante = {
  conversacion: string;
  estado: Estado;
  atiende: string | null;
  pedido: Pedido | null;
  mensajes: Mensaje[];
};
