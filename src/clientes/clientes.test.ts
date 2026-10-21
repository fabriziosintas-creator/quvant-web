import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faltasDeConstancia, modulosDe, organizacionValida, permisoVigente } from "./clientes";

describe("clientes", () => {
  it("cada plantilla tiene sus módulos, sin los que van siempre", () => {
    const industria = modulosDe("industria");
    const gimnasios = modulosDe("gimnasios");
    assert.ok(industria.includes("mostrador"));
    assert.ok(!industria.includes("socios"));
    assert.ok(gimnasios.includes("socios"));
    assert.ok(!industria.includes("sesion") && !gimnasios.includes("tablero"));
  });

  it("la última constancia manda", () => {
    const h = [
      { accion: "prendido" as const, fecha: "2026-10-01", quien: "Ana", medio: "contrato", detalle: null, creadoEn: "2026-10-01T10:00:00Z" },
      { accion: "apagado" as const, fecha: "2026-10-10", quien: "Ana", medio: "email", detalle: null, creadoEn: "2026-10-10T10:00:00Z" },
    ];
    assert.equal(permisoVigente(h)?.accion, "apagado");
    assert.equal(permisoVigente([]), null);
  });

  it("sin fecha, quién y medio no hay constancia", () => {
    assert.deepEqual(faltasDeConstancia({ fecha: "2026-10-20", quien: "Ana, dueña", medio: "contrato", detalle: "" }, "2026-10-21"), []);
    assert.deepEqual(faltasDeConstancia({ fecha: "2026-10-30", quien: " ", medio: "fax", detalle: "" }, "2026-10-21"), ["fecha", "quien", "medio"]);
    assert.deepEqual(faltasDeConstancia({ fecha: "2026-10-20", quien: "Ana", medio: "otro", detalle: "" }, "2026-10-21"), ["detalle"]);
  });

  it("el identificador de organización es corto y sin espacios", () => {
    assert.ok(organizacionValida("org_123"));
    assert.ok(!organizacionValida("org 123"));
    assert.ok(!organizacionValida(""));
  });
});
