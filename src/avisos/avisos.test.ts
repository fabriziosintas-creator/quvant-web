import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { agrupar, avisoDeObjetivo } from "./avisos";

describe("avisos de objetivos", () => {
  it("avisa cuando baja de en camino a en riesgo o atrasado", () => {
    assert.equal(avisoDeObjetivo("en_camino", "en_riesgo"), "objetivo_en_riesgo");
    assert.equal(avisoDeObjetivo("en_camino", "atrasado"), "objetivo_en_riesgo");
  });
  it("no repite si ya estaba mal, ni avisa sin foto anterior", () => {
    assert.equal(avisoDeObjetivo("en_riesgo", "atrasado"), null);
    assert.equal(avisoDeObjetivo(null, "atrasado"), null);
    assert.equal(avisoDeObjetivo("atrasado", "atrasado"), null);
  });
  it("festeja cuando se cumple", () => {
    assert.equal(avisoDeObjetivo("en_camino", "cumplido"), "objetivo_cumplido");
  });
});

describe("agrupar por día (Buenos Aires)", () => {
  it("hoy, ayer y antes; los vacíos no van", () => {
    const ahora = "2026-10-22T18:00:00Z";
    const g = agrupar(
      [
        { id: 1, creadoEn: "2026-10-22T13:00:00Z" },
        { id: 2, creadoEn: "2026-10-22T02:00:00Z" }, // 21-oct a las 23 h de Buenos Aires: ayer
        { id: 3, creadoEn: "2026-10-10T12:00:00Z" },
      ],
      ahora,
    );
    assert.deepEqual(g.map((x) => [x.grupo, x.avisos.map((a) => a.id)]), [["hoy", [1]], ["ayer", [2]], ["antes", [3]]]);
    assert.deepEqual(agrupar([], ahora), []);
  });
});
