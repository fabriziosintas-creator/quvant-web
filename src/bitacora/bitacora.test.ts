import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describir, enlaceDe, lineasDe, motivoNoDeshacer, valorLegible, type Entrada, type Textos } from "./bitacora";

const T: Textos = {
  sistema: "El sistema",
  frases: {
    alta: "{quien} cargó {que} {de}",
    baja: "{quien} borró {que} {de}",
    cambioUno: "{quien} cambió {campo} de {de}: {antes} → {despues}",
    cambioVarios: "{quien} cambió {n} datos de {de}",
    deshacer: "{quien} deshizo un cambio en {de}",
    ingreso: "{quien} entró al panel",
    exportacion: "{quien} exportó {que}",
  },
  tablas: { locales: "el local", oportunidades: "la oportunidad" },
  campos: { estado: "el estado" },
  valores: { visitado: "visitado", interesado: "interesado" },
  si: "sí",
  no: "no",
  vacio: "—",
};

const base: Entrada = { id: 1, creadoEn: "2026-10-21T10:00:00Z", quien: "u1", sistema: false, tabla: "locales", registroId: "abc", accion: "cambio", cambios: { estado: ["visitado", "interesado"] }, detalle: null, resumen: "Ferretería Norte" };

describe("bitácora", () => {
  it("un cambio de un campo se dice en una frase", () => {
    assert.equal(describir(base, "Fabrizio", T), "Fabrizio cambió el estado de Ferretería Norte: visitado → interesado");
  });

  it("varios campos, cuántos; y sin usuario es el sistema", () => {
    const e = { ...base, quien: null, sistema: true, cambios: { estado: ["a", "b"], proxima_visita: [null, "2026-10-30"] } };
    assert.equal(describir(e, null, T), "El sistema cambió 2 datos de Ferretería Norte");
    assert.deepEqual(lineasDe(e, T)[1], { campo: "proxima visita", antes: "—", despues: "2026-10-30" });
  });

  it("altas y bajas", () => {
    assert.equal(describir({ ...base, accion: "alta", cambios: { nombre: "X" } }, "Michel", T), "Michel cargó el local Ferretería Norte");
    assert.equal(describir({ ...base, accion: "baja" }, "Michel", T), "Michel borró el local Ferretería Norte");
  });

  it("valores legibles", () => {
    assert.equal(valorLegible(true, T), "sí");
    assert.equal(valorLegible(["a", "b"], T), "a, b");
    assert.equal(valorLegible("2026-10-21T10:30:00.123+00:00", T), "2026-10-21 10:30");
    assert.equal(valorLegible("x".repeat(100), T).length, 80);
  });

  it("cada registro lleva a su ficha", () => {
    assert.equal(enlaceDe(base), "/panel/mapa?local=abc");
    assert.equal(enlaceDe({ ...base, tabla: "visitas", accion: "alta", cambios: { local_id: "l1" } }), "/panel/mapa?local=l1");
    assert.equal(enlaceDe({ ...base, accion: "baja" }), null);
  });

  it("qué se puede deshacer", () => {
    assert.equal(motivoNoDeshacer(base), null);
    assert.equal(motivoNoDeshacer({ ...base, accion: "baja" }), "baja");
    assert.equal(motivoNoDeshacer({ ...base, cambios: { email: ["a•••", "b•••"] } }), "enmascarado");
    assert.equal(motivoNoDeshacer({ ...base, tabla: "perfiles" }), "tabla");
  });
});
