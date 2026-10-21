import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contarHitos, diasEnEtapa, embudoComercial, estancada, etapaMaxima, horasAlPrimerContacto, horasHabiles, linkWhatsApp, tiempoPorEtapa, valorPonderado, type Actividad } from "./comercial";

// 2026-10-23 es viernes; 24 y 25 son fin de semana.
const ba = (dia: string, hora: string) => new Date(`${dia}T${hora}:00-03:00`).toISOString();
const cambio = (op: string, de: string | null, a: string, cuando: string): Actividad => ({ oportunidadId: op, tipo: "cambio_etapa", etapaAnterior: de, etapaNueva: a, creadoEn: cuando });

describe("horas hábiles", () => {
  it("un día de semana completo son 24 horas; el fin de semana no cuenta", () => {
    assert.equal(horasHabiles(ba("2026-10-23", "00:00"), ba("2026-10-24", "00:00")), 24);
    assert.equal(horasHabiles(ba("2026-10-24", "00:00"), ba("2026-10-26", "00:00")), 0);
    assert.equal(horasHabiles(ba("2026-10-23", "18:00"), ba("2026-10-26", "09:00")), 15);
  });
  it("días en la etapa y estancadas", () => {
    const o = { etapa: "nuevo" as const, etapaDesde: ba("2026-10-20", "10:00") };
    assert.equal(diasEnEtapa(o, ba("2026-10-23", "10:00")), 3);
    assert.equal(estancada(o, ba("2026-10-23", "10:00")), true);
    assert.equal(estancada({ etapa: "propuesta", etapaDesde: o.etapaDesde }, ba("2026-10-23", "10:00")), false);
  });
});

describe("valor y embudo", () => {
  it("valor ponderado: solo lo abierto, abono por 12 más proyecto, por la probabilidad", () => {
    const v = valorPonderado([
      { etapa: "propuesta", probabilidad: null, valorAbono: 100_000, valorProyecto: 0 },
      { etapa: "nuevo", probabilidad: 50, valorAbono: null, valorProyecto: 1_000_000 },
      { etapa: "ganado", probabilidad: null, valorAbono: 999_999, valorProyecto: null },
    ]);
    assert.equal(v, 1_200_000 * 0.5 + 1_000_000 * 0.5);
  });
  it("la etapa más avanzada cuenta aunque después se haya perdido", () => {
    const acts = [cambio("a", "nuevo", "demo_hecha", "2026-10-01T12:00:00Z"), cambio("a", "demo_hecha", "perdido", "2026-10-05T12:00:00Z")];
    assert.equal(etapaMaxima({ id: "a", etapa: "perdido" }, acts), 3);
  });
  it("embudo: cuántas llegaron a cada etapa y la tasa desde la anterior", () => {
    const ops = [
      { id: "a", etapa: "ganado" as const },
      { id: "b", etapa: "demo_hecha" as const },
      { id: "c", etapa: "nuevo" as const },
      { id: "d", etapa: "contactado" as const },
    ];
    const e = embudoComercial(ops, []);
    assert.equal(e[0].llegaron, 4);
    assert.equal(e[1].llegaron, 3);
    assert.equal(e[3].llegaron, 2);
    assert.equal(e[6].etapa, "ganado");
    assert.equal(e[6].llegaron, 1);
    assert.equal(e[1].tasa?.p, 0.75);
  });
  it("tiempo promedio en cada etapa", () => {
    const creadas = new Map([["a", ba("2026-10-19", "00:00")]]);
    const t = tiempoPorEtapa([cambio("a", "nuevo", "contactado", ba("2026-10-21", "00:00")), cambio("a", "contactado", "demo_hecha", ba("2026-10-22", "00:00"))], creadas);
    assert.equal(t.nuevo, 2);
    assert.equal(t.contactado, 1);
  });
});

describe("contacto, hitos y WhatsApp", () => {
  it("horas hábiles al primer contacto (las notas no cuentan)", () => {
    const acts: Actividad[] = [
      { oportunidadId: "a", tipo: "nota", etapaAnterior: null, etapaNueva: null, creadoEn: ba("2026-10-20", "10:00") },
      { oportunidadId: "a", tipo: "llamada", etapaAnterior: null, etapaNueva: null, creadoEn: ba("2026-10-20", "15:00") },
    ];
    assert.equal(horasAlPrimerContacto({ id: "a", creadoEn: ba("2026-10-20", "09:00") }, acts), 6);
    assert.equal(horasAlPrimerContacto({ id: "b", creadoEn: ba("2026-10-20", "09:00") }, acts), null);
  });
  it("demos del período: una por oportunidad y día, sea actividad o cambio de etapa", () => {
    const dia = (iso: string) => iso.slice(0, 10);
    const acts: Actividad[] = [
      { oportunidadId: "a", tipo: "demo", etapaAnterior: null, etapaNueva: null, creadoEn: "2026-10-20T15:00:00Z" },
      cambio("a", "demo_agendada", "demo_hecha", "2026-10-20T16:00:00Z"),
      cambio("b", "demo_agendada", "demo_hecha", "2026-10-21T16:00:00Z"),
      cambio("c", "demo_agendada", "demo_hecha", "2026-11-02T16:00:00Z"),
    ];
    assert.equal(contarHitos(acts, "demo", "2026-10-01", "2026-10-31", dia), 2);
  });
  it("el link de WhatsApp arma el 549 argentino", () => {
    assert.equal(linkWhatsApp("011 15 2481-1956", "hola")?.startsWith("https://wa.me/549"), true);
    assert.equal(linkWhatsApp("+54 9 11 2481 1956", "hola"), "https://wa.me/5491124811956?text=hola");
    assert.equal(linkWhatsApp(null, "x"), null);
  });
});
