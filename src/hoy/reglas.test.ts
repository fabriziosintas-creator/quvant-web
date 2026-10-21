import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armarHoy, resumirDia, type EntradaHoy } from "./reglas";

// Jueves 22-oct-2026, 15 h de Buenos Aires.
const AHORA = "2026-10-22T18:00:00Z";
const base: EntradaHoy = {
  ahora: AHORA,
  hoy: "2026-10-22",
  mes: "2026-10",
  oportunidades: [],
  actividades: [],
  locales: [],
  objetivos: [],
  socios: [],
  sociosDeEjemplo: false,
  charlas: [],
  cobrosPendientes: [],
  abonosSinCargar: [],
  hayTipoCambio: true,
  pospuestas: new Set(),
};
const op = (id: string, creadoEn: string, extra: Partial<NonNullable<EntradaHoy["oportunidades"]>[number]> = {}) => ({ id, negocio: `Negocio ${id}`, etapa: "nuevo", creadoEn, telefono: null, proximoPaso: null, proximoFecha: null, ...extra });

describe("Hoy", () => {
  it("un día sin nada no tiene tarjetas", () => {
    assert.deepEqual(armarHoy(base), []);
  });
  it("registros sin contactar después de 24 horas hábiles (no los recién llegados ni los ya llamados)", () => {
    const t = armarHoy({
      ...base,
      oportunidades: [op("viejo", "2026-10-20T13:00:00Z"), op("nuevo", "2026-10-22T12:00:00Z"), op("llamado", "2026-10-19T13:00:00Z")],
      actividades: [{ oportunidadId: "llamado", tipo: "llamada", etapaAnterior: null, etapaNueva: null, creadoEn: "2026-10-19T15:00:00Z" }],
    });
    assert.equal(t[0].tipo, "sin_contactar");
    assert.equal(t[0].cantidad, 1);
    assert.equal(t[0].items[0].id, "viejo");
  });
  it("próximos pasos: los vencidos son urgentes; los de hoy, para hoy", () => {
    const vencido = armarHoy({ ...base, oportunidades: [op("a", AHORA, { etapa: "propuesta", proximoFecha: "2026-10-20" })] });
    assert.equal(vencido[0].urgencia, 0);
    const deHoy = armarHoy({ ...base, oportunidades: [op("a", AHORA, { etapa: "propuesta", proximoFecha: "2026-10-22" })] });
    assert.equal(deHoy[0].urgencia, 1);
  });
  it("los socios de ejemplo no generan tarjetas", () => {
    const socios = [{ id: "s", nombre: "Socio", semaforo: "rojo", alertasNuevas: 0, href: "/x" }];
    assert.equal(armarHoy({ ...base, socios, sociosDeEjemplo: true }).length, 0);
    assert.equal(armarHoy({ ...base, socios }).length, 1);
  });
  it("lo pospuesto no aparece; la urgencia ordena", () => {
    const entrada: EntradaHoy = {
      ...base,
      hayTipoCambio: false,
      objetivos: [{ id: "o", nombre: "Registros", estado: "atrasado", ritmo: "faltan 12" }],
      charlas: [{ id: "c", nombre: "Ana", espera: false, noLeidos: 2 }],
    };
    const t = armarHoy(entrada);
    assert.deepEqual(t.map((x) => x.tipo), ["objetivos", "chat", "tipo_cambio"]);
    assert.deepEqual(resumirDia(t), { urgentes: 1, paraHoy: 1 });
    assert.equal(armarHoy({ ...entrada, pospuestas: new Set(["objetivos"]) }).length, 2);
  });
  it("sin el seguimiento comercial (tabla sin aplicar), esas tarjetas no se arman", () => {
    assert.deepEqual(armarHoy({ ...base, oportunidades: null }), []);
  });
});
