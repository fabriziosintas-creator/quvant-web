import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { anomalia, cohortes, dosProporciones, funcionesQueRetienen, holtLineal, linkRecorrido, normalAcumulada, percentil, puntajeZ, recorridoCercano, wilson } from "./estadistica";

const cerca = (a: number, b: number, tolerancia = 0.005) => assert.ok(Math.abs(a - b) <= tolerancia, `${a} no está cerca de ${b}`);

describe("proporciones", () => {
  it("Wilson: 2 de 20 da un intervalo de 2,8 % a 30,1 %", () => {
    const w = wilson(2, 20)!;
    cerca(w.p, 0.1);
    cerca(w.bajo, 0.0279);
    cerca(w.alto, 0.3010);
    assert.equal(w.chica, false);
  });
  it("Wilson: con 0 casos no hay tasa, y con pocos avisa", () => {
    assert.equal(wilson(0, 0), null);
    assert.equal(wilson(1, 5)!.chica, true);
    assert.ok(wilson(0, 10)!.alto > 0, "con 0 éxitos el techo no es 0");
  });
  it("normal acumulada", () => {
    cerca(normalAcumulada(0), 0.5, 1e-6);
    cerca(normalAcumulada(1.96), 0.975, 1e-3);
  });
  it("dos proporciones: 10 % → 20 % con 500 casos cada una es una mejora real", () => {
    const c = dosProporciones(50, 500, 100, 500);
    assert.equal(c.veredicto, "mejoro");
    assert.ok(c.pValor < 0.001);
  });
  it("dos proporciones: 1 de 10 → 2 de 10 no alcanza para decir nada", () => {
    assert.equal(dosProporciones(1, 10, 2, 10).veredicto, "sin_cambio");
    assert.equal(dosProporciones(0, 0, 2, 10).veredicto, "sin_datos");
  });
});

describe("series", () => {
  it("percentiles con interpolación", () => {
    assert.equal(percentil([1, 2, 3, 4], 0.5), 2.5);
    assert.equal(percentil([10], 0.75), 10);
    assert.equal(percentil([], 0.5), null);
  });
  it("puntaje z y anomalías: necesita historia y que no sea plana", () => {
    assert.equal(puntajeZ(10, [1, 1]), null);
    assert.equal(puntajeZ(10, [5, 5, 5, 5]), null);
    const a = anomalia([10, 11, 9, 10, 12, 10, 40]);
    assert.equal(a?.tipo, "alza");
    assert.equal(anomalia([10, 11, 9, 10, 12, 10, 11]), null);
  });
  it("Holt: una recta perfecta se proyecta como recta, con banda angosta", () => {
    const p = holtLineal([100, 200, 300, 400, 500, 600], 2)!;
    cerca(p.valores[0], 700, 1);
    cerca(p.valores[1], 800, 1);
    assert.ok(p.alto[1] >= p.valores[1] && p.bajo[1] <= p.valores[1]);
  });
  it("Holt: con menos de 4 meses no proyecta, y nunca da negativo", () => {
    assert.equal(holtLineal([1, 2, 3], 3), null);
    const p = holtLineal([400, 300, 200, 100], 6)!;
    assert.ok(p.valores.every((v) => v >= 0) && p.bajo.every((v) => v >= 0));
  });
});

describe("cohortes", () => {
  it("retención por mes de entrada, y null para los meses que todavía no llegaron", () => {
    const c = cohortes(
      [
        { alta: "2026-07-05", baja: null },
        { alta: "2026-07-20", baja: "2026-08-15" },
        { alta: "2026-09-02", baja: null },
      ],
      "2026-10-20",
    );
    assert.equal(c[0].mes, "2026-07");
    assert.equal(c[0].tamano, 2);
    // Al 1 de agosto los dos seguían; al 1 de septiembre, uno.
    assert.deepEqual(c[0].retencion, [1, 0.5, 0.5, null]);
    assert.deepEqual(c[1].retencion, [1, null, null, null]);
  });
});

describe("recorrido del día", () => {
  it("va siempre al más cercano y corta en el máximo", () => {
    const origen = { latitud: -34.6, longitud: -58.4 };
    const puntos = [
      { id: "lejos", latitud: -34.7, longitud: -58.4 },
      { id: "cerca", latitud: -34.601, longitud: -58.4 },
      { id: "medio", latitud: -34.65, longitud: -58.4 },
    ];
    assert.deepEqual(recorridoCercano(origen, puntos).map((p) => p.id), ["cerca", "medio", "lejos"]);
    assert.equal(recorridoCercano(origen, puntos, 2).length, 2);
  });
  it("arma el link de Google Maps con paradas (solo un link)", () => {
    const l = linkRecorrido([{ id: "a", latitud: -34.6, longitud: -58.4 }, { id: "b", latitud: -34.7, longitud: -58.5 }])!;
    assert.ok(l.startsWith("https://www.google.com/maps/dir/?api=1&destination="));
    assert.ok(l.includes("waypoints="));
    assert.equal(linkRecorrido([]), null);
  });
});

describe("qué función acompaña a los que se quedan", () => {
  it("ordena por diferencia de permanencia (correlación)", () => {
    const socios = [
      { activo: true, usadas: ["caja", "conteo"] },
      { activo: true, usadas: ["caja"] },
      { activo: false, usadas: ["conteo"] },
      { activo: false, usadas: [] },
    ];
    const r = funcionesQueRetienen(socios, ["caja", "conteo"]);
    assert.equal(r[0].funcion, "caja");
    assert.equal(r[0].diferencia, 1);
  });
});
