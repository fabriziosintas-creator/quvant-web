/**
 * Los tipos de la sección Objetivos. Todo es puro (sin base ni red): el
 * servidor junta los datos (src/servidor/objetivos/datos.ts) y estas
 * funciones calculan. Así se prueban con datos de prueba.
 *
 * Las fechas son días de Buenos Aires como texto "AAAA-MM-DD".
 */

export type Dia = string;

export type Unidad = "numero" | "ars" | "usd" | "porcentaje" | "horas";
export type Area = "facturacion" | "clientes" | "web" | "comercial" | "calle" | "nucleos";
export type Etapa = "90_dias" | "6_meses" | "12_meses" | "libre";
export type TipoPeriodo = "semana" | "mes" | "trimestre" | "etapa" | "rango";
export type Direccion = "mas_es_mejor" | "menos_es_mejor";
export type Acumulacion = "suma_del_periodo" | "valor_al_cierre" | "promedio";
export type Responsable = "fabrizio" | "michel" | "los_dos";
export type Socio = "fabrizio" | "michel";
export type TipoCobro = "abono_mensual" | "implementacion" | "web" | "app_a_medida" | "otro";

export type Filtros = {
  nicho?: string;
  /** Quién fue (visitas a locales). */
  socio?: Socio;
  tipo?: TipoCobro;
  /** El objetivo que eligió la persona al registrarse. */
  objetivo?: string;
};

export type Meta = {
  id: string;
  nombre: string;
  descripcion: string | null;
  metrica: string;
  filtros: Filtros;
  area: Area;
  etapa: Etapa;
  tipoPeriodo: TipoPeriodo;
  desde: Dia;
  hasta: Dia;
  meta: number;
  metaOriginal: number;
  unidad: Unidad;
  direccion: Direccion;
  acumulacion: Acumulacion;
  responsable: Responsable;
  seRepite: boolean;
  orden: number;
  archivada: boolean;
  clavePlan: string | null;
  esPrueba: boolean;
};

/** Todo lo que las métricas necesitan, ya leído de la base (sin datos de prueba salvo que se pidan). */
export type DatosObjetivos = {
  cobros: Array<{ fecha: Dia; tipo: TipoCobro; montoArs: number; nicho: string | null; cobrado: boolean; cliente: string }>;
  /** Pesos por dólar por mes ("AAAA-MM"). */
  tiposCambio: Record<string, number>;
  /** Clientes por plantilla: base del MRR, los activos, las altas y el churn. */
  clientes: Array<{ id: string; nicho: string; abono: number | null; alta: Dia | null; baja: Dia | null }>;
  /** Personas registradas (sin admins). */
  personas: Array<{ creado: Dia; confirmado: Dia | null; nicho: string; objetivo: string }>;
  /** Navegadores que entraron a la web, por día (sin el equipo). */
  visitantes: Array<{ dia: Dia; id: string }>;
  visitasLocales: Array<{ fecha: Dia; socio: Socio | null; nicho: string | null; feedback: "bueno" | "regular" | "malo" }>;
  locales: Array<{ creado: Dia; nicho: string | null }>;
  /** Fotos diarias de Núcleos (uso del sistema, nunca ventas). */
  saludClientes: Array<{ dia: Dia; clienteId: string; nucleo: string; salud: number | null; semaforo: string }>;
  alertas: Array<{ fecha: Dia; resuelta: boolean; nucleo: string | null }>;
  avances: Array<{ metaId: string; fecha: Dia; valor: number }>;
  /** El seguimiento comercial (oportunidades y su actividad), o null si todavía no está la tabla. */
  comercial: DatosComercial | null;
};

export type DatosComercial = {
  oportunidades: Array<{ id: string; creadoEn: string; etapa: string; valorAbono: number | null; valorProyecto: number | null; probabilidad: number | null; nicho: string | null; etapaDesde: string }>;
  actividades: Array<{ oportunidadId: string; tipo: "cambio_etapa" | "llamada" | "mensaje" | "reunion" | "demo" | "propuesta" | "nota"; etapaAnterior: string | null; etapaNueva: string | null; creadoEn: string }>;
};

export type EstadoMeta = "cumplido" | "en_camino" | "en_riesgo" | "atrasado" | "sin_datos" | "no_cumplido" | "por_empezar";
