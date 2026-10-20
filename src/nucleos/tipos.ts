/**
 * Los datos con los que trabaja la sección Núcleos del panel. Todo es uso
 * del sistema, nunca el negocio del cliente (sección 3 del brief): no hay
 * montos, nombres de productos ni datos de clientes finales.
 */
import type { Plantilla } from "../../medicion-sistema/catalogo";

export type Responsable = "fabrizio" | "michel";

export type ClienteSistema = {
  id: string;
  organizacionId: string;
  nombre: string;
  nucleoId: string;
  plantilla: Plantilla;
  /** AAAA-MM-DD */
  alta: string;
  plan: "negocio" | "multinegocio" | null;
  sucursalesContratadas: number;
  usuariosContratados: number;
  responsable: Responsable;
  modulosActivos: string[];
  esPrueba: boolean;
};

/** Lo que se usó en una semana (lunes a domingo). */
export type SemanaDeUso = {
  /** AAAA-MM-DD del lunes. */
  inicio: string;
  diasActivos: number;
  acciones: number;
  accionesPorModulo: Record<string, number>;
  usuariosActivos: number;
  sucursalesActivas: number;
  /** La acción principal de la plantilla (ventas confirmadas, accesos validados…). */
  accionesPrincipales: number;
  sesiones: number;
};

/** El uso de un cliente tal como sale de PostHog (o de los datos de ejemplo). */
export type UsoCliente = {
  organizacionId: string;
  /** Las últimas 12 semanas, la más vieja primero y la actual al final. */
  semanas: SemanaDeUso[];
  /** Por evento del catálogo: primera y última vez que pasó (ISO) y cuántas semanas distintas. */
  eventos: Record<string, { primera: string; ultima: string; semanas: number }>;
  ultimaSesion: string | null;
  /** Días con actividad por sucursal en los últimos 7 días. */
  actividadPorSucursal: Record<string, number>;
  /** Acciones por rol en las últimas 4 semanas. */
  accionesPorRol: Record<string, number>;
};

export type EstadoFuncion = "usada" | "sin_usar" | "dejo_de_usar";

export type FuncionClaveEvaluada = {
  id: string;
  nombre: string;
  evento: string;
  frecuencia: "diaria" | "semanal" | "mensual";
  porQueImporta: string;
  estado: EstadoFuncion;
  /** ISO de la última vez, o null. */
  ultimaVez: string | null;
};

export type Tendencia = { direccion: "sube" | "estable" | "baja"; porcentaje: number };
export type Semaforo = "verde" | "amarillo" | "rojo" | "arranque";

export type Indicadores = {
  organizacionId: string;
  calculadoEn: string;
  semanas: SemanaDeUso[];
  funcionesClave: FuncionClaveEvaluada[];
  /** 0 a 1: funciones clave en uso sobre las que aplican. */
  adopcion: number;
  amplitud: { usuarios: number; sucursales: number };
  tendencia: Tendencia;
  diasActivos4Semanas: number;
  salud: number | null;
  semaforo: Semaforo;
  /** "A quién le va mejor": crecimiento de la actividad contra hace un mes (0.25 = +25 %). */
  crecimiento: { operaciones: number; usuarios: number; sucursales: number; total: number };
  actividadPorSucursal: Record<string, number>;
  accionesPorRol: Record<string, number>;
  ultimaSesion: string | null;
};

export type TipoAlerta = "dejo_de_usar" | "nunca_uso" | "cayo_actividad" | "sucursal_sin_actividad" | "bajo_semaforo" | "sin_sesiones";

export type AlertaNueva = {
  tipo: TipoAlerta;
  gravedad: "roja" | "amarilla";
  funcionClave: string | null;
  detalle: Record<string, string | number>;
};

export type Alerta = AlertaNueva & {
  id: string;
  clienteId: string;
  fecha: string;
  estado: "nueva" | "vista" | "resuelta" | "descartada";
  resolucion: string | null;
  esPrueba: boolean;
};

export type Acompanamiento = {
  id: string;
  clienteId: string;
  fecha: string;
  quien: string | null;
  tipo: "llamada" | "visita" | "capacitacion" | "mensaje" | "correccion" | "novedad";
  nota: string | null;
  alertaId: string | null;
  esPrueba: boolean;
};

/** El embudo de activación de un cliente: en qué paso está. */
export type PasoActivacion = "alta" | "primera_sesion" | "primera_accion_principal" | "primera_funcion_avanzada" | "uso_semanal_estable";
