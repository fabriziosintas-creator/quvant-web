import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { METRICA, METRICAS, calcularValor } from "./catalogo";
import { abonoPromedio, embudoAlReves, tasasReales } from "./embudo";
import { calcularAvance, resultadoDelCierre, serieReal } from "./estado";
import { contarDias, diaBA, limitesDelMes } from "./fechas";
import { PLAN_INICIAL, completarDelPlan } from "./plan";
import type { DatosObjetivos, Meta } from "./tipos";

const VACIO: DatosObjetivos = {
  cobros: [],
  tiposCambio: {},
  clientes: [],
  personas: [],
  visitantes: [],
  visitasLocales: [],
  locales: [],
  saludClientes: [],
  alertas: [],
  avances: [],
};

const meta = (parcial: Partial<Meta>): Meta => ({
  id: "m1",
  nombre: "Prueba",
  descripcion: null,
  metrica: "registros",
  filtros: {},
  area: "web",
  etapa: "libre",
  tipoPeriodo: "mes",
  desde: "2026-11-01",
  hasta: "2026-11-30",
  meta: 10,
  metaOriginal: 10,
  unidad: "numero",
  direccion: "mas_es_mejor",
  acumulacion: "suma_del_periodo",
  responsable: "los_dos",
  seRepite: false,
  orden: 1,
  archivada: false,
  clavePlan: null,
  esPrueba: false,
  ...parcial,
});

describe("fechas en Buenos Aires", () => {
  it("un registro a las 23:30 de Buenos Aires es de ese día, aunque en UTC ya sea el siguiente", () => {
    assert.equal(diaBA("2026-11-01T02:30:00Z"), "2026-10-31");
    assert.equal(diaBA("2026-11-01T03:00:00Z"), "2026-11-01");
  });
  it("cuenta días hábiles de lunes a viernes", () => {
    assert.equal(contarDias("2026-11-02", "2026-11-08", true), 5); // lunes a domingo
    assert.equal(contarDias("2026-11-02", "2026-11-08", false), 7);
  });
  it("sabe dónde termina cada mes", () => {
    assert.deepEqual(limitesDelMes("2027-02-14"), { desde: "2027-02-01", hasta: "2027-02-28" });
    assert.deepEqual(limitesDelMes("2026-12-31"), { desde: "2026-12-01", hasta: "2026-12-31" });
  });
});

describe("métricas", () => {
  const c = (parcial: Partial<Meta>, hoy = "2026-11-30") => calcularValor(datos, meta(parcial), hoy);
  const datos: DatosObjetivos = {
    ...VACIO,
    cobros: [
      { fecha: "2026-11-05", tipo: "abono_mensual", montoArs: 150_000, nicho: "industria", cobrado: true, cliente: "Ferremix" },
      { fecha: "2026-11-10", tipo: "web", montoArs: 1_000_000, nicho: null, cobrado: true, cliente: "Estudio Pérez" },
      { fecha: "2026-11-20", tipo: "web", montoArs: 500_000, nicho: null, cobrado: true, cliente: "estudio pérez " },
      { fecha: "2026-11-25", tipo: "implementacion", montoArs: 300_000, nicho: "industria", cobrado: false, cliente: "Ferremix" },
      { fecha: "2026-12-02", tipo: "abono_mensual", montoArs: 150_000, nicho: "industria", cobrado: true, cliente: "Ferremix" },
    ],
    tiposCambio: { "2026-11": 1_500 },
    clientes: [
      { id: "a", nicho: "industria", abono: 150_000, alta: "2026-10-15", baja: null },
      { id: "b", nicho: "industria", abono: 230_000, alta: "2026-11-10", baja: null },
      // Entra y sale en el mismo mes.
      { id: "c", nicho: "gimnasios", abono: 80_000, alta: "2026-11-03", baja: "2026-11-20" },
      // Estaba desde antes y se fue en el mes: esta sí es churn.
      { id: "d", nicho: "industria", abono: 150_000, alta: "2026-09-01", baja: "2026-11-15" },
    ],
    personas: [
      { creado: "2026-11-02", confirmado: "2026-11-02", nicho: "industria", objetivo: "mejorar_clientela" },
      { creado: "2026-11-15", confirmado: null, nicho: "gimnasios", objetivo: "hacer_web" },
      { creado: "2026-12-01", confirmado: "2026-12-01", nicho: "industria", objetivo: "hacer_web" },
    ],
    visitantes: [
      { dia: "2026-11-01", id: "v1" },
      { dia: "2026-11-02", id: "v1" },
      { dia: "2026-11-02", id: "v2" },
      { dia: "2026-11-03", id: "v3" },
      { dia: "2026-11-04", id: "v4" },
    ],
    visitasLocales: [
      { fecha: "2026-11-03", socio: "fabrizio", nicho: "industria", feedback: "bueno" },
      { fecha: "2026-11-04", socio: "michel", nicho: "industria", feedback: "malo" },
      { fecha: "2026-11-05", socio: "fabrizio", nicho: "gimnasios", feedback: "bueno" },
    ],
  };

  it("facturación: solo lo cobrado del período, con filtro de tipo", () => {
    assert.equal(c({ metrica: "facturacion_cobrada", unidad: "ars" }), 1_650_000);
    assert.equal(c({ metrica: "facturacion_cobrada", filtros: { tipo: "web" } }), 1_500_000);
  });
  it("facturación en dólares: con el tipo de cambio del mes; sin él, no se calcula", () => {
    assert.equal(c({ metrica: "facturacion_usd" }), 1_100);
    assert.equal(c({ metrica: "facturacion_usd", desde: "2026-12-01", hasta: "2026-12-31" }, "2026-12-31"), null);
  });
  it("MRR y activos al cierre: el que entró y salió en el mes no cuenta", () => {
    assert.equal(c({ metrica: "mrr", acumulacion: "valor_al_cierre" }), 380_000);
    assert.equal(c({ metrica: "clientes_activos", acumulacion: "valor_al_cierre" }), 2);
    assert.equal(c({ metrica: "clientes_activos", acumulacion: "valor_al_cierre", filtros: { nicho: "gimnasios" } }), 0);
  });
  it("altas del período cuentan aunque se hayan ido", () => {
    assert.equal(c({ metrica: "clientes_ganados" }), 2);
  });
  it("churn: bajas de los que ya estaban, sobre los activos al empezar, por mes", () => {
    // Al 31-oct había 2 activos (a y d); d se fue: 50 % en un mes.
    assert.equal(c({ metrica: "churn_mensual", acumulacion: "promedio", direccion: "menos_es_mejor" }), 50);
  });
  it("proyectos: una web pagada en dos cuotas cuenta una vez", () => {
    assert.equal(c({ metrica: "proyectos_vendidos" }), 1);
  });
  it("peso recurrente", () => {
    assert.equal(c({ metrica: "peso_recurrente", acumulacion: "promedio" }), 9.1);
  });
  it("visitas a la web: navegadores distintos del período", () => {
    assert.equal(c({ metrica: "visitas_web" }), 4);
  });
  it("registros y conversión", () => {
    assert.equal(c({ metrica: "registros" }), 2);
    assert.equal(c({ metrica: "registros", filtros: { nicho: "gimnasios" } }), 1);
    assert.equal(c({ metrica: "registros_confirmados" }), 1);
    assert.equal(c({ metrica: "conversion_web", acumulacion: "promedio" }), 50);
  });
  it("visitas a locales por socio y su feedback", () => {
    assert.equal(c({ metrica: "visitas_locales" }), 3);
    assert.equal(c({ metrica: "visitas_locales", filtros: { socio: "fabrizio" } }), 2);
    assert.equal(c({ metrica: "visitas_con_feedback_bueno", acumulacion: "promedio" }), 66.7);
  });
  it("período vacío: las sumas dan cero y las tasas no se calculan", () => {
    const vacio = (m: string, ac: Meta["acumulacion"] = "suma_del_periodo") => calcularValor(VACIO, meta({ metrica: m, acumulacion: ac }), "2026-11-30");
    assert.equal(vacio("registros"), 0);
    assert.equal(vacio("conversion_web", "promedio"), null);
    assert.equal(vacio("churn_mensual", "promedio"), null);
    assert.equal(vacio("salud_promedio_nucleos", "valor_al_cierre"), null);
  });
  it("manual: suma, último valor o promedio de lo cargado, solo de ese objetivo", () => {
    const conAvances: DatosObjetivos = { ...VACIO, avances: [{ metaId: "m1", fecha: "2026-11-03", valor: 2 }, { metaId: "m1", fecha: "2026-11-10", valor: 4 }, { metaId: "otro", fecha: "2026-11-10", valor: 99 }] };
    const v = (ac: Meta["acumulacion"]) => calcularValor(conAvances, meta({ metrica: "manual", acumulacion: ac }), "2026-11-30");
    assert.equal(v("suma_del_periodo"), 6);
    assert.equal(v("valor_al_cierre"), 4);
    assert.equal(v("promedio"), 3);
  });
  it("el catálogo no tiene claves repetidas y cada métrica dice de dónde sale", () => {
    assert.equal(new Set(METRICAS.map((m) => m.clave)).size, METRICAS.length);
    for (const m of METRICAS) assert.ok(m.explicacion.length > 10, m.clave);
  });
});

describe("estado", () => {
  const conRegistros = (n: number): DatosObjetivos => ({
    ...VACIO,
    personas: Array.from({ length: n }, (_, i) => ({ creado: `2026-11-${String(2 + (i % 10)).padStart(2, "0")}`, confirmado: null, nicho: "industria", objetivo: "hacer_web" })),
  });

  it("cumplido apenas se alcanza la meta, aunque el período siga abierto", () => {
    assert.equal(calcularAvance(conRegistros(10), meta({}), "2026-11-15").estado, "cumplido");
  });
  it("en camino, en riesgo y atrasado según el ritmo", () => {
    // A mitad de noviembre (en días corridos: 15 de 30) se esperaban 5.
    assert.equal(calcularAvance(conRegistros(5), meta({}), "2026-11-15").estado, "en_camino");
    assert.equal(calcularAvance(conRegistros(4), meta({}), "2026-11-15").estado, "en_riesgo");
    assert.equal(calcularAvance(conRegistros(2), meta({}), "2026-11-15").estado, "atrasado");
  });
  it("al empezar el período no juzga el ritmo", () => {
    assert.equal(calcularAvance(VACIO, meta({}), "2026-11-02").estado, "en_camino");
  });
  it("al cerrar: cumplido o no cumplido", () => {
    const a = calcularAvance(conRegistros(7), meta({}), "2026-12-05");
    assert.equal(a.estado, "no_cumplido");
    assert.equal(a.abierto, false);
    assert.equal(resultadoDelCierre(meta({}), 10), "cumplido");
  });
  it("proyección al ritmo actual", () => {
    const a = calcularAvance(conRegistros(5), meta({}), "2026-11-15");
    assert.equal(a.proyeccion, 10);
    assert.equal(a.falta, 5);
  });
  it("menos es mejor: quedar por debajo es cumplir", () => {
    const m = meta({ metrica: "manual", acumulacion: "promedio", direccion: "menos_es_mejor", meta: 24 });
    const d = (v: number): DatosObjetivos => ({ ...VACIO, avances: [{ metaId: "m1", fecha: "2026-11-03", valor: v }] });
    assert.equal(calcularAvance(d(20), m, "2026-11-15").estado, "en_camino");
    assert.equal(calcularAvance(d(25), m, "2026-11-15").estado, "en_riesgo");
    assert.equal(calcularAvance(d(40), m, "2026-11-15").estado, "atrasado");
    assert.equal(calcularAvance(d(20), m, "2026-12-15").estado, "cumplido");
    assert.equal(calcularAvance(d(30), m, "2026-12-15").estado, "no_cumplido");
  });
  it("valor al cierre: compara contra la recta desde el valor al empezar", () => {
    const datos: DatosObjetivos = { ...VACIO, clientes: [{ id: "a", nicho: "industria", abono: 100, alta: "2026-10-01", baja: null }, { id: "b", nicho: "industria", abono: 100, alta: "2026-11-05", baja: null }] };
    const m = meta({ metrica: "clientes_activos", acumulacion: "valor_al_cierre", meta: 3, unidad: "numero" });
    const a = calcularAvance(datos, m, "2026-11-16");
    assert.equal(a.inicio, 1);
    assert.equal(a.valor, 2);
    assert.equal(a.estado, "en_camino");
  });
  it("sin datos para una tasa: sin_datos, no atrasado", () => {
    assert.equal(calcularAvance(VACIO, meta({ metrica: "conversion_web", acumulacion: "promedio", meta: 2 }), "2026-11-20").estado, "sin_datos");
  });
  it("la serie real va día por día hasta hoy", () => {
    const s = serieReal(conRegistros(3), meta({}), "2026-11-04");
    assert.deepEqual(s.map((p) => p.valor), [0, 1, 2, 3]);
  });
});

describe("embudo al revés", () => {
  it("sin datos propios usa las tasas del plan: 1 cliente = 4 demos ≈ 34 visitas o 27 registros", () => {
    const tasas = tasasReales(VACIO, "2026-11-30", []);
    assert.equal(tasas.demoACliente.propia, false);
    const e = embudoAlReves(meta({ metrica: "clientes_activos" }), 1, tasas, 150_000);
    assert.deepEqual([e.clientes, e.demos, e.visitasLocales, e.registros], [1, 4, 34, 27]);
  });
  it("el MRR que falta se pasa a clientes con el abono promedio", () => {
    const tasas = tasasReales(VACIO, "2026-11-30", []);
    const e = embudoAlReves(meta({ metrica: "mrr", unidad: "ars" }), 400_000, tasas, abonoPromedio(VACIO, "2026-11-30"));
    assert.equal(e.clientes, 3);
    assert.equal(e.abonoUsado, 150_000);
  });
});

describe("plan inicial", () => {
  it("todas las metas usan métricas del catálogo, con fechas válidas y claves únicas", () => {
    assert.equal(new Set(PLAN_INICIAL.map((m) => m.clavePlan)).size, PLAN_INICIAL.length);
    for (const m of PLAN_INICIAL) {
      assert.ok(METRICA[m.metrica], `${m.clavePlan}: métrica ${m.metrica}`);
      assert.ok(m.desde <= m.hasta, m.clavePlan);
      const completa = completarDelPlan(m);
      for (const f of Object.keys(completa.filtros)) assert.ok(METRICA[m.metrica].filtros.includes(f as never), `${m.clavePlan}: filtro ${f}`);
    }
  });
  it("vende fabrizio: los clientes y el MRR son suyos; la web y los registros, de Michel", () => {
    const de = (clave: string) => PLAN_INICIAL.find((m) => m.clavePlan === clave)!.responsable;
    assert.equal(de("e1_clientes"), "fabrizio");
    assert.equal(de("e1_mrr"), "fabrizio");
    assert.equal(de("e1_registros"), "michel");
    assert.equal(de("e1_visitas_web_ene"), "michel");
  });
});
