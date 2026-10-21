/**
 * Lo que la pantalla de un nicho recibe del servidor: todo plano (se puede
 * cachear y pasar a componentes del navegador). Las cuentas estadísticas
 * se hacen con src/nichos/estadistica.ts.
 */

export type Periodo = 7 | 30 | 90 | 0;

export type EmbudoWeb = { vistas: number; demos: number; contacto: number; inicios: number; registros: number; confirmados: number };

export type SocioNicho = {
  id: string;
  nombre: string;
  /** Viene de Núcleos (uso del sistema) o solo de Plantillas (sin uso medido). */
  conUso: boolean;
  ejemplo: boolean;
  alta: string | null;
  baja: string | null;
  abono: number | null;
  sucursales: number;
  plan: string | null;
  responsable: string | null;
  salud: number | null;
  semaforo: string;
  adopcion: number | null;
  /** Acciones por semana (las últimas 12, de la más vieja a la más nueva). */
  semanas: number[];
  /** Operaciones de venta (acción principal) de las últimas 4 semanas: cantidad, nunca montos. */
  ventas4: number | null;
  comparteMetricas: boolean;
  crecimiento: number | null;
  funcionesUsadas: string[];
  funcionesSinUsar: string[];
  dejoDeUsar: string[];
  alertas: number;
  /** Ruta a su vista en Núcleos. */
  href: string | null;
};

export type ProspectoNicho = {
  id: string;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  volver: string | null;
  visitas: number;
  ultimaVisita: string | null;
  ultimoFeedback: string | null;
  proxima: string | null;
  ciudad: string | null;
};

export type VisitaNicho = { fecha: string; feedback: "bueno" | "regular" | "malo"; latitud: number | null; longitud: number | null };

export type ObjetivoDelNicho = { id: string; nombre: string; avance: number | null; estado: string; valor: string; meta: string };

export type DatosNicho = {
  nicho: { id: string; nombre: string; tienePlantilla: boolean; enRegistro: boolean };
  hoy: string;
  periodo: { dias: Periodo; desde: string; hasta: string; desdeAnterior: string; hastaAnterior: string };
  /** Por qué falta algo (migración sin aplicar, sin clientes reales…), para decirlo en pantalla. */
  avisos: string[];
  modoEjemplo: boolean;
  embudo: { actual: EmbudoWeb | null; anterior: EmbudoWeb | null };
  atencion: Array<{ tipo: string; detalle: string; visitas: number }>;
  socios: SocioNicho[];
  /** MRR del nicho al cierre de cada uno de los últimos 12 meses ("AAAA-MM"). */
  mrrMensual: Array<{ mes: string; mrr: number }>;
  /** Para el tiempo hasta convertir: días desde la primera visita del mapa hasta el alta. */
  diasDesdeVisitaHastaAlta: number[];
  prospectos: ProspectoNicho[];
  visitas: VisitaNicho[];
  objetivos: ObjetivoDelNicho[];
  funcionesClave: string[];
  /** El seguimiento comercial del nicho: cuántas llegaron a cada etapa y el pipeline ponderado (null sin la tabla). */
  comercial: { pasos: Array<{ etapa: string; llegaron: number }>; ponderado: number; abiertas: number } | null;
};

/** Las tarjetas de la comparación entre nichos. */
export type ResumenNicho = {
  id: string;
  nombre: string;
  tienePlantilla: boolean;
  socios: number;
  mrr: number;
  saludPromedio: number | null;
  conversion: number | null;
  vistas: number;
  registros: number;
  churn: number | null;
  prospectos: number;
  visitasLocales: number;
};
