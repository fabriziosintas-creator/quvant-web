/**
 * El núcleo y sus ramas: los nichos para los que Quvant tiene o tendrá una
 * plantilla. Alimenta la escena 3D de Plataformas y su lista accesible.
 *
 * Los widgets son EJEMPLOS de lo que lleva la plantilla de cada nicho (la
 * escena lo dice: "ilustración de ejemplo"). El estado es el real: solo
 * "disponible" lo que funciona hoy; lo demás, en diseño o próximamente.
 * Nunca clientes, cifras ni logos.
 */

import { ACENTO_NICHO, type IdNicho } from "./colores";

export type EstadoNicho = "disponible" | "en-diseno" | "proximamente";

export type Nicho = {
  id: IdNicho;
  nombre: string;
  estado: EstadoNicho;
  /** El acento del nicho: pinta su rama, su plantilla y su ficha. */
  color: string;
  /** Foto de ambiente del rubro (Unsplash, licencia libre para uso comercial). */
  foto: { src: string; alt: string };
  /** Lo que la plantilla de ese nicho suma encima del núcleo. */
  widgets: readonly string[];
};

export const NICHOS: readonly Nicho[] = [
  {
    id: "industria",
    color: ACENTO_NICHO.industria,
    foto: { src: "/nichos/industria.webp", alt: "Estanterías altas de un depósito industrial" },
    nombre: "Industria",
    estado: "disponible",
    widgets: ["Stock por sucursal", "Compras sugeridas", "Servicio técnico", "Hoja de ruta"],
  },
  {
    id: "gimnasios",
    color: ACENTO_NICHO.gimnasios,
    foto: { src: "/nichos/gimnasios.webp", alt: "Mancuernas ordenadas en el rack de un gimnasio" },
    nombre: "Gimnasios",
    estado: "disponible",
    widgets: ["Socios y cuotas", "Control de acceso", "Clases y turnos", "Rutinas (HackFit)"],
  },
  {
    id: "supermercados",
    color: ACENTO_NICHO.supermercados,
    foto: { src: "/nichos/supermercados.webp", alt: "Góndolas de un supermercado con productos" },
    nombre: "Supermercados",
    estado: "en-diseno",
    widgets: ["Cajas en paralelo", "Góndolas y faltantes", "Promociones", "Proveedores"],
  },
  {
    id: "kioscos",
    color: ACENTO_NICHO.kioscos,
    foto: { src: "/nichos/kioscos.webp", alt: "Un kiosco de barrio iluminado de noche" },
    nombre: "Kioscos",
    estado: "proximamente",
    widgets: ["Caja rápida", "Reposición diaria", "Vencimientos", "Fiado del barrio"],
  },
  {
    id: "farmacias",
    color: ACENTO_NICHO.farmacias,
    foto: { src: "/nichos/farmacias.webp", alt: "Estante de una farmacia con medicamentos" },
    nombre: "Farmacias",
    estado: "proximamente",
    widgets: ["Vencimientos y lotes", "Recetas", "Trazabilidad", "Reposición"],
  },
  {
    id: "abogacia",
    color: ACENTO_NICHO.abogacia,
    foto: { src: "/nichos/abogacia.webp", alt: "Libros de derecho apilados sobre un escritorio" },
    nombre: "Abogacía",
    estado: "proximamente",
    widgets: ["Expedientes", "Plazos y vencimientos", "Honorarios", "Agenda de audiencias"],
  },
  {
    id: "inmobiliarias",
    color: ACENTO_NICHO.inmobiliarias,
    foto: { src: "/nichos/inmobiliarias.webp", alt: "Una mano con la llave de una puerta" },
    nombre: "Inmobiliarias",
    estado: "en-diseno",
    widgets: ["Propiedades", "Contratos", "Cobranzas", "Visitas"],
  },
  {
    id: "pymes",
    color: ACENTO_NICHO.pymes,
    foto: { src: "/nichos/pymes.webp", alt: "Cartel de «abierto» en la vidriera de un comercio" },
    nombre: "Pymes",
    estado: "en-diseno",
    widgets: ["Presupuestos", "Cuentas corrientes", "Stock", "Reportes"],
  },
  {
    id: "holistica",
    color: ACENTO_NICHO.holistica,
    foto: { src: "/nichos/holistica.webp", alt: "Personas practicando yoga en un estudio" },
    nombre: "Holística",
    estado: "proximamente",
    widgets: ["Turnos", "Pacientes", "Sesiones", "Cobros"],
  },
];
