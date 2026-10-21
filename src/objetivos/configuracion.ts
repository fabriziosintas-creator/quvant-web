/**
 * Los umbrales del estado de un objetivo. Se comparan contra el ritmo: qué
 * parte de lo esperado a la fecha ya se hizo.
 *   cumplido   ya alcanzó la meta (aunque el período siga abierto)
 *   en camino  90 % del ritmo o más
 *   en riesgo  entre 60 % y 90 %
 *   atrasado   menos de 60 %
 */
export const UMBRALES = {
  enCamino: 0.9,
  enRiesgo: 0.6,
  /**
   * Al empezar el período (menos de este tramo transcurrido) no se juzga el
   * ritmo: con dos días hábiles, un cero no es "atrasado".
   */
  gracia: 0.1,
  /** Con "menos es mejor", cuánto se puede pasar de la meta antes de "atrasado" (10 %). */
  margenMenos: 0.1,
} as const;

/** Las tasas de partida del plan (docs/estrategia/plan-objetivos-crecimiento.md, sección 3). */
export const TASAS_DEL_PLAN = {
  webARegistro: 0.02,
  localADemo: 0.12,
  registroADemo: 0.15,
  demoACliente: 0.25,
} as const;

/** Con menos casos que esto en un paso del embudo, se usa la tasa del plan. */
export const CASOS_MINIMOS = 20;

/** El abono de trabajo del plan (Quvant Industria, una sucursal), para pasar MRR a clientes si todavía no hay activos. */
export const ABONO_DEL_PLAN = 150_000;
