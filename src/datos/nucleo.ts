/**
 * El núcleo y sus ramas: los nichos para los que Quvant tiene o tendrá una
 * plantilla. Alimenta la escena 3D de Plataformas y su lista accesible.
 *
 * Los widgets son EJEMPLOS de lo que lleva la plantilla de cada nicho (la
 * escena lo dice: "ilustración de ejemplo"). El estado es el real: solo
 * "disponible" lo que funciona hoy; lo demás, en diseño o próximamente.
 * Nunca clientes, cifras ni logos.
 */

export type EstadoNicho = "disponible" | "en-diseno" | "proximamente";

export type Nicho = {
  id: string;
  nombre: string;
  estado: EstadoNicho;
  /** Lo que la plantilla de ese nicho suma encima del núcleo. */
  widgets: readonly string[];
};

export const NICHOS: readonly Nicho[] = [
  {
    id: "industria",
    nombre: "Industria",
    estado: "disponible",
    widgets: ["Stock por sucursal", "Compras sugeridas", "Servicio técnico", "Hoja de ruta"],
  },
  {
    id: "gimnasios",
    nombre: "Gimnasios",
    estado: "disponible",
    widgets: ["Socios y cuotas", "Control de acceso", "Clases y turnos", "Rutinas (HackFit)"],
  },
  {
    id: "supermercados",
    nombre: "Supermercados",
    estado: "en-diseno",
    widgets: ["Cajas en paralelo", "Góndolas y faltantes", "Promociones", "Proveedores"],
  },
  {
    id: "kioscos",
    nombre: "Kioscos",
    estado: "proximamente",
    widgets: ["Caja rápida", "Reposición diaria", "Vencimientos", "Fiado del barrio"],
  },
  {
    id: "farmacias",
    nombre: "Farmacias",
    estado: "proximamente",
    widgets: ["Vencimientos y lotes", "Recetas", "Trazabilidad", "Reposición"],
  },
  {
    id: "abogacia",
    nombre: "Abogacía",
    estado: "proximamente",
    widgets: ["Expedientes", "Plazos y vencimientos", "Honorarios", "Agenda de audiencias"],
  },
  {
    id: "inmobiliarias",
    nombre: "Inmobiliarias",
    estado: "en-diseno",
    widgets: ["Propiedades", "Contratos", "Cobranzas", "Visitas"],
  },
  {
    id: "pymes",
    nombre: "Pymes",
    estado: "en-diseno",
    widgets: ["Presupuestos", "Cuentas corrientes", "Stock", "Reportes"],
  },
  {
    id: "holistica",
    nombre: "Holística",
    estado: "proximamente",
    widgets: ["Turnos", "Pacientes", "Sesiones", "Cobros"],
  },
];
