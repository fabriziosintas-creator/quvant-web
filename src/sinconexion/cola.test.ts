import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aplicarRespuesta, contarPorTipo, espera, nuevaOperacion, paraMandar, sinRepetidas } from "./cola";

const op = (clave: string, creadaEn: string, tipo: "visita" | "estado" | "local" = "visita") => nuevaOperacion(clave, tipo, { local_id: "x" }, "Prueba", creadaEn);

describe("cola sin señal", () => {
  it("cada operación lleva su clave en los datos", () => {
    assert.equal(op("a", "2026-10-21T10:00:00Z").datos.clave_cliente, "a");
  });

  it("se manda en el orden en que se cargó", () => {
    const cola = [op("c", "2026-10-21T10:02:00Z"), op("a", "2026-10-21T10:00:00Z"), op("b", "2026-10-21T10:01:00Z")];
    assert.deepEqual(paraMandar(cola, "2026-10-21T11:00:00Z").map((o) => o.clave), ["a", "b", "c"]);
  });

  it("después de fallar por la red, espera cada vez más antes de reintentar", () => {
    const fallo = aplicarRespuesta(op("a", "2026-10-21T10:00:00Z"), { resultado: "sin_red" }, "2026-10-21T10:00:00Z")!;
    assert.equal(fallo.intentos, 1);
    assert.equal(paraMandar([fallo], "2026-10-21T10:00:03Z").length, 0);
    assert.equal(paraMandar([fallo], "2026-10-21T10:00:06Z").length, 1);
    assert.equal(paraMandar([fallo], "2026-10-21T10:00:03Z", true).length, 1);
    assert.equal(espera(30), 10 * 60 * 1000);
  });

  it("lo que llegó se borra; lo rechazado queda, marcado y sin mandarse solo", () => {
    assert.equal(aplicarRespuesta(op("a", "2026-10-21T10:00:00Z"), { resultado: "ok" }, "2026-10-21T10:00:00Z"), null);
    const rechazada = aplicarRespuesta(op("b", "2026-10-21T10:00:00Z"), { resultado: "rechazada", motivo: "El local fue borrado." }, "2026-10-21T10:01:00Z")!;
    assert.equal(rechazada.estado, "rechazada");
    assert.equal(rechazada.motivo, "El local fue borrado.");
    assert.equal(paraMandar([rechazada], "2026-10-22T10:00:00Z").length, 0);
  });

  it("sin sesión no cuenta como intento", () => {
    const o = op("a", "2026-10-21T10:00:00Z");
    assert.deepEqual(aplicarRespuesta(o, { resultado: "sin_sesion" }, "2026-10-21T10:05:00Z"), o);
  });

  it("no duplica la misma clave y cuenta por tipo", () => {
    const cola = sinRepetidas([op("a", "2026-10-21T10:00:00Z"), op("a", "2026-10-21T10:00:00Z"), op("b", "2026-10-21T10:00:00Z", "local")]);
    assert.equal(cola.length, 2);
    assert.deepEqual(contarPorTipo(cola), { visita: 1, estado: 0, local: 1 });
  });
});
