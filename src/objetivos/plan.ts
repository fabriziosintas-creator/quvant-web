import { METRICA } from "./catalogo";
import type { Acumulacion, Area, Direccion, Etapa, Filtros, Responsable, TipoPeriodo, Unidad } from "./tipos";

/**
 * Las metas del plan inicial (docs/estrategia/plan-objetivos-crecimiento.md,
 * sección 4), listas para "Cargar plan inicial". Son metas, no datos: los
 * valores reales empiezan en cero.
 *
 * Responsables con los roles reales (el plan los tenía invertidos, lo
 * corrigió fabrizio el 20-oct-2026): fabrizio vende (clientes, MRR, demos,
 * calle, redes, primer contacto) y Michel desarrolla (web, registros,
 * salud de los clientes en Núcleos, implementación).
 *
 * Los precios de trabajo del plan (sección 2) definen las metas de MRR: si
 * cambian los precios, se ajustan acá o desde la pantalla (queda el motivo).
 */

export type MetaDelPlan = {
  clavePlan: string;
  nombre: string;
  descripcion?: string;
  metrica: string;
  filtros?: Filtros;
  etapa: Etapa;
  tipoPeriodo: TipoPeriodo;
  desde: string;
  hasta: string;
  meta: number;
  responsable: Responsable;
  seRepite?: boolean;
  /** Si no se dan, salen de la métrica. */
  unidad?: Unidad;
  acumulacion?: Acumulacion;
  direccion?: Direccion;
  area?: Area;
};

const E1 = { etapa: "90_dias", desde: "2026-11-01", hasta: "2027-01-31" } as const;
const E2 = { etapa: "6_meses", desde: "2027-02-01", hasta: "2027-04-30" } as const;
const E3 = { etapa: "12_meses", desde: "2027-05-01", hasta: "2027-10-31" } as const;
const etapa = (e: typeof E1 | typeof E2 | typeof E3) => ({ ...e, tipoPeriodo: "etapa" as const });
const mes = (et: Etapa, desde: string, hasta: string) => ({ etapa: et, desde, hasta, tipoPeriodo: "mes" as const });

export const PLAN_INICIAL: MetaDelPlan[] = [
  // ── Etapa 1 · Primeros 90 días: probar que se vende ──
  { clavePlan: "e1_clientes", nombre: "Clientes de sistema pagando", descripcion: "Ferremix y dos más.", metrica: "clientes_activos", ...etapa(E1), meta: 3, responsable: "fabrizio" },
  { clavePlan: "e1_mrr", nombre: "MRR al cierre de enero", descripcion: "Unos USD 350.", metrica: "mrr", ...etapa(E1), meta: 550_000, responsable: "fabrizio" },
  { clavePlan: "e1_webs", nombre: "Webs vendidas", metrica: "proyectos_vendidos", filtros: { tipo: "web" }, ...etapa(E1), meta: 2, responsable: "fabrizio" },
  { clavePlan: "e1_facturacion", nombre: "Facturación del período", descripcion: "Abonos, implementaciones y webs.", metrica: "facturacion_cobrada", ...etapa(E1), meta: 5_000_000, responsable: "los_dos" },
  { clavePlan: "e1_visitas_locales_nov", nombre: "Visitas a locales · noviembre", descripcion: "Fabrizio 70 %, Michel 30 %.", metrica: "visitas_locales", ...mes("90_dias", "2026-11-01", "2026-11-30"), meta: 60, responsable: "los_dos" },
  { clavePlan: "e1_visitas_locales_dic", nombre: "Visitas a locales · diciembre", descripcion: "Fabrizio 70 %, Michel 30 %.", metrica: "visitas_locales", ...mes("90_dias", "2026-12-01", "2026-12-31"), meta: 60, responsable: "los_dos" },
  { clavePlan: "e1_visitas_locales_ene", nombre: "Visitas a locales · enero", descripcion: "Enero es flojo: la meta baja.", metrica: "visitas_locales", ...mes("90_dias", "2027-01-01", "2027-01-31"), meta: 30, responsable: "los_dos" },
  { clavePlan: "e1_demos", nombre: "Demos realizadas", descripcion: "6 por mes.", metrica: "demos", ...etapa(E1), meta: 18, responsable: "fabrizio" },
  { clavePlan: "e1_visitas_web_ene", nombre: "Visitas a la web en enero", descripcion: "Llegar a 1.500 visitantes por mes.", metrica: "visitas_web", ...mes("90_dias", "2027-01-01", "2027-01-31"), meta: 1_500, responsable: "michel" },
  { clavePlan: "e1_registros", nombre: "Registros web", descripcion: "20 por mes.", metrica: "registros", ...etapa(E1), meta: 60, responsable: "michel" },
  { clavePlan: "e1_instagram", nombre: "Publicaciones en Instagram", descripcion: "3 por semana. Se carga a mano.", metrica: "manual", ...mes("90_dias", "2026-11-01", "2026-11-30"), meta: 12, responsable: "fabrizio", seRepite: true, area: "comercial" },
  { clavePlan: "e1_clientes_verdes", nombre: "Clientes con salud verde en Núcleos", metrica: "clientes_verdes", ...etapa(E1), meta: 100, responsable: "michel" },
  { clavePlan: "e1_primer_contacto", nombre: "Tiempo hasta el primer contacto de un registro", descripcion: "Menos de 24 horas hábiles.", metrica: "tiempo_primer_contacto", ...etapa(E1), meta: 24, responsable: "fabrizio" },

  // ── Etapa 2 · Hasta los 6 meses: repetir la venta ──
  { clavePlan: "e2_clientes", nombre: "Clientes de sistema pagando", metrica: "clientes_activos", ...etapa(E2), meta: 10, responsable: "fabrizio" },
  { clavePlan: "e2_clientes_industria", nombre: "Clientes de industria", metrica: "clientes_activos", filtros: { nicho: "industria" }, ...etapa(E2), meta: 8, responsable: "fabrizio" },
  { clavePlan: "e2_clientes_gimnasios", nombre: "Clientes de gimnasios", descripcion: "Abrir gimnasios recién con 5 clientes de industria estables.", metrica: "clientes_activos", filtros: { nicho: "gimnasios" }, ...etapa(E2), meta: 2, responsable: "fabrizio" },
  { clavePlan: "e2_mrr", nombre: "MRR", descripcion: "Unos USD 1.200.", metrica: "mrr", ...etapa(E2), meta: 1_900_000, responsable: "fabrizio" },
  { clavePlan: "e2_mrr_industria", nombre: "MRR de industria", metrica: "mrr", filtros: { nicho: "industria" }, ...etapa(E2), meta: 1_740_000, responsable: "fabrizio" },
  { clavePlan: "e2_mrr_gimnasios", nombre: "MRR de gimnasios", metrica: "mrr", filtros: { nicho: "gimnasios" }, ...etapa(E2), meta: 160_000, responsable: "fabrizio" },
  { clavePlan: "e2_webs", nombre: "Webs vendidas (acumulado)", descripcion: "Desde el 1 de noviembre.", metrica: "proyectos_vendidos", filtros: { tipo: "web" }, etapa: "6_meses", tipoPeriodo: "rango", desde: "2026-11-01", hasta: "2027-04-30", meta: 6, responsable: "fabrizio" },
  { clavePlan: "e2_app", nombre: "Primer proyecto de app a medida", metrica: "proyectos_vendidos", filtros: { tipo: "app_a_medida" }, ...etapa(E2), meta: 1, responsable: "los_dos" },
  { clavePlan: "e2_facturacion", nombre: "Facturación de la etapa", descripcion: "$3.500.000 por mes de promedio.", metrica: "facturacion_cobrada", ...etapa(E2), meta: 10_500_000, responsable: "los_dos" },
  { clavePlan: "e2_visitas_locales", nombre: "Visitas a locales", descripcion: "70 por mes.", metrica: "visitas_locales", ...etapa(E2), meta: 210, responsable: "los_dos" },
  { clavePlan: "e2_demos", nombre: "Demos", descripcion: "10 por mes.", metrica: "demos", ...etapa(E2), meta: 30, responsable: "fabrizio" },
  { clavePlan: "e2_visitas_web_abr", nombre: "Visitas a la web en abril", metrica: "visitas_web", ...mes("6_meses", "2027-04-01", "2027-04-30"), meta: 4_000, responsable: "michel" },
  { clavePlan: "e2_registros", nombre: "Registros web", descripcion: "60 por mes.", metrica: "registros", ...etapa(E2), meta: 180, responsable: "michel" },
  { clavePlan: "e2_churn", nombre: "Churn mensual", descripcion: "Con 10 clientes: perder uno en el trimestre como máximo.", metrica: "churn_mensual", ...etapa(E2), meta: 3, responsable: "michel" },
  { clavePlan: "e2_recomendaciones", nombre: "Clientes que nos recomendaron a otro", metrica: "manual", ...etapa(E2), meta: 2, responsable: "fabrizio", area: "clientes" },
  { clavePlan: "e2_casos", nombre: "Casos publicados en la web (además de Ferremix)", metrica: "manual", ...etapa(E2), meta: 2, responsable: "michel", area: "web" },

  // ── Etapa 3 · A los 12 meses: un sistema que crece sin nosotros en cada paso ──
  { clavePlan: "e3_clientes", nombre: "Clientes de sistema pagando", metrica: "clientes_activos", ...etapa(E3), meta: 28, responsable: "fabrizio" },
  { clavePlan: "e3_clientes_industria", nombre: "Clientes de industria", metrica: "clientes_activos", filtros: { nicho: "industria" }, ...etapa(E3), meta: 20, responsable: "fabrizio" },
  { clavePlan: "e3_clientes_gimnasios", nombre: "Clientes de gimnasios", metrica: "clientes_activos", filtros: { nicho: "gimnasios" }, ...etapa(E3), meta: 7, responsable: "fabrizio" },
  { clavePlan: "e3_clientes_holistica", nombre: "Holística (piloto)", metrica: "clientes_activos", filtros: { nicho: "holistica" }, ...etapa(E3), meta: 1, responsable: "fabrizio" },
  { clavePlan: "e3_mrr", nombre: "MRR", descripcion: "Unos USD 3.200.", metrica: "mrr", ...etapa(E3), meta: 5_000_000, responsable: "fabrizio" },
  { clavePlan: "e3_mrr_industria", nombre: "MRR de industria", metrica: "mrr", filtros: { nicho: "industria" }, ...etapa(E3), meta: 4_300_000, responsable: "fabrizio" },
  { clavePlan: "e3_mrr_gimnasios", nombre: "MRR de gimnasios", metrica: "mrr", filtros: { nicho: "gimnasios" }, ...etapa(E3), meta: 560_000, responsable: "fabrizio" },
  { clavePlan: "e3_mrr_holistica", nombre: "MRR de holística (piloto)", metrica: "mrr", filtros: { nicho: "holistica" }, ...etapa(E3), meta: 150_000, responsable: "fabrizio" },
  { clavePlan: "e3_facturacion", nombre: "Facturación de la etapa", descripcion: "$8.000.000 por mes de promedio.", metrica: "facturacion_cobrada", ...etapa(E3), meta: 48_000_000, responsable: "los_dos" },
  { clavePlan: "e3_peso_recurrente", nombre: "Peso de los abonos en la facturación", descripcion: "Que los proyectos sean extra, no la base.", metrica: "peso_recurrente", ...etapa(E3), meta: 60, responsable: "los_dos" },
  { clavePlan: "e3_demos", nombre: "Demos", descripcion: "15 por mes.", metrica: "demos", ...etapa(E3), meta: 90, responsable: "fabrizio" },
  { clavePlan: "e3_visitas_web_oct", nombre: "Visitas a la web en octubre", metrica: "visitas_web", ...mes("12_meses", "2027-10-01", "2027-10-31"), meta: 10_000, responsable: "michel" },
  { clavePlan: "e3_registros", nombre: "Registros web", descripcion: "150 por mes.", metrica: "registros", ...etapa(E3), meta: 900, responsable: "michel" },
  { clavePlan: "e3_por_recomendacion", nombre: "Clientes nuevos por recomendación o por la web", descripcion: "No por visita en la calle. Se carga a mano.", metrica: "manual", ...etapa(E3), meta: 40, unidad: "porcentaje", acumulacion: "valor_al_cierre", responsable: "fabrizio", area: "clientes" },
  { clavePlan: "e3_churn", nombre: "Churn mensual", metrica: "churn_mensual", ...etapa(E3), meta: 2, responsable: "michel" },
  { clavePlan: "e3_implementacion", nombre: "Implementación de un cliente nuevo (días)", descripcion: "En menos de 7 días. Se carga a mano.", metrica: "manual", ...etapa(E3), meta: 7, acumulacion: "promedio", direccion: "menos_es_mejor", responsable: "michel", area: "clientes" },
  { clavePlan: "e3_contratacion", nombre: "Primera contratación", descripcion: "Soporte o desarrollo junior cuando el MRR llegue a $1.500.000.", metrica: "manual", ...etapa(E3), meta: 1, responsable: "los_dos", area: "clientes" },
];

/** Una meta del plan con todo completo (unidad, acumulación, dirección y área salen de la métrica si no se dieron). */
export function completarDelPlan(m: MetaDelPlan) {
  const metrica = METRICA[m.metrica];
  return {
    ...m,
    filtros: m.filtros ?? {},
    seRepite: m.seRepite ?? false,
    unidad: m.unidad ?? metrica.unidad,
    acumulacion: m.acumulacion ?? metrica.acumulacion,
    direccion: m.direccion ?? metrica.direccion,
    area: m.area ?? metrica.area,
  };
}
