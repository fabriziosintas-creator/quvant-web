/**
 * Los números de la salud del cliente y de las alertas, en un solo lugar
 * para ajustarlos sin tocar la lógica (src/nucleos/indicadores.ts).
 * Propuesta inicial del brief (B.3).
 */
export const CONFIG_SALUD = {
  pesos: { diasActivos: 0.3, adopcion: 0.35, amplitud: 0.15, tendencia: 0.2 },
  /** Días activos en 4 semanas que valen 100 % (6 por semana: un comercio abre de lunes a sábado). */
  diasActivosMaximo: 24,
  semaforo: { verde: 70, amarillo: 40 },
  /** Clientes con menos de estas semanas de alta: "en arranque", sin semáforo. */
  semanasDeArranque: 3,
  /** Cómo puntúa la tendencia: sube 100 %, estable 60 %, baja 20 %. */
  puntajeTendencia: { sube: 1, estable: 0.6, baja: 0.2 },
  /** Más de ±10 % contra el promedio de las 4 semanas anteriores es subir o bajar. */
  umbralTendencia: 0.1,
} as const;

/** Cuántos días sin usar una función clave cuentan como "no la usa", según su frecuencia esperada. */
export const VENTANA_FUNCION_DIAS = { diaria: 7, semanal: 14, mensual: 45 } as const;

export const CONFIG_ALERTAS = {
  /** "Dejó de usar": la venía usando en al menos estas semanas distintas. */
  semanasParaDejoDeUsar: 3,
  /** "Nunca usó": después de estos días de alta. */
  diasParaNuncaUso: 30,
  /** "Cayó la actividad": más de este porcentaje contra su promedio. */
  caidaActividad: 0.4,
  /** "Sucursal sin actividad": estos días. */
  diasSucursalSinActividad: 7,
  /** "No inició sesión nadie": estos días hábiles. */
  diasHabilesSinSesion: 5,
} as const;

/** El proceso diario: tope de llamadas a Claude por día y a qué hora corre (hora de Buenos Aires). */
export const CONFIG_PROCESO = {
  topeClaudeDiario: Number(process.env.NUCLEOS_CLAUDE_TOPE_DIARIO ?? 50),
  horaCron: "07:00",
} as const;
